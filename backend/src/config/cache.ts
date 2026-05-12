import { env } from "./env.js";
import { getRedis, isRedisReady } from "./redis.js";
import { logger } from "../utils/logger.js";

type CacheRecord = { value: unknown; expiresAt: number };
const memoryCache = new Map<string, CacheRecord>();

export const cacheConfig = {
  redisUrl: env.REDIS_URL,
  mode: env.REDIS_URL ? "redis" : "memory-fallback"
};

function purgeExpiredMemory(key: string) {
  const record = memoryCache.get(key);
  if (record && record.expiresAt < Date.now()) memoryCache.delete(key);
  return record && record.expiresAt >= Date.now() ? record : null;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis && isRedisReady()) {
    try {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.warn("Redis cache read failed; using memory fallback", { key, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  const record = purgeExpiredMemory(key);
  return record ? (record.value as T) : null;
}

export async function setCached(key: string, value: unknown, ttlSeconds = 60) {
  const redis = getRedis();
  if (redis && isRedisReady()) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (error) {
      logger.warn("Redis cache write failed; using memory fallback", { key, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function clearCache(keyPrefix?: string) {
  const redis = getRedis();
  if (redis && isRedisReady()) {
    try {
      if (!keyPrefix) {
        await redis.flushdb();
      } else {
        const stream = redis.scanStream({ match: `${keyPrefix}*`, count: 100 });
        for await (const keys of stream) {
          if (Array.isArray(keys) && keys.length) await redis.del(...keys);
        }
      }
    } catch (error) {
      logger.warn("Redis cache clear failed", { error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) memoryCache.delete(key);
  }
}
