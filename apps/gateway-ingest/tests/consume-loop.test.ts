import assert from "node:assert/strict";
import test from "node:test";

import { runConsumeLoop } from "../src/consume-loop.js";
import type { IngestConfig } from "../src/lib/config.js";
import type { Db } from "../src/lib/db.js";
import type {
  RedisStreamClient,
  XAutoClaimResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";
import type { ProcessBatchResult } from "../src/process.js";

function baseConfig(overrides: Partial<IngestConfig> = {}): IngestConfig {
  return {
    redisUrl: "redis://127.0.0.1:6379",
    streamKey: "llm-gateway-request-logs",
    groupName: "gateway-ingest",
    consumerName: "consumer-1",
    count: 10,
    blockMs: 5_000,
    claimMinIdleMs: 0,
    idleExitMs: 1_000,
    maxDurationMs: 0,
    ...overrides,
  };
}

class FakeRedis implements RedisStreamClient {
  public reads = 0;
  public xaddCalls = 0;
  public xackCalls: string[][] = [];
  public replies: Array<XReadGroupResult | null> = [];

  constructor(private readonly onRead?: (blockMs: number) => void) {}

  async xgroup(): Promise<string> {
    return "OK";
  }

  async xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null> {
    const blockIdx = args.indexOf("BLOCK");
    const blockMs =
      blockIdx >= 0 ? Number(args[blockIdx + 1]) : 0;
    this.onRead?.(blockMs);
    const reply = this.replies[this.reads] ?? null;
    this.reads += 1;
    return reply;
  }

  async xautoclaim(): Promise<XAutoClaimResult> {
    return ["0-0", []];
  }

  async xack(_key: string, _group: string, ...ids: string[]): Promise<number> {
    this.xackCalls.push(ids);
    return ids.length;
  }

  async xadd(): Promise<string> {
    this.xaddCalls += 1;
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

function entryReply(id: string): XReadGroupResult {
  return [
    [
      "llm-gateway-request-logs",
      [[id, ["event_id", id, "schema_version", "1"]]],
    ],
  ];
}

function okBatch(ids: string[]): ProcessBatchResult {
  return {
    idsToAck: ids,
    deadLetters: [],
    transformed: ids.length,
    loaded: ids.length,
    skippedMissingPayload: 0,
    failed: 0,
  };
}

test("runConsumeLoop idle-exits when no events arrive before the timeout", async () => {
  let now = 0;
  const client = new FakeRedis((blockMs) => {
    now += blockMs;
  });

  const result = await runConsumeLoop({
    config: baseConfig({ idleExitMs: 1_000, blockMs: 400 }),
    client,
    db: {} as Db,
    isStopping: () => false,
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    processEntries: async () => okBatch([]),
  });

  assert.equal(result, "idle-exit");
  assert.ok(client.reads >= 1);
});

test("runConsumeLoop idle-exits immediately on an empty non-blocking read", async () => {
  const client = new FakeRedis();

  const result = await runConsumeLoop({
    config: baseConfig({ idleExitMs: 30_000, blockMs: 0 }),
    client,
    db: {} as Db,
    isStopping: () => false,
    processEntries: async () => okBatch([]),
  });

  assert.equal(result, "idle-exit");
  assert.equal(client.reads, 1);
});

test("runConsumeLoop resets the idle timer when a new event is ingested", async () => {
  let now = 0;
  const client = new FakeRedis((blockMs) => {
    now += blockMs;
  });
  client.replies = [entryReply("1-0")];
  const processed: string[] = [];

  const result = await runConsumeLoop({
    config: baseConfig({ idleExitMs: 1_000, blockMs: 400 }),
    client,
    db: {} as Db,
    isStopping: () => false,
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    processEntries: async (_db, entries) => {
      processed.push(...entries.map((e) => e.id));
      return okBatch(entries.map((e) => e.id));
    },
  });

  assert.equal(result, "idle-exit");
  assert.deepEqual(processed, ["1-0"]);
  // Event arrived after 400ms of BLOCK and reset the 1000ms timer, so the
  // run must last at least 1400ms (not the original 1000ms deadline).
  assert.ok(now >= 1_400);
  assert.deepEqual(client.xackCalls[0], ["1-0"]);
});

test("runConsumeLoop does not idle-exit when idleExitMs is 0", async () => {
  let now = 0;
  let loops = 0;
  const client = new FakeRedis((blockMs) => {
    now += blockMs;
    loops += 1;
  });

  const result = await runConsumeLoop({
    config: baseConfig({ idleExitMs: 0, blockMs: 100 }),
    client,
    db: {} as Db,
    isStopping: () => loops >= 5,
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    processEntries: async () => okBatch([]),
  });

  assert.equal(result, "stopped");
  assert.equal(loops, 5);
});

test("runConsumeLoop returns stopped when isStopping is true", async () => {
  const client = new FakeRedis();
  const result = await runConsumeLoop({
    config: baseConfig({ idleExitMs: 0 }),
    client,
    db: {} as Db,
    isStopping: () => true,
    processEntries: async () => okBatch([]),
  });

  assert.equal(result, "stopped");
  assert.equal(client.reads, 0);
});

test("runConsumeLoop stops at maxDurationMs even with remaining work", async () => {
  let now = 0;
  const client = new FakeRedis();
  client.replies = [entryReply("1-0"), entryReply("2-0"), entryReply("3-0")];

  const result = await runConsumeLoop({
    config: baseConfig({
      idleExitMs: 0,
      blockMs: 0,
      maxDurationMs: 50,
    }),
    client,
    db: {} as Db,
    isStopping: () => false,
    now: () => now,
    sleep: async () => {},
    processEntries: async (_db, entries) => {
      now += 40;
      return okBatch(entries.map((e) => e.id));
    },
  });

  assert.equal(result, "max-duration");
  assert.ok(client.xackCalls.length >= 1);
  assert.ok(client.reads >= 1);
  assert.ok(client.reads < 3);
});
