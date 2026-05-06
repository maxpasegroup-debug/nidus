import { Router } from "express";
import { cacheConfig } from "../../config/cache.js";
import { env } from "../../config/env.js";
import { prismaBackupConfig, verifyDatabaseConnection } from "../../config/prisma.js";

export const systemRouter = Router();

systemRouter.get("/status", async (_req, res, next) => {
  try {
    const databaseConnected = await verifyDatabaseConnection();

    res.json({
      status: databaseConnected ? "OPERATIONAL" : "DEGRADED",
      service: "nidus-backend",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseConnected ? "CONNECTED" : "FAILED",
        cache: cacheConfig.mode,
        backups: prismaBackupConfig.provider,
        maintenanceMode: env.MAINTENANCE_MODE
      }
    });
  } catch (error) {
    next(error);
  }
});
