import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const adapter = new PrismaPg(env.DATABASE_URL);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "production" ? ["error", "warn"] : ["error", "warn"]
});

async function withTimeout<T>(operation: Promise<T>, timeoutMs = 3000): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function verifyDatabaseConnection() {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`);
    return true;
  } catch (error) {
    logger.error("Database health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

export const prismaBackupConfig = {
  provider: "postgresql",
  recommendedCommand: "pg_dump $DATABASE_URL --format=custom --file=nidus-backup.dump",
  restoreCommand: "pg_restore --clean --if-exists --dbname=$DATABASE_URL nidus-backup.dump"
};
