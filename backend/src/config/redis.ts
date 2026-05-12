import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redis: Redis | null = null;
let redisReady = false;

export function getRedis() {
  if (!env.REDIS_URL) return null;
  if (redis) return redis;

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(error: Error) {
      logger.warn("Redis reconnect requested", { error: error.message });
      return true;
    }
  });

  redis.on("ready", () => {
    redisReady = true;
    logger.info("Redis connection ready");
  });
  redis.on("error", (error) => {
    redisReady = false;
    logger.error("Redis connection error", { error: error.message });
  });
  redis.on("end", () => {
    redisReady = false;
    logger.warn("Redis connection closed");
  });

  return redis;
}

export function isRedisReady() {
  return Boolean(redis && redisReady);
}

export async function verifyRedisConnection() {
  const client = getRedis();
  if (!client) return false;
  try {
    await client.ping();
    redisReady = true;
    return true;
  } catch (error) {
    redisReady = false;
    logger.error("Redis health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
    if (env.REDIS_REQUIRED) throw error;
    return false;
  }
}

export async function closeRedis() {
  if (!redis) return;
  await redis.quit().catch(() => undefined);
  redis = null;
  redisReady = false;
}
