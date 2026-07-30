import test from "node:test";
import assert from "node:assert/strict";

import { redis_invalidate_pattern } from "@/lib/redis/invalidate";
import type { RedisCacheClient } from "@/lib/redis/redis-client";

test("redis_invalidate_pattern scans all pages and deletes matching keys", async () => {
  const scanCalls: string[] = [];
  const delCalls: string[][] = [];

  const client: RedisCacheClient = {
    get: async () => null,
    set: async () => undefined,
    scan: async (cursor, ...args) => {
      scanCalls.push([cursor, ...args].join(" "));

      if (cursor === "0") {
        return ["1", ["a", "b"]];
      }

      return ["0", ["c"]];
    },
    del: async (...keys) => {
      delCalls.push(keys);
      return keys.length;
    },
  };

  const deleted = await redis_invalidate_pattern("prefix:*", client);
  assert.equal(deleted, 3);
  assert.equal(scanCalls.length, 2);
  assert.deepEqual(delCalls, [
    ["a", "b"],
    ["c"],
  ]);
});

test("redis_invalidate_pattern returns 0 when client is null", async () => {
  const deleted = await redis_invalidate_pattern("prefix:*", null);
  assert.equal(deleted, 0);
});

test("redis_invalidate_pattern returns 0 when redis throws", async () => {
  const client: RedisCacheClient = {
    get: async () => null,
    set: async () => undefined,
    scan: async () => {
      throw new Error("redis down");
    },
    del: async () => 0,
  };

  const deleted = await redis_invalidate_pattern("prefix:*", client);
  assert.equal(deleted, 0);
});

