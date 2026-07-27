import assert from "node:assert/strict";
import test from "node:test";

import { redis_cache, type RedisCacheClient } from "../src/lib/redis.js";

type CachedUser = {
  createdAt: Date;
  profile: { lastSeenAt: Date };
  events: Array<{ happenedAt: Date }>;
  label: string;
};

class FakeRedis implements RedisCacheClient {
  public store = new Map<string, string>();
  public setCalls: Array<{
    key: string;
    value: string;
    options?: { ex: number } | Record<string, never>;
  }> = [];

  constructor(
    private readonly overrides: {
      get?: (key: string) => Promise<string | null>;
      set?: (
        key: string,
        value: string,
        ...args: unknown[]
      ) => Promise<unknown>;
    } = {},
  ) {}

  async get(key: string): Promise<string | null> {
    if (this.overrides.get) {
      return this.overrides.get(key);
    }
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<unknown> {
    const options = args[0] as
      | { ex: number }
      | Record<string, never>
      | undefined;
    this.setCalls.push({ key, value, options });
    if (this.overrides.set) {
      return this.overrides.set(key, value, ...args);
    }
    this.store.set(key, value);
    return "OK";
  }
}

test("redis_cache returns cached values and revives ISO dates", async () => {
  const cachedDate = new Date("2023-01-01T00:00:00.000Z");
  const redis = new FakeRedis();
  redis.store.set(
    "user:1",
    JSON.stringify({
      createdAt: cachedDate,
      profile: { lastSeenAt: cachedDate },
      events: [{ happenedAt: cachedDate }],
      label: "2023-01-01",
    }),
  );

  let called = 0;
  const result = await redis_cache<CachedUser>(
    "user:1",
    async () => {
      called += 1;
      throw new Error("fn should not run on cache hit");
    },
    60,
    redis,
  );

  assert.equal(called, 0);
  assert.ok(result.createdAt instanceof Date);
  assert.equal(result.createdAt.toISOString(), cachedDate.toISOString());
  assert.ok(result.profile.lastSeenAt instanceof Date);
  assert.ok(result.events[0]?.happenedAt instanceof Date);
  assert.equal(result.label, "2023-01-01");
});

test("redis_cache computes and stores missing values with ttl", async () => {
  const redis = new FakeRedis();
  let called = 0;

  const result = await redis_cache(
    "provider:openai",
    async () => {
      called += 1;
      return { name: "openai" };
    },
    120,
    redis,
  );

  assert.deepEqual(result, { name: "openai" });
  assert.equal(called, 1);
  assert.equal(redis.setCalls.length, 1);
  assert.deepEqual(redis.setCalls[0], {
    key: "provider:openai",
    value: JSON.stringify({ name: "openai" }),
    options: { ex: 120 },
  });
});

test("redis_cache omits ttl options when ttl is zero", async () => {
  const redis = new FakeRedis();

  await redis_cache("policy:1", async () => ({ id: 1 }), 0, redis);

  assert.deepEqual(redis.setCalls[0]?.options, {});
});

test("redis_cache falls back when redis read fails", async () => {
  const redis = new FakeRedis({
    async get() {
      throw new Error("redis unavailable");
    },
  });

  let called = 0;
  const result = await redis_cache(
    "child-key:1",
    async () => {
      called += 1;
      return { ok: true };
    },
    30,
    redis,
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(called, 1);
});

test("redis_cache still returns fresh data when redis write fails", async () => {
  const redis = new FakeRedis({
    async set() {
      throw new Error("write failed");
    },
  });

  const result = await redis_cache(
    "route:model",
    async () => ({ model: "gpt-5" }),
    30,
    redis,
  );

  assert.deepEqual(result, { model: "gpt-5" });
  assert.equal(redis.setCalls.length, 1);
});
