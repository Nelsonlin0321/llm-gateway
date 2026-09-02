import assert from "node:assert/strict";
import test from "node:test";

import { ackEntries } from "../src/consumer/ack.js";
import type {
  RedisStreamClient,
  XAutoClaimResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

class FakeRedis implements RedisStreamClient {
  public xackCalls: Array<{ key: string; group: string; ids: string[] }> = [];
  public error: Error | null = null;

  async xgroup(): Promise<string> {
    return "OK";
  }

  async xreadgroup(): Promise<XReadGroupResult | null> {
    return null;
  }

  async xautoclaim(): Promise<XAutoClaimResult> {
    return ["0-0", []];
  }

  async xack(key: string, group: string, ...ids: string[]): Promise<number> {
    this.xackCalls.push({ key, group, ids });
    if (this.error) {
      throw this.error;
    }
    return ids.length;
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

test("ackEntries no-ops on empty ids", async () => {
  const client = new FakeRedis();
  const result = await ackEntries({
    client,
    streamKey: "s",
    groupName: "g",
    ids: [],
  });

  assert.deepEqual(result, { ok: true, acked: 0 });
  assert.equal(client.xackCalls.length, 0);
});

test("ackEntries XACKs all ids", async () => {
  const client = new FakeRedis();
  const result = await ackEntries({
    client,
    streamKey: "llm-gateway-request-logs",
    groupName: "gateway-ingest",
    ids: ["1-0", "2-0"],
  });

  assert.deepEqual(result, { ok: true, acked: 2 });
  assert.deepEqual(client.xackCalls[0], {
    key: "llm-gateway-request-logs",
    group: "gateway-ingest",
    ids: ["1-0", "2-0"],
  });
});

test("ackEntries surfaces Redis errors", async () => {
  const client = new FakeRedis();
  client.error = new Error("READONLY");

  const result = await ackEntries({
    client,
    streamKey: "s",
    groupName: "g",
    ids: ["1-0"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(String(result.error), /READONLY/);
  }
});
