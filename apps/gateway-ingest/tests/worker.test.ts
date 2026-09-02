import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { resetRedisClient } from "../src/lib/redis-client.js";

const emptyCtx = {
  waitUntil() {},
  passThroughOnException() {},
};

/** Override Bun-loaded `.env` so unit tests never hit live Redis/Postgres. */
const noRedisEnv = {
  REDIS_URL: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  DATABASE_URL: "",
};

test("fetch /health returns ok without Redis or Postgres", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/health"),
    {},
    emptyCtx,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("fetch / returns scheduled job info", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/"),
    {},
    emptyCtx,
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as { name: string; scheduled: boolean };
  assert.equal(body.name, "gateway-ingest");
  assert.equal(body.scheduled, true);
  assert.equal("run" in body, false);
});

test("fetch unknown path returns 404", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/nope"),
    {},
    emptyCtx,
  );
  assert.equal(response.status, 404);
});

async function withClearedRedisEnv<T>(fn: () => Promise<T>): Promise<T> {
  const previous = {
    REDIS_URL: process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
  };
  resetRedisClient();
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    resetRedisClient();
  }
}

test("scheduled() fails fast without Redis credentials", async () => {
  await withClearedRedisEnv(async () => {
    await assert.rejects(
      () =>
        worker.scheduled(
          {
            cron: "* * * * *",
            scheduledTime: Date.now(),
            noRetry() {},
          },
          noRedisEnv,
          emptyCtx,
        ),
      /REDIS_URL is required/,
    );
  });
});

test("fetch /run is not exposed", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/run", { method: "POST" }),
    {},
    emptyCtx,
  );
  assert.equal(response.status, 404);
});
