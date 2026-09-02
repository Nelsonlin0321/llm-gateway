import assert from "node:assert/strict";
import test from "node:test";

import { loadGatewayConfig } from "../src/lib/config.js";

test("loadGatewayConfig skips secret checks in test env", () => {
  const config = loadGatewayConfig({
    NODE_ENV: "test",
    PORT: "9090",
    CHILD_KEY_RATE_LIMIT_RPM: "120",
  });
  assert.equal(config.port, 9090);
  assert.equal(config.defaultRateLimitRpm, 120);
  assert.equal(config.requestBodyLimitBytes, 1_048_576);
});

test("loadGatewayConfig requires secrets outside test", () => {
  assert.throws(
    () =>
      loadGatewayConfig({
        NODE_ENV: "production",
      }),
    /DATABASE_URL is required/,
  );
});

test("loadGatewayConfig accepts Worker binding-style env", () => {
  const config = loadGatewayConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://example",
    JWT_SIGNING_SECRET: "a".repeat(32),
    API_ENCRYPT_KEY: "b".repeat(16),
    REDIS_URL: "rediss://default:token@example.upstash.io:6379",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
    GATEWAY_CORS_ORIGINS: "https://portal.example, https://app.example",
    REQUEST_BODY_LIMIT_BYTES: "2048",
  });
  assert.equal(config.databaseUrl, "postgres://example");
  assert.equal(config.upstashRedisRestUrl, "https://example.upstash.io");
  assert.deepEqual(config.corsOrigins, [
    "https://portal.example",
    "https://app.example",
  ]);
  assert.equal(config.requestBodyLimitBytes, 2048);
});
