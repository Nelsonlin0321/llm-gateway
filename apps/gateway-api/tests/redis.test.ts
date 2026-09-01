import assert from "node:assert/strict";
import test from "node:test";

import {
  redis_cache,
  redis_invalidate,
  type RedisCacheClient,
} from "../src/lib/redis-client.js";

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
    args: unknown[];
  }> = [];
  public delCalls: string[] = [];
  public xaddCalls: Array<{
    key: string;
    args: (string | Buffer | number)[];
  }> = [];

  constructor(
    private readonly overrides: {
      get?: (key: string) => Promise<string | null>;
      set?: (
        key: string,
        value: string,
        ...args: unknown[]
      ) => Promise<unknown>;
      del?: (key: string) => Promise<number>;
      xadd?: (
        key: string,
        ...args: (string | Buffer | number)[]
      ) => Promise<string>;
    } = {},
  ) {}

  async get(key: string): Promise<string | null> {
    if (this.overrides.get) {
      return this.overrides.get(key);
    }
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<unknown> {
    this.setCalls.push({ key, value, args });
    if (this.overrides.set) {
      return this.overrides.set(key, value, ...args);
    }
    this.store.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    this.delCalls.push(key);
    if (this.overrides.del) {
      return this.overrides.del(key);
    }
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const next = Number(this.store.get(key) ?? "0") + 1;
    this.store.set(key, String(next));
    return next;
  }

  async expire(): Promise<number> {
    return 1;
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async xadd(
    key: string,
    ...args: (string | Buffer | number)[]
  ): Promise<string> {
    this.xaddCalls.push({ key, args });
    if (this.overrides.xadd) {
      return this.overrides.xadd(key, ...args);
    }
    return "1-0";
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
    args: ["EX", 120],
  });
});

test("redis_cache omits ttl options when ttl is zero", async () => {
  const redis = new FakeRedis();

  await redis_cache("policy:1", async () => ({ id: 1 }), 0, redis);

  assert.deepEqual(redis.setCalls[0]?.args, []);
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

test("redis_invalidate removes cached values", async () => {
  const redis = new FakeRedis();
  redis.store.set("user:2", JSON.stringify({ id: 2 }));

  const removed = await redis_invalidate("user:2", redis);

  assert.equal(removed, true);
  assert.equal(redis.store.has("user:2"), false);
  assert.deepEqual(redis.delCalls, ["user:2"]);
});

test("redis_invalidate returns false on missing client", async () => {
  const removed = await redis_invalidate("user:3", null);
  assert.equal(removed, false);
});

test("redis_invalidate returns false when redis delete fails", async () => {
  const redis = new FakeRedis({
    async del() {
      throw new Error("redis unavailable");
    },
  });

  const removed = await redis_invalidate("user:4", redis);
  assert.equal(removed, false);
});
