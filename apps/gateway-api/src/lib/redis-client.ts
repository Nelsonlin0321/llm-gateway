import { Redis } from "@upstash/redis/cloudflare";

import type { WorkerBindings } from "../env";

const DEFAULT_TTL = 60 * 60 * 24 * 30;
const ISO_DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Minimal Redis surface used by cache helpers and stream publishers.
 * Compatible with the previous ioredis calling convention:
 * - `set(key, value)` or `set(key, value, "EX", seconds)`
 * - `xadd(stream, id, field1, value1, ...)` including `MAXLEN ~ n * ...`
 */
export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<string>;
  xadd(key: string, ...args: (string | Buffer | number)[]): Promise<string>;
}

export type RedisRestCredentials = {
  url: string;
  token: string;
};

/**
 * Resolve HTTP Redis credentials for Cloudflare Workers.
 *
 * Prefers explicit Upstash REST bindings; otherwise derives
 * `https://<host>` + password from `REDIS_URL` (Upstash TCP URL).
 */
export function resolveRedisRest(
  env: WorkerBindings = process.env,
): RedisRestCredentials | null {
  const restUrl = (env.UPSTASH_REDIS_REST_URL ?? "").trim();
  const restToken = (env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
  if (restUrl && restToken) {
    return { url: restUrl, token: restToken };
  }

  const redisUrl = (env.REDIS_URL ?? "").trim();
  if (!redisUrl) {
    return null;
  }

  try {
    const parsed = new URL(redisUrl);
    const token = decodeURIComponent(parsed.password);
    if (!parsed.hostname || !token) {
      return null;
    }
    return { url: `https://${parsed.hostname}`, token };
  } catch {
    return null;
  }
}

class UpstashRedisCacheClient implements RedisCacheClient {
  private readonly redis: Redis;

  constructor(credentials: RedisRestCredentials) {
    this.redis = new Redis({
      url: credentials.url,
      token: credentials.token,
      automaticDeserialization: false,
    });
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get<string>(key);
    return value ?? null;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<unknown> {
    if (args[0] === "EX" && typeof args[1] === "number") {
      return this.redis.set(key, value, { ex: args[1] });
    }
    return this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async xadd(
    key: string,
    ...args: (string | Buffer | number)[]
  ): Promise<string> {
    const strArgs = args.map(String);
    let i = 0;
    let opts:
      | {
          trim: {
            type: "MAXLEN";
            threshold: number;
            comparison: "=" | "~";
          };
        }
      | undefined;

    if (strArgs[i] === "MAXLEN") {
      i += 1;
      let comparison: "=" | "~" = "=";
      if (strArgs[i] === "~" || strArgs[i] === "=") {
        comparison = strArgs[i] as "=" | "~";
        i += 1;
      }
      const threshold = Number(strArgs[i]);
      i += 1;
      opts = {
        trim: { type: "MAXLEN", threshold, comparison },
      };
    }

    const id = strArgs[i] ?? "*";
    i += 1;
    const entries: Record<string, string> = {};
    for (; i < strArgs.length; i += 2) {
      const field = strArgs[i];
      if (!field) {
        continue;
      }
      entries[field] = strArgs[i + 1] ?? "";
    }

    return this.redis.xadd(key, id, entries, opts);
  }
}

let redisClient: RedisCacheClient | undefined;

export function getRedisClient(
  env: WorkerBindings = process.env,
): RedisCacheClient | null {
  if (redisClient) {
    return redisClient;
  }

  const credentials = resolveRedisRest(env);
  if (!credentials) {
    return null;
  }

  redisClient = new UpstashRedisCacheClient(credentials);
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
 * - When `client` is null (no Redis bindings), always calls `fn`.
 * - TTL uses `SET key value EX seconds`.
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

export async function redis_invalidate(
  key: string,
  client: RedisCacheClient | null = getRedisClient(),
): Promise<boolean> {
  if (!client) {
    return false;
  }

  try {
    const deleted = await client.del(key);
    return deleted > 0;
  } catch {
    return false;
  }
}

export default getRedisClient;
