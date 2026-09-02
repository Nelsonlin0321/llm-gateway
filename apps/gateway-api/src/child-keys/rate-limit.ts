import type { MiddlewareHandler } from "hono";

import { getRedisClient, type RedisCacheClient } from "../lib/redis-client";
import { getRateLimitKey } from "../lib/redis-keys";
import type { ChildKeyDbRecord } from "./types";

const WINDOW_MS = 60_000;

export type RateLimitResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; limit: number; retryAfterSeconds: number };

function resolveLimitRpm(
  record: ChildKeyDbRecord,
  defaultRpm: number,
): number {
  if (typeof record.rateLimitRpm === "number" && record.rateLimitRpm >= 0) {
    return record.rateLimitRpm;
  }
  return defaultRpm;
}

/**
 * Fixed 60-second window per child key. Redis outages fail open so the
 * proxy keeps serving traffic; operators still see the error in logs.
 */
export async function consumeChildKeyRateLimit(
  record: ChildKeyDbRecord,
  defaultRpm: number,
  nowMs: number = Date.now(),
  client: RedisCacheClient | null = getRedisClient(),
): Promise<RateLimitResult> {
  const limit = resolveLimitRpm(record, defaultRpm);
  if (limit <= 0) {
    return { ok: true, remaining: Number.POSITIVE_INFINITY, limit: 0 };
  }

  if (!client) {
    return { ok: true, remaining: limit, limit };
  }

  const windowStart = Math.floor(nowMs / WINDOW_MS) * WINDOW_MS;
  const key = getRateLimitKey(record.id, windowStart);

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 120);
    }
    if (count > limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowStart + WINDOW_MS - nowMs) / 1000),
      );
      return { ok: false, limit, retryAfterSeconds };
    }
    return { ok: true, remaining: Math.max(0, limit - count), limit };
  } catch (error) {
    console.error("[rate-limit] redis error; failing open", error);
    return { ok: true, remaining: limit, limit };
  }
}

export function createChildKeyRateLimitMiddleware(
  defaultRpm: number,
): MiddlewareHandler {
  return async (c, next) => {
    const record = c.get("childKeyRecord") as ChildKeyDbRecord | undefined;
    if (!record) {
      return c.json(
        {
          error: {
            message: "Missing API key context.",
            type: "server_error",
          },
        },
        500,
      );
    }

    const result = await consumeChildKeyRateLimit(record, defaultRpm);
    if (!result.ok) {
      c.header("retry-after", String(result.retryAfterSeconds));
      c.header("x-ratelimit-limit", String(result.limit));
      c.header("x-ratelimit-remaining", "0");
      return c.json(
        {
          error: {
            message: "Rate limit exceeded for this API key.",
            type: "rate_limit_error",
            code: "rate_limit_exceeded",
          },
        },
        429,
      );
    }

    if (result.limit > 0) {
      c.header("x-ratelimit-limit", String(result.limit));
      c.header("x-ratelimit-remaining", String(result.remaining));
    }

    await next();
  };
}
