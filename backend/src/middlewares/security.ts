import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { createCsrfToken, csrfCookieOptions, parseCookies } from "../modules/auth/auth.cookies.js";
import { logger } from "../utils/logger.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", { ip: req.ip, path: req.path });
    res.status(429).json({ message: "Too many requests. Please try again later." });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Authentication rate limit exceeded", { ip: req.ip, path: req.path });
    res.status(429).json({ message: "Too many authentication attempts. Please wait before retrying." });
  }
});

const suspiciousPatterns = [
  /<script/i,
  /union\s+select/i,
  /\.\.\//,
  /javascript:/i,
  /onerror\s*=/i
];

function hasSuspiciousInput(value: unknown): boolean {
  if (typeof value === "string") return suspiciousPatterns.some((pattern) => pattern.test(value));
  if (Array.isArray(value)) return value.some(hasSuspiciousInput);
  if (value && typeof value === "object") return Object.values(value).some(hasSuspiciousInput);
  return false;
}

export function suspiciousActivityLogger(req: Request, _res: Response, next: NextFunction) {
  if (hasSuspiciousInput(req.body) || hasSuspiciousInput(req.query)) {
    logger.warn("Suspicious request input detected", {
      ip: req.ip,
      method: req.method,
      path: req.path
    });
  }

  next();
}

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function allowedOrigins() {
  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function requestOrigin(req: Request) {
  const origin = req.headers.origin;
  if (origin) return origin;

  const referer = req.headers.referer;
  if (!referer) return undefined;

  try {
    return new URL(referer).origin;
  } catch (_error) {
    return undefined;
  }
}

function ensureCsrfCookie(req: Request, res: Response) {
  const cookies = parseCookies(req);
  const existing = cookies.get(env.CSRF_COOKIE_NAME);
  const token = existing || createCsrfToken();
  res.cookie(env.CSRF_COOKIE_NAME, token, csrfCookieOptions());
  return token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const cookieToken = ensureCsrfCookie(req, res);

  if (safeMethods.has(req.method)) {
    res.setHeader("X-CSRF-Protection-Mode", "double-submit-cookie");
    next();
    return;
  }

  const origin = requestOrigin(req);
  if (!origin || !allowedOrigins().includes(origin)) {
    logger.warn("CSRF origin rejected", { ip: req.ip, method: req.method, path: req.path, origin });
    res.status(403).json({ message: "Invalid request origin" });
    return;
  }

  const headerToken = req.headers["x-csrf-token"];
  if (typeof headerToken !== "string" || headerToken.length < 32 || headerToken !== cookieToken) {
    logger.warn("CSRF token rejected", { ip: req.ip, method: req.method, path: req.path });
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }

  res.setHeader("X-CSRF-Protection-Mode", "double-submit-cookie");
  next();
}
