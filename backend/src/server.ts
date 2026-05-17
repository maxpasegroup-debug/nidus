import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { assertCloudinaryReady } from "./config/cloudinary.js";
import { closeRedis, verifyRedisConnection } from "./config/redis.js";
import { verifyDatabaseConnection } from "./config/prisma.js";
import { startInfrastructureWorkers, stopInfrastructureWorkers } from "./queues/index.js";
import { logger } from "./utils/logger.js";
import { markRuntimeDegraded, markRuntimeReady, markRuntimeShuttingDown } from "./runtime/lifecycle.js";
import { AuthServiceV2 } from "./modules/auth/auth.v2.service.js";

const app = createApp();
const PORT = Number(process.env.PORT || env.PORT || 8080);

async function startupChecks() {
  const databaseConnected = await verifyDatabaseConnection();
  if (!databaseConnected) throw new Error("Database startup validation failed");
  await AuthServiceV2.ensureSuperAdmin();
  await verifyRedisConnection();
  assertCloudinaryReady();
  if (env.PROCESS_ROLE !== "web") await startInfrastructureWorkers();
}

const server = app.listen(PORT, "0.0.0.0", async () => {
  try {
    await startupChecks();
    markRuntimeReady();
    logger.info("NIDUS backend started", { port: PORT, environment: env.NODE_ENV, processRole: env.PROCESS_ROLE });
  } catch (error) {
    markRuntimeDegraded(error);
    logger.error("Startup validation failed", { error: error instanceof Error ? error.message : "Unknown error" });
    process.exit(1);
  }
});

async function shutdown(signal: string) {
  markRuntimeShuttingDown();
  logger.warn("Shutdown signal received", { signal });
  await stopInfrastructureWorkers().catch(() => undefined);
  await closeRedis().catch(() => undefined);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: reason instanceof Error ? reason.message : String(reason) });
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});
