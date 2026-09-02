import assert from "node:assert/strict";
import test from "node:test";

import { runIngestJob } from "../src/job.js";
import type { IngestConfig } from "../src/lib/config.js";
import type { Db } from "../src/lib/db.js";
import type {
  RedisStreamClient,
  XAutoClaimResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

function baseConfig(overrides: Partial<IngestConfig> = {}): IngestConfig {
  return {
    redisUrl: "redis://127.0.0.1:6379",
    streamKey: "llm-gateway-request-logs",
    groupName: "gateway-ingest",
    consumerName: "gateway-ingest-worker",
    count: 10,
    blockMs: 0,
    claimMinIdleMs: 0,
    idleExitMs: 1_000,
    maxDurationMs: 0,
    ...overrides,
  };
}

class FakeRedis implements RedisStreamClient {
  public xgroupCalls: Array<(string | number)[]> = [];
  public groupError: Error | null = null;

  async xgroup(...args: (string | number)[]): Promise<string> {
    this.xgroupCalls.push(args);
    if (this.groupError) {
      throw this.groupError;
    }
    return "OK";
  }

  async xreadgroup(): Promise<XReadGroupResult | null> {
    return null;
  }

  async xautoclaim(): Promise<XAutoClaimResult> {
    return ["0-0", []];
  }

  async xack(): Promise<number> {
    return 0;
  }

  async xadd(): Promise<string> {
    return "1-0";
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async quit(): Promise<"OK"> {
    return "OK";
  }

  disconnect(): void {}
}

test("runIngestJob ensures the consumer group then idle-exits when empty", async () => {
  const client = new FakeRedis();

  const result = await runIngestJob({
    config: baseConfig(),
    client,
    db: {} as Db,
    isStopping: () => false,
    processEntries: async () => ({
      idsToAck: [],
      deadLetters: [],
      transformed: 0,
      loaded: 0,
      skippedMissingPayload: 0,
      failed: 0,
    }),
  });

  assert.equal(result, "idle-exit");
  assert.deepEqual(client.xgroupCalls[0], [
    "CREATE",
    "llm-gateway-request-logs",
    "gateway-ingest",
    "0",
    "MKSTREAM",
  ]);
});

test("runIngestJob treats BUSYGROUP as already created", async () => {
  const client = new FakeRedis();
  client.groupError = new Error("BUSYGROUP Consumer Group name already exists");

  const result = await runIngestJob({
    config: baseConfig(),
    client,
    db: {} as Db,
    isStopping: () => false,
    processEntries: async () => ({
      idsToAck: [],
      deadLetters: [],
      transformed: 0,
      loaded: 0,
      skippedMissingPayload: 0,
      failed: 0,
    }),
  });

  assert.equal(result, "idle-exit");
});

test("runIngestJob throws when the consumer group cannot be created", async () => {
  const client = new FakeRedis();
  client.groupError = new Error("NOAUTH Authentication required");

  await assert.rejects(
    () =>
      runIngestJob({
        config: baseConfig(),
        client,
        db: {} as Db,
        isStopping: () => false,
      }),
    /NOAUTH/,
  );
});
