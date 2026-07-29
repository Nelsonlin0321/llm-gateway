import "dotenv/config";
import Redis from "ioredis";

const DEFAULT_TTL = 60 * 60 * 24 * 30;
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Minimal Redis surface used by `redis_cache`.
 * Compatible with ioredis: `set(key, value)` or `set(key, value, "EX", seconds)`.
 */
export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
}

const REDIS_URL = process.env.REDIS_URL;
let redisClient: RedisCacheClient | null | undefined;

export function getRedisClient(): RedisCacheClient | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  redisClient = REDIS_URL
    ? (new Redis(REDIS_URL) as unknown as RedisCacheClient)
    : null;

  return redisClient;
}

function reviveCachedValue(_key: string, value: unknown) {
  if (typeof value !== "string" || !ISO_DATE_TIME_RE.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

export function parseRedisCacheValue<T>(cached: string): T {
  return JSON.parse(cached, reviveCachedValue) as T;
}

/**
 * Cache the result of an async loader behind a Redis key.
 *
 * - Cache miss / Redis errors fall through to `fn`.
 * - Write failures still return the fresh result.
 * - When `client` is null (no `REDIS_URL`), always calls `fn`.
 * - TTL uses ioredis `SET key value EX seconds`.
 */
export async function redis_cache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
  client: RedisCacheClient | null = getRedisClient(),
): Promise<T> {
  if (!client) {
    return fn();
  }

  try {
    const cached = await client.get(key);
    if (cached !== null && cached !== undefined) {
      return parseRedisCacheValue<T>(cached);
    }
  } catch {
    // Redis is an optimization only. Fall through to the source function.
  }

  const result = await fn();

  try {
    if (ttl > 0) {
      await client.set(key, JSON.stringify(result), "EX", ttl);
    } else {
      await client.set(key, JSON.stringify(result));
    }
  } catch {
    // Returning the fresh result is still correct even if cache write fails.
  }

  return result;
}

export default getRedisClient;
