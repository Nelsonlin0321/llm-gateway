import assert from "node:assert/strict";
import test from "node:test";

import { consumeChildKeyRateLimit } from "../src/child-keys/rate-limit.js";
import type { ChildKeyDbRecord } from "../src/child-keys/types.js";
import type { RedisCacheClient } from "../src/lib/redis-client.js";

function buildRecord(
  overrides: Partial<ChildKeyDbRecord> = {},
): ChildKeyDbRecord {
  return {
    id: "key-1",
    name: "prod",
    key: "encrypted",
    creatorId: "creator-1",
    organizationId: "org-1",
    userEmail: "user@example.com",
    isActive: true,
    tags: {},
    expiresAt: null,
    issuedAt: 1,
    rateLimitRpm: null,
    monthlyBudgetUsd: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

class FakeRedis implements RedisCacheClient {
  public store = new Map<string, number>();
  public expireCalls: Array<{ key: string; seconds: number }> = [];

  async get(): Promise<string | null> {
    return null;
  }
  async set(): Promise<unknown> {
    return "OK";
  }
  async del(): Promise<number> {
    return 0;
  }
  async ping(): Promise<string> {
    return "PONG";
  }
  async xadd(): Promise<string> {
    return "1-0";
  }
  async incr(key: string): Promise<number> {
    const next = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, next);
    return next;
  }
  async expire(key: string, seconds: number): Promise<number> {
    this.expireCalls.push({ key, seconds });
    return 1;
  }
}

test("consumeChildKeyRateLimit allows traffic under the default RPM", async () => {
  const redis = new FakeRedis();
  const result = await consumeChildKeyRateLimit(
    buildRecord(),
    10,
    1_700_000_000_000,
    redis,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.remaining, 9);
    assert.equal(result.limit, 10);
  }
  assert.equal(redis.expireCalls.length, 1);
});

test("consumeChildKeyRateLimit blocks when the window is exhausted", async () => {
  const redis = new FakeRedis();
  const record = buildRecord({ rateLimitRpm: 1 });
  const now = 1_700_000_000_000;
  const first = await consumeChildKeyRateLimit(record, 600, now, redis);
  const second = await consumeChildKeyRateLimit(record, 600, now, redis);
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.limit, 1);
    assert.ok(second.retryAfterSeconds >= 1);
  }
});

test("consumeChildKeyRateLimit treats 0 as unlimited", async () => {
  const result = await consumeChildKeyRateLimit(
    buildRecord({ rateLimitRpm: 0 }),
    10,
    Date.now(),
    new FakeRedis(),
  );
  assert.equal(result.ok, true);
});

test("consumeChildKeyRateLimit fails open without redis", async () => {
  const result = await consumeChildKeyRateLimit(buildRecord(), 1, Date.now(), null);
  assert.equal(result.ok, true);
});
