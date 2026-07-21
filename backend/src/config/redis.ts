import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redis: Redis | null = null;
let redisReady = false;
const REDIS_OPERATION_TIMEOUT_MS = 1500;
const OPTIONAL_REDIS_RETRY_COOLDOWN_MS = 30_000;
const REDIS_LOG_THROTTLE_MS = 15_000;
let redisDisabledUntil = 0;
let lastConnectionLogAt = 0;

function isRedisAuthError(message: string) {
  return /WRONGPASS|invalid username-password|user is disabled/i.test(message);
}

function throttledRedisLog(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  const now = Date.now();
  if (now - lastConnectionLogAt < REDIS_LOG_THROTTLE_MS) return;
  lastConnectionLogAt = now;
  logger[level](message, meta);
}

function disableOptionalRedisTemporarily(error: string) {
  if (env.REDIS_REQUIRED) return;
  redisDisabledUntil = Date.now() + OPTIONAL_REDIS_RETRY_COOLDOWN_MS;
  redisReady = false;
  redis?.disconnect();
  redis = null;
  throttledRedisLog("warn", "Redis unavailable; using memory fallback temporarily", {
    error,
    retryAfterMs: OPTIONAL_REDIS_RETRY_COOLDOWN_MS
  });
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs = REDIS_OPERATION_TIMEOUT_MS): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`Redis operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function getRedis() {
  if (!env.REDIS_URL) return null;
  if (redis) return redis;
  if (!env.REDIS_REQUIRED && Date.now() < redisDisabledUntil) return null;

  redis = new Redis(env.REDIS_URL, {
    connectTimeout: 1500,
    commandTimeout: REDIS_OPERATION_TIMEOUT_MS,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      if (!env.REDIS_REQUIRED && times > 3) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(error: Error) {
      const shouldReconnect = !/WRONGPASS|invalid username-password/i.test(error.message);
      if (shouldReconnect && env.REDIS_REQUIRED) {
        throttledRedisLog("warn", "Redis reconnect requested", { error: error.message });
      }
      return shouldReconnect;
    }
  });

  redis.on("ready", () => {
    redisReady = true;
    redisDisabledUntil = 0;
    throttledRedisLog("info", "Redis connection ready");
  });
  redis.on("error", (error) => {
    redisReady = false;
    if (isRedisAuthError(error.message) && !env.REDIS_REQUIRED) {
      disableOptionalRedisTemporarily(error.message);
      return;
    }
    if (env.REDIS_REQUIRED) {
      throttledRedisLog("error", "Redis connection error", { error: error.message });
    } else {
      throttledRedisLog("warn", "Redis connection unavailable; fallback remains active", { error: error.message });
    }
  });
  redis.on("end", () => {
    redisReady = false;
    throttledRedisLog("warn", "Redis connection closed");
  });

  return redis;
}

export function isRedisReady() {
  return Boolean(redis && redisReady);
}

export async function verifyRedisConnection() {
  const client = getRedis();
  if (!client) {
    if (env.REDIS_REQUIRED) throw new Error("REDIS_URL is required when REDIS_REQUIRED=true");
    return false;
  }
  try {
    await withTimeout(client.ping());
    redisReady = true;
    return true;
  } catch (error) {
    redisReady = false;
    const message = error instanceof Error ? error.message : "Unknown error";
    if (env.REDIS_REQUIRED) {
      logger.error("Redis health check failed", { error: message });
    }
    if (isRedisAuthError(message) || !env.REDIS_REQUIRED) {
      redis?.disconnect();
      redis = null;
    }
    if (env.REDIS_REQUIRED) throw error;
    disableOptionalRedisTemporarily(message);
    return false;
  }
}

export async function closeRedis() {
  if (!redis) return;
  await redis.quit().catch(() => undefined);
  redis = null;
  redisReady = false;
}
