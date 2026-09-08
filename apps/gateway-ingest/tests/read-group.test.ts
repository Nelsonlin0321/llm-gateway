import assert from "node:assert/strict";
import test from "node:test";

import {
  buildXAutoClaimArgs,
  buildXReadGroupArgs,
  readGroupEntries,
} from "../src/consumer/read-group.js";
import type {
  RedisStreamClient,
  XAutoClaimResult,
  XPendingResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

test("buildXReadGroupArgs matches classic XREADGROUP (no CLAIM)", () => {
  const args = buildXReadGroupArgs({
    groupName: "mygroup",
    consumerName: "consumer1",
    count: 10,
    blockMs: 2000,
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
    "STREAMS",
    "mystream",
    ">",
  ]);
  assert.ok(!args.includes("CLAIM"));
});

test("buildXReadGroupArgs omits COUNT/BLOCK when non-positive", () => {
  const args = buildXReadGroupArgs({
    groupName: "g",
    consumerName: "c",
    count: 0,
    blockMs: 0,
    streamKey: "s",
  });

  assert.deepEqual(args, ["GROUP", "g", "c", "STREAMS", "s", ">"]);
});

test("buildXAutoClaimArgs uses provided start cursor", () => {
  const args = buildXAutoClaimArgs({
    streamKey: "mystream",
    groupName: "mygroup",
    consumerName: "consumer1",
    claimMinIdleMs: 60000,
    startId: "5-0",
    count: 10,
  });

  assert.deepEqual(args, [
    "mystream",
    "mygroup",
    "consumer1",
    60000,
    "5-0",
    "COUNT",
    10,
  ]);
});

class FakeRedis implements RedisStreamClient {
  public xreadgroupCalls: Array<(string | number | Buffer)[]> = [];
  public xautoclaimCalls: Array<(string | number | Buffer)[]> = [];
  public xackCalls: Array<{ key: string; group: string; ids: string[] }> = [];
  public xgroupCalls: Array<(string | number)[]> = [];

  public readReply: XReadGroupResult | null = null;
  public claimReply: XAutoClaimResult = ["0-0", []];
  public pendingReply: XPendingResult = [];
  public pendingError: Error | null = null;
  public xpendingCalls: Array<{
    key: string;
    group: string;
    start: string;
    end: string;
    count: number;
    consumer?: string;
  }> = [];
  public readError: Error | null = null;
  public claimError: Error | null = null;

  async xgroup(...args: (string | number)[]): Promise<string> {
    this.xgroupCalls.push(args);
    return "OK";
  }

  async xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null> {
    this.xreadgroupCalls.push(args);
    if (this.readError) {
      throw this.readError;
    }
    return this.readReply;
  }

  async xautoclaim(
    ...args: (string | number | Buffer)[]
  ): Promise<XAutoClaimResult> {
    this.xautoclaimCalls.push(args);
    if (this.claimError) {
      throw this.claimError;
    }
    return this.claimReply;
  }

  async xack(key: string, group: string, ...ids: string[]): Promise<number> {
    this.xackCalls.push({ key, group, ids });
    return ids.length;
  }

  async xpending(
    key: string,
    group: string,
    start: string,
    end: string,
    count: number,
    consumer?: string,
  ): Promise<XPendingResult> {
    this.xpendingCalls.push({ key, group, start, end, count, consumer });
    if (this.pendingError) {
      throw this.pendingError;
    }
    return this.pendingReply;
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

test("readGroupEntries claims idle pending then fills remaining with new messages", async () => {
  const client = new FakeRedis();
  client.claimReply = [
    "5-0",
    [["1-0", ["event_id", "claimed-1", "schema_version", "1"]]],
  ];
  client.readReply = [
    [
      "llm-gateway-request-logs",
      [["2-0", ["event_id", "new-1", "schema_version", "1"]]],
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
    autoclaimStartId: "0-0",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.claimedCount, 1);
  assert.equal(result.newCount, 1);
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[0]?.source, "autoclaim");
  assert.equal(result.entries[1]?.source, "xreadgroup");
  assert.equal(result.entries[1]?.deliveryCount, 1);
  assert.equal(result.nextAutoclaimStartId, "5-0");

  assert.deepEqual(client.xautoclaimCalls[0], [
    "llm-gateway-request-logs",
    "gateway-ingest",
    "consumer-1",
    60000,
    "0-0",
    "COUNT",
    10,
  ]);

  // Claim returned work → new-message read is non-blocking with remaining COUNT.
  assert.deepEqual(client.xreadgroupCalls[0], [
    "GROUP",
    "gateway-ingest",
    "consumer-1",
    "COUNT",
    9,
    "STREAMS",
    "llm-gateway-request-logs",
    ">",
  ]);
  assert.ok(!client.xreadgroupCalls[0]?.includes("CLAIM"));
  assert.ok(!client.xreadgroupCalls[0]?.includes("BLOCK"));
});

test("readGroupEntries advances XAUTOCLAIM cursor for large PEL pagination", async () => {
  const client = new FakeRedis();
  client.claimReply = ["20-0", [["10-0", ["event_id", "page-2"]]]];
  client.readReply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 60000,
    autoclaimStartId: "10-0",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.nextAutoclaimStartId, "20-0");
  assert.equal(result.claimedCount, 1);
  assert.deepEqual(client.xautoclaimCalls[0], [
    "s",
    "g",
    "c",
    60000,
    "10-0",
    "COUNT",
    10,
  ]);
});

test("readGroupEntries blocks on XREADGROUP when claim returns nothing", async () => {
  const client = new FakeRedis();
  client.claimReply = ["0-0", []];
  client.readReply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 100,
    blockMs: 2000,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.entries, []);
  assert.equal(result.claimedCount, 0);
  assert.equal(result.newCount, 0);

  assert.deepEqual(client.xreadgroupCalls[0], [
    "GROUP",
    "g",
    "c",
    "COUNT",
    100,
    "BLOCK",
    2000,
    "STREAMS",
    "s",
    ">",
  ]);
});

test("readGroupEntries skips XAUTOCLAIM when claimMinIdleMs is 0", async () => {
  const client = new FakeRedis();
  client.readReply = [
    ["s", [["3-0", ["event_id", "only-new"]]]],
  ];

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 2000,
    claimMinIdleMs: 0,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(client.xautoclaimCalls.length, 0);
  assert.equal(result.claimedCount, 0);
  assert.equal(result.newCount, 1);
  assert.equal(result.entries[0]?.fields.event_id, "only-new");
});

test("readGroupEntries skips XREADGROUP when claim fills COUNT budget", async () => {
  const client = new FakeRedis();
  client.claimReply = [
    "9-0",
    [
      ["1-0", ["event_id", "a"]],
      ["2-0", ["event_id", "b"]],
    ],
  ];

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 2,
    blockMs: 2000,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.claimedCount, 2);
  assert.equal(result.newCount, 0);
  assert.equal(client.xreadgroupCalls.length, 0);
});

