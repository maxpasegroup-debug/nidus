import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { getRedis, isRedisReady } from "../config/redis.js";
import { createCsrfToken, csrfCookieOptions, parseCookies } from "../modules/auth/auth.cookies.js";
import { logger } from "../utils/logger.js";

const localRateLimit = new Map<string, { count: number; expiresAt: number }>();

function redisBackedRateLimiter(name: string, windowMs: number, limit: number, message: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate:${name}:${req.ip ?? "unknown"}`;
    const redis = getRedis();

    try {
      if (redis && isRedisReady()) {
        const count = await redis.incr(key);
        if (count === 1) await redis.pexpire(key, windowMs);
        const ttl = await redis.pttl(key);
        res.setHeader("RateLimit-Limit", String(limit));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - count)));
        res.setHeader("RateLimit-Reset", String(Math.ceil(Math.max(ttl, 0) / 1000)));
        if (count > limit) {
          logger.warn("Redis-backed rate limit exceeded", { name, ip: req.ip, path: req.path });
          res.status(429).json({ message });
          return;
        }
        next();
        return;
      }
    } catch (error) {
      logger.warn("Redis rate limiter failed; using local fallback", { name, error: error instanceof Error ? error.message : "Unknown error" });
    }

    const now = Date.now();
    const current = localRateLimit.get(key);
    const nextRecord = !current || current.expiresAt < now ? { count: 1, expiresAt: now + windowMs } : { count: current.count + 1, expiresAt: current.expiresAt };
    localRateLimit.set(key, nextRecord);
    if (nextRecord.count > limit) {
      logger.warn("Local rate limit exceeded", { name, ip: req.ip, path: req.path });
      res.status(429).json({ message });
      return;
    }
    next();
  };
}

export const apiRateLimiter = redisBackedRateLimiter("api", 15 * 60 * 1000, 300, "Too many requests. Please try again later.");
export const authRateLimiter = redisBackedRateLimiter("auth", 15 * 60 * 1000, 30, "Too many authentication attempts. Please wait before retrying.");
export const aiRateLimiter = redisBackedRateLimiter("ai", 60 * 1000, 30, "Too many AI requests. Please slow down.");
export const paymentsRateLimiter = redisBackedRateLimiter("payments", 60 * 1000, 40, "Too many payment requests. Please slow down.");
export const uploadRateLimiter = redisBackedRateLimiter("uploads", 60 * 1000, 20, "Too many uploads. Please slow down.");

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
