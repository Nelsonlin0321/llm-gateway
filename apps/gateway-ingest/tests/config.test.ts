import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/lib/config.js";

test("loadConfig throws without REDIS_URL", () => {
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
  assert.equal(config.blockMs, 5_000);
  assert.equal(config.claimMinIdleMs, 60_000);
  assert.equal(config.idleExitMs, 30_000);
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
  });

  assert.equal(config.streamKey, "custom-stream");
  assert.equal(config.groupName, "mygroup");
  assert.equal(config.consumerName, "worker-a");
  assert.equal(config.count, 25);
  assert.equal(config.blockMs, 500);
  assert.equal(config.claimMinIdleMs, 120_000);
  assert.equal(config.idleExitMs, 15_000);
});

test("loadConfig falls back on invalid numbers", () => {
  const config = loadConfig({
    REDIS_URL: "redis://localhost:6379",
    REQUEST_LOG_READ_COUNT: "nope",
    REQUEST_LOG_BLOCK_MS: "-1",
    REQUEST_LOG_CLAIM_MIN_IDLE_MS: "",
    REQUEST_LOG_IDLE_EXIT_MS: "nope",
  });

  assert.equal(config.count, 20);
  assert.equal(config.blockMs, 5_000);
  assert.equal(config.claimMinIdleMs, 60_000);
  assert.equal(config.idleExitMs, 30_000);
});