test("readGroupEntries surfaces XAUTOCLAIM errors", async () => {
  const client = new FakeRedis();
  client.claimError = new Error("NOGROUP No such key");

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
    assert.equal(result.stage, "xautoclaim");
    assert.match(String(result.error), /NOGROUP/);
  }
});

test("readGroupEntries attaches XPENDING delivery counts to claimed entries", async () => {
  const client = new FakeRedis();
  client.claimReply = [
    "5-0",
    [
      ["1-0", ["event_id", "claimed-1"]],
      ["2-0", ["event_id", "claimed-2"]],
    ],
  ];
  client.pendingReply = [
    ["1-0", "consumer-1", 60000, 4],
    ["2-0", "consumer-1", 60000, 2],
  ];
  client.readReply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 0,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.entries[0]?.deliveryCount, 4);
  assert.equal(result.entries[1]?.deliveryCount, 2);
  assert.equal(client.xpendingCalls.length, 1);
  assert.deepEqual(client.xpendingCalls[0], {
    key: "s",
    group: "g",
    start: "1-0",
    end: "2-0",
    count: 2,
    consumer: "c",
  });
});

test("readGroupEntries defaults missing XPENDING ids to deliveryCount 2", async () => {
  const client = new FakeRedis();
  client.claimReply = ["1-0", [["1-0", ["event_id", "claimed-1"]]]];
  client.pendingReply = [];
  client.readReply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 0,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.entries[0]?.deliveryCount, 2);
});

test("readGroupEntries leaves deliveryCount unset when XPENDING fails", async () => {
  const client = new FakeRedis();
  client.claimReply = ["1-0", [["1-0", ["event_id", "claimed-1"]]]];
  client.pendingError = new Error("XPENDING unavailable");
  client.readReply = null;

  const result = await readGroupEntries({
    client,
    streamKey: "s",
    groupName: "g",
    consumerName: "c",
    count: 10,
    blockMs: 0,
    claimMinIdleMs: 60000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.entries[0]?.deliveryCount, undefined);
});

test("readGroupEntries surfaces XREADGROUP errors", async () => {
  const client = new FakeRedis();
  client.claimReply = ["0-0", []];
  client.readError = new Error("connection refused");

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
    assert.equal(result.stage, "xreadgroup");
    assert.match(String(result.error), /connection refused/);
  }
});
