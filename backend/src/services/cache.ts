import { redis } from "../db/redis.js";

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function setCachedJson(key: string, value: unknown, seconds = 60) {
  await redis.set(key, JSON.stringify(value), "EX", seconds);
}

export async function bustProductCache() {
  const keys = await redis.keys("products:*");
  if (keys.length) await redis.del(keys);
}
