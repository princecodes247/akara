import crypto from "crypto";
import { RedisClient } from "bun";
import config from "./config";

let redisClient: any = null;

try {
  redisClient = new RedisClient(config.REDIS_URL);
} catch (error) {
  console.error("Failed to initialize Bun.redis client:", error);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (!redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.set(key, value, "ex", ttlSeconds);
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async setJSON(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  },

  async del(key: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`Cache del error for key ${key}:`, err);
    }
  }
};

export function cached<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  options: {
    key: (...args: Args) => string | Promise<string>;
    ttlSeconds: number;
  }
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    const cacheKey = await options.key(...args);
    const cachedData = await cache.getJSON<Return>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
    const result = await fn(...args);
    await cache.setJSON(cacheKey, result, options.ttlSeconds);
    return result;
  };
}
