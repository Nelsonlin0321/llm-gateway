import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_CONSUMER_NAME, loadConfig } from "../src/lib/config.js";

test("loadConfig throws without Redis credentials", () => {
  assert.throws(() => loadConfig({}), /REDIS_URL is required/);
});

test("loadConfig applies defaults for XAUTOCLAIM + XREADGROUP path", () => {
  const config = loadConfig({
    REDIS_URL: "redis://127.0.0.1:6379",
    REQUEST_LOG_CONSUMER_NAME: "consumer1",
  });

  assert.equal(config.redisUrl, "redis://127.0.0.1:6379");
  assert.equal(config.streamKey, "llm-gateway-request-logs");
  assert.equal(config.groupName, "gateway-ingest");
  assert.equal(config.consumerName, "consumer1");
  assert.equal(config.count, 20);
  assert.equal(config.blockMs, 0);
  assert.equal(config.claimMinIdleMs, 60_000);
  assert.equal(config.idleExitMs, 30_000);
  assert.equal(config.maxDurationMs, 25_000);
});

test("loadConfig default consumer name is stable across invocations", () => {
  const config = loadConfig({
    REDIS_URL: "redis://127.0.0.1:6379",
  });
  assert.equal(config.consumerName, DEFAULT_CONSUMER_NAME);
});

test("loadConfig accepts Upstash REST bindings without REDIS_URL", () => {
  const config = loadConfig({
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
  });
  assert.equal(config.redisUrl, null);
  assert.equal(config.consumerName, DEFAULT_CONSUMER_NAME);
});

test("loadConfig honors overrides", () => {
  const config = loadConfig({
    REDIS_URL: "redis://cache:6379/1",
    REQUEST_LOG_STREAM: "custom-stream",
    REQUEST_LOG_CONSUMER_GROUP: "mygroup",
    REQUEST_LOG_CONSUMER_NAME: "worker-a",
    REQUEST_LOG_READ_COUNT: "25",
    REQUEST_LOG_BLOCK_MS: "500",
    REQUEST_LOG_CLAIM_MIN_IDLE_MS: "120000",
    REQUEST_LOG_IDLE_EXIT_MS: "15000",
    REQUEST_LOG_MAX_DURATION_MS: "10000",
  });

  assert.equal(config.streamKey, "custom-stream");
  assert.equal(config.groupName, "mygroup");
  assert.equal(config.consumerName, "worker-a");
  assert.equal(config.count, 25);
  assert.equal(config.blockMs, 500);
  assert.equal(config.claimMinIdleMs, 120_000);
  assert.equal(config.idleExitMs, 15_000);
  assert.equal(config.maxDurationMs, 10_000);
});

test("loadConfig falls back on invalid numbers", () => {
  const config = loadConfig({
    REDIS_URL: "redis://localhost:6379",
    REQUEST_LOG_READ_COUNT: "nope",
    REQUEST_LOG_BLOCK_MS: "-1",
    REQUEST_LOG_CLAIM_MIN_IDLE_MS: "",
    REQUEST_LOG_IDLE_EXIT_MS: "nope",
    REQUEST_LOG_MAX_DURATION_MS: "nope",
  });

  assert.equal(config.count, 20);
  assert.equal(config.blockMs, 0);
  assert.equal(config.claimMinIdleMs, 60_000);
  assert.equal(config.idleExitMs, 30_000);
  assert.equal(config.maxDurationMs, 25_000);
});
