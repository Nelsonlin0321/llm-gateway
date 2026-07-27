import Redis from "ioredis";

const DEFAULT_TTL = 60 * 60 * 24 * 30;
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
}

const REDIS_URL = process.env.REDIS_URL;

export const redis: RedisCacheClient | null = REDIS_URL
  ? (new Redis(REDIS_URL) as unknown as RedisCacheClient)
  : null;

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

export async function redis_cache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
  client: RedisCacheClient | null = redis,
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
    await client.set(key, JSON.stringify(result), ttl ? { ex: ttl } : {});
  } catch {
    // Returning the fresh result is still correct even if cache write fails.
  }

  return result;
}

export default redis;
