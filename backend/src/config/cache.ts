import { env } from "./env.js";

type CacheRecord = {
  value: unknown;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheRecord>();

export const cacheConfig = {
  redisUrl: env.REDIS_URL,
  mode: env.REDIS_URL ? "redis-ready" : "memory-placeholder"
};

export async function getCached<T>(key: string): Promise<T | null> {
  const record = memoryCache.get(key);
  if (!record || record.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return record.value as T;
}

export async function setCached(key: string, value: unknown, ttlSeconds = 60) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function clearCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) memoryCache.delete(key);
  }
}
