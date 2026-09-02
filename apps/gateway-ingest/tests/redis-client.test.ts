import assert from "node:assert/strict";
import test from "node:test";

import { resolveRedisRest } from "../src/lib/redis-client.js";

test("resolveRedisRest prefers explicit Upstash REST bindings", () => {
  const rest = resolveRedisRest({
    REDIS_URL: "rediss://default:other@example.upstash.io:6379",
    UPSTASH_REDIS_REST_URL: "https://rest.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "rest-token",
  });
  assert.deepEqual(rest, {
    url: "https://rest.upstash.io",
    token: "rest-token",
  });
});

test("resolveRedisRest derives REST credentials from REDIS_URL", () => {
  const rest = resolveRedisRest({
    REDIS_URL: "rediss://default:secret%2Ftoken@merry-koi.upstash.io:6379",
  });
  assert.deepEqual(rest, {
    url: "https://merry-koi.upstash.io",
    token: "secret/token",
  });
});

test("resolveRedisRest returns null for local Redis without a password", () => {
  const rest = resolveRedisRest({
    REDIS_URL: "redis://localhost:6379",
  });
  assert.equal(rest, null);
});

test("resolveRedisRest returns null when credentials are missing", () => {
  assert.equal(resolveRedisRest({}), null);
});
