import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
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

export function csrfPlaceholder(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-CSRF-Protection-Mode", "placeholder-token-strategy");
  next();
}
