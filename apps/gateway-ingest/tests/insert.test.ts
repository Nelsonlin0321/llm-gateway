/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import { loadRows } from "../src/load/insert.js";
import { clearEnsuredPartitionCache } from "../src/load/partitions.js";
import type { Db } from "../src/lib/db.js";
import type { NewEventLog, NewRequestLog } from "../src/db/schema.js";

function sampleRows(): {
  requestLog: NewRequestLog;
  eventLog: NewEventLog;
} {
  const now = new Date("2026-08-01T12:00:00.000Z");
  return {
    requestLog: {
      eventId: "evt-1",
      requestId: "req-1",
      requestHeadersJson: null,
      requestPayloadJson: null,
      responseHeadersJson: null,
      responseText: null,
      statusCode: 200,
      isStream: false,
      gatewayPath: "/v1/chat/completions",
      loggedAt: now,
      logDate: "2026-08-01",
      createdAt: now,
      updatedAt: now,
    },
    eventLog: {
      eventId: "evt-1",
      requestId: "req-1",
      schemaVersion: 1,
      eventType: "request_log",
      startedAt: now,
      completedAt: now,
      gatewayPath: "/v1/chat/completions",
      httpMethod: "POST",
      apiFamily: "openai",
      providerId: null,
      provider: "openai",
      requestedModel: "gpt",
      requestedModelAlias: "gpt",
      upstreamModel: "gpt",
      upstreamUrl: "https://example.com",
      isStream: false,
      responseMode: "json",
      childKeyId: null,
      childKeyName: "dev",
      childKeyCreatorId: null,
      childKeyIssuedAt: null,
      childKeyTagsJson: null,
      userEmail: "a@b.c",
      metadataJson: null,
      statusCode: 200,
      responseContentType: null,
      durationMs: 10,
      firstTokenMs: null,
      responseId: null,
      inputToken: 0,
      outputToken: 0,
      cachedInputToken: 0,
      totalToken: 0,
      cost: 0,
      loggedAt: now,
      logDate: "2026-08-01",
      inputPrice: 1,
      outputPrice: 2,
      inputCachePrice: 0.1,
      createdAt: now,
      updatedAt: now,
    },
  };
}

const missingPartitionError = {
  code: "23514",
  message: 'no partition of relation "request_log" found for row',
  detail:
    "Partition key of the failing row contains (log_date) = (2026-08-01).",
};

function makeDb(options: {
  /** Fail first N insert transactions with missing-partition error. */
  failInsertTimes?: number;
  executeError?: unknown;
  ddl?: string[];
  inserts?: number;
}): Db {
  let insertAttempts = 0;
  const failTimes = options.failInsertTimes ?? 0;
  const ddl = options.ddl ?? [];

  return {
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      insertAttempts += 1;
      if (insertAttempts <= failTimes) {
        throw missingPartitionError;
      }
      const tx = {
        insert: () => ({
          values: async () => {
            options.inserts = (options.inserts ?? 0) + 1;
          },
        }),
      };
      await fn(tx);
    },
    execute: async (query: unknown) => {
      if (options.executeError) {
        throw options.executeError;
      }
      const text = String(
        (query as { queryChunks?: Array<{ value?: string[] }> })
          .queryChunks?.[0]?.value?.[0] ?? query,
      );
      ddl.push(text);
    },
  } as unknown as Db;
}

test("loadRows succeeds on first insert when partition exists", async () => {
  clearEnsuredPartitionCache();
  const db = makeDb({});
  const result = await loadRows(db, sampleRows());
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.createdPartition, undefined);
  }
});

test("loadRows creates partitions and retries on missing partition", async () => {
  clearEnsuredPartitionCache();
  const ddl: string[] = [];
  const db = makeDb({ failInsertTimes: 1, ddl });
  const result = await loadRows(db, sampleRows());
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.createdPartition, true);
  }
  assert.equal(ddl.length, 2);
  assert.match(ddl[0] ?? "", /request_log_2026_08_01/);
  assert.match(ddl[1] ?? "", /event_log_2026_08_01/);
});

test("loadRows surfaces non-partition errors without CREATE", async () => {
  clearEnsuredPartitionCache();
  const ddl: string[] = [];
  const db = {
    transaction: async () => {
      throw new Error("connection refused");
    },
    execute: async () => {
      ddl.push("should-not-run");
    },
  } as unknown as Db;

  const result = await loadRows(db, sampleRows());
  assert.equal(result.ok, false);
  assert.equal(ddl.length, 0);
});

test("loadRows fails when partition create fails", async () => {
  clearEnsuredPartitionCache();
  const db = makeDb({
    failInsertTimes: 1,
    executeError: new Error("permission denied"),
  });
  const result = await loadRows(db, sampleRows());
  assert.equal(result.ok, false);
});
