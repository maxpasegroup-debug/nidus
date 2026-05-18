import type { NextFunction, Request, Response } from "express";
import { getRedis, isRedisReady } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const localRateLimit = new Map<string, { count: number; expiresAt: number }>();

async function withTimeout<T>(operation: Promise<T>, timeoutMs = 1000): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`Rate limiter Redis operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function redisBackedRateLimiter(name: string, windowMs: number, limit: number, message: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate:${name}:${req.ip ?? "unknown"}`;
    const redis = getRedis();

    try {
      if (redis && isRedisReady()) {
        const count = await withTimeout(redis.incr(key));
        if (count === 1) await withTimeout(redis.pexpire(key, windowMs));
        const ttl = await withTimeout(redis.pttl(key));
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

export function requireSafeContentType(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api") || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  if (req.path === "/api/payments/webhook") {
    next();
    return;
  }

  const contentType = req.headers["content-type"] ?? "";
  const allowed =
    typeof contentType === "string" &&
    (contentType.includes("application/json") || contentType.includes("multipart/form-data"));

  if (!allowed) {
    res.status(415).json({ success: false, message: "Unsupported content type", code: 415 });
    return;
  }

  next();
}
