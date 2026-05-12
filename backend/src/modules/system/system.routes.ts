import { Router } from "express";
import { cacheConfig } from "../../config/cache.js";
import { assertCloudinaryReady } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { prismaBackupConfig, verifyDatabaseConnection } from "../../config/prisma.js";
import { verifyRedisConnection } from "../../config/redis.js";
import { isQueueAvailable } from "../../queues/queue.config.js";

export const systemRouter = Router();

systemRouter.get("/status", async (_req, res, next) => {
  try {
    const databaseConnected = await verifyDatabaseConnection();
    const redisConnected = await verifyRedisConnection();
    const cloudinaryReady = (() => {
      try {
        return assertCloudinaryReady();
      } catch (_error) {
        return false;
      }
    })();

    res.json({
      status: databaseConnected && (!env.REDIS_REQUIRED || redisConnected) ? "OPERATIONAL" : "DEGRADED",
      service: "nidus-backend",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseConnected ? "CONNECTED" : "FAILED",
        cache: redisConnected ? "REDIS_CONNECTED" : cacheConfig.mode,
        queue: isQueueAvailable() ? "AVAILABLE" : "UNAVAILABLE",
        cloudinary: cloudinaryReady ? "READY" : "NOT_CONFIGURED",
        sentry: env.SENTRY_DSN ? "CONFIGURED" : "DISABLED",
        backups: prismaBackupConfig.provider,
        maintenanceMode: env.MAINTENANCE_MODE
      }
    });
  } catch (error) {
    next(error);
  }
});
