import assert from "node:assert/strict";
import test from "node:test";

import {
  buildXReadGroupArgs,
  readGroupEntries,
} from "../src/consumer/read-group.js";
import type {
  RedisStreamClient,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

test("buildXReadGroupArgs matches XREADGROUP GROUP … COUNT BLOCK CLAIM STREAMS >", () => {
  const args = buildXReadGroupArgs({
    groupName: "mygroup",
    consumerName: "consumer1",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 60000,
    streamKey: "mystream",
  });

  assert.deepEqual(args, [
    "GROUP",
    "mygroup",
    "consumer1",
    "COUNT",
    10,
    "BLOCK",
    2000,
    "CLAIM",
    60000,
    "STREAMS",
    "mystream",
    ">",
  ]);
});

test("buildXReadGroupArgs omits COUNT/BLOCK/CLAIM when non-positive", () => {
  const args = buildXReadGroupArgs({
    groupName: "g",
    consumerName: "c",
    count: 0,
    blockMs: 0,
    claimMinIdleMs: 0,
    streamKey: "s",
  });

  assert.deepEqual(args, ["GROUP", "g", "c", "STREAMS", "s", ">"]);
});

class FakeRedis implements RedisStreamClient {
  public xreadgroupCalls: Array<(string | number | Buffer)[]> = [];
  public xgroupCalls: Array<(string | number)[]> = [];
  public reply: XReadGroupResult | null = null;
  public error: Error | null = null;

  async xgroup(...args: (string | number)[]): Promise<string> {
    this.xgroupCalls.push(args);
    return "OK";
  }

  async xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null> {
    this.xreadgroupCalls.push(args);
    if (this.error) {
      throw this.error;
    }
    return this.reply;
  }

  async quit(): Promise<"OK"> {
    return "OK";
  }

  disconnect(): void {}
}

test("readGroupEntries extracts entries from successful XREADGROUP", async () => {
  const client = new FakeRedis();
  client.reply = [
    [
      "llm-gateway-request-logs",
      [
        [
          "1-0",
          ["event_id", "e1", "schema_version", "1"],
        ],
      ],
    ],
  ];

  const result = await readGroupEntries({
    client,
    streamKey: "llm-gateway-request-logs",
    groupName: "gateway-ingest",
    consumerName: "consumer-1",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0]?.id, "1-0");
  assert.equal(result.entries[0]?.fields.event_id, "e1");
  assert.deepEqual(client.xreadgroupCalls[0], [
    "GROUP",
    "gateway-ingest",
    "consumer-1",
    "COUNT",
    10,
    "BLOCK",
    2000,
    "CLAIM",
    60000,
    "STREAMS",
    "llm-gateway-request-logs",
    ">",
  ]);
});

test("readGroupEntries returns empty entries on null reply (block timeout)", async () => {
  const client = new FakeRedis();
  client.reply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.entries, []);
  }
});

test("readGroupEntries surfaces Redis errors", async () => {
  const client = new FakeRedis();
  client.error = new Error("connection refused");

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(String(result.error), /connection refused/);
  }
});
