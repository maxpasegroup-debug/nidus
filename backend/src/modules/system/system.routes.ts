import { Router } from "express";
import { cacheConfig } from "../../config/cache.js";
import { assertCloudinaryReady } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { prismaBackupConfig, verifyDatabaseConnection } from "../../config/prisma.js";
import { isRedisReady, verifyRedisConnection } from "../../config/redis.js";
import { getRuntimeState } from "../../runtime/lifecycle.js";
import { logger } from "../../utils/logger.js";

export const systemRouter = Router();

const STATUS_TIMEOUT_MS = 3500;

async function probe<T>(name: string, operation: () => Promise<T> | T, fallback: T, timeoutMs = STATUS_TIMEOUT_MS): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const startedAt = Date.now();

  try {
    const result = await Promise.race([
      Promise.resolve().then(operation),
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`${name} status probe timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
    logger.info("System status probe completed", { probe: name, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    logger.warn("System status probe degraded", { probe: name, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : "Unknown error" });
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

systemRouter.get("/status", async (_req, res) => {
  const startedAt = Date.now();
  logger.info("System status request started");

  const [databaseConnected, redisConnected, cloudinaryReady, sentryConfigured] = await Promise.all([
    probe("database", verifyDatabaseConnection, false),
    probe("redis", verifyRedisConnection, false),
    probe("cloudinary", () => assertCloudinaryReady(), false),
    probe("sentry", () => Boolean(env.SENTRY_DSN), false, 100)
  ]);

  const queueAvailable = redisConnected || isRedisReady();
  const queueStatus = queueAvailable ? "available" : env.REDIS_REQUIRED ? "degraded" : "not_configured";
  const operational = databaseConnected && (!env.REDIS_REQUIRED || redisConnected);
  const response = {
    status: operational ? "ok" : "degraded",
    service: "nidus-backend",
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    runtime: getRuntimeState(),
    database: databaseConnected ? "connected" : "degraded",
    redis: redisConnected ? "connected" : cacheConfig.mode === "memory-fallback" ? "not_configured" : "degraded",
    queue: queueStatus,
    cloudinary: cloudinaryReady ? "ready" : "not_configured",
    checks: {
      database: databaseConnected ? "CONNECTED" : "DEGRADED",
      cache: redisConnected ? "REDIS_CONNECTED" : cacheConfig.mode,
      queue: queueStatus.toUpperCase(),
      cloudinary: cloudinaryReady ? "READY" : "NOT_CONFIGURED",
      email: env.RESEND_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      payments: env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET ? "CONFIGURED" : "NOT_CONFIGURED",
      ai: env.OPENAI_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      sentry: sentryConfigured ? "CONFIGURED" : "DISABLED",
      backups: prismaBackupConfig.provider,
      maintenanceMode: env.MAINTENANCE_MODE
    }
  };

  logger.info("System status request finished", { status: response.status, durationMs: response.durationMs });
  res.json(response);
});
