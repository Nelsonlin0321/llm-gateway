import assert from "node:assert/strict";
import test from "node:test";

import { ensureConsumerGroup } from "../src/consumer/ensure-group.js";
import type {
  RedisStreamClient,
  XAutoClaimResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

class FakeRedis implements RedisStreamClient {
  public xgroupCalls: Array<(string | number)[]> = [];
  public error: Error | null = null;

  async xgroup(...args: (string | number)[]): Promise<string> {
    this.xgroupCalls.push(args);
    if (this.error) {
      throw this.error;
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

test("ensureConsumerGroup creates group with MKSTREAM from id 0", async () => {
  const client = new FakeRedis();
  const result = await ensureConsumerGroup({
    client,
    streamKey: "llm-gateway-request-logs",
    groupName: "gateway-ingest",
  });

  assert.deepEqual(result, { ok: true, created: true });
  assert.deepEqual(client.xgroupCalls[0], [
    "CREATE",
    "llm-gateway-request-logs",
    "gateway-ingest",
    "0",
    "MKSTREAM",
  ]);
});

test("ensureConsumerGroup treats BUSYGROUP as already created", async () => {
  const client = new FakeRedis();
  client.error = new Error(
    "BUSYGROUP Consumer Group name already exists",
  );

  const result = await ensureConsumerGroup({
    client,
    streamKey: "s",
    groupName: "g",
  });

  assert.deepEqual(result, { ok: true, created: false });
});

test("ensureConsumerGroup surfaces other errors", async () => {
  const client = new FakeRedis();
  client.error = new Error("NOAUTH Authentication required");

  const result = await ensureConsumerGroup({
    client,
    streamKey: "s",
    groupName: "g",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(String(result.error), /NOAUTH/);
  }
});
