import assert from "node:assert/strict";
import test from "node:test";

import type { ExtractedStreamEntry } from "../src/consumer/extract.js";
import type { Db } from "../src/lib/db.js";
import { processExtractedEntries } from "../src/process.js";

function makeEntry(
  partial: Partial<ExtractedStreamEntry> & {
    fields?: Record<string, string>;
  } = {},
): ExtractedStreamEntry {
  return {
    stream: "llm-gateway-request-logs",
    id: partial.id ?? "1-0",
    fields: partial.fields ?? {},
    source: partial.source ?? "xreadgroup",
    payloadMissing: partial.payloadMissing,
  };
}

function goodFields(): Record<string, string> {
  return {
    schema_version: "1",
    event_type: "request_log",
    event_id: "evt-1",
    request_id: "req-1",
    logged_at: "2026-03-17T12:00:00.000Z",
    started_at: "2026-03-17T11:59:59.000Z",
    completed_at: "2026-03-17T12:00:00.000Z",
    gateway_path: "/v1/chat/completions",
    http_method: "POST",
    api_family: "openai",
    provider_id: "prov-1",
    provider: "openai",
    requested_model: "gpt",
    requested_model_alias: "gpt",
    upstream_model: "gpt",
    upstream_url: "https://api.example.com",
    input_price: "1",
    output_price: "2",
    input_cache_price: "0.1",
    is_stream: "false",
    response_mode: "json",
    child_key_id: "ck-1",
    child_key_name: "dev",
    child_key_creator_id: "user-1",
    child_key_issued_at: "1",
    child_key_tags_json: "{}",
    user_email: "a@b.c",
    organization_id: "org-1",
    request_headers_json: "{}",
    metadata_json: "{}",
    capture_level: "metadata",
    status_code: "200",
    response_content_type: "application/json",
    response_headers_json: "{}",
    duration_ms: "10",
  };
}

type InsertCall = { table: "request" | "event"; row: unknown };

function fakeDb(options: {
  fail?: boolean;
  calls?: InsertCall[];
}): Db {
  const calls = options.calls ?? [];
  let insertIndex = 0;

  return {
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      if (options.fail) {
        throw new Error("db down");
      }
      const tx = {
        insert: (table: { [key: string]: unknown }) => {
          // Identify table by a distinctive column name present only on one side.
          // request_log has responseText; event_log has schemaVersion.
          const isRequest =
            "responseText" in table ||
            // drizzle table objects expose columns; fall back to call order
            false;
          return {
            values: (row: unknown) => ({
              onConflictDoNothing: async () => {
                const rowObj = row as Record<string, unknown>;
                const kind: "request" | "event" =
                  "responseText" in rowObj || "requestHeadersJson" in rowObj
                    ? "request"
                    : "event";
                void isRequest;
                void insertIndex;
                insertIndex += 1;
                calls.push({ table: kind, row });
              },
            }),
          };
        },
      };
      await fn(tx);
    },
  } as unknown as Db;
}

test("processExtractedEntries ACKs missing payload without DB write", async () => {
  const calls: InsertCall[] = [];
  const db = fakeDb({ calls });
  const result = await processExtractedEntries(db, [
    makeEntry({ id: "ghost-1", payloadMissing: true }),
  ]);
  assert.deepEqual(result.idsToAck, ["ghost-1"]);
  assert.equal(result.skippedMissingPayload, 1);
  assert.equal(result.loaded, 0);
  assert.equal(calls.length, 0);
});

test("processExtractedEntries dead-letters unrecoverable transform failures", async () => {
  const db = fakeDb({});
  const result = await processExtractedEntries(db, [
    makeEntry({ id: "bad-1", fields: { event_id: "only" } }),
  ]);
  assert.deepEqual(result.idsToAck, []);
  assert.equal(result.failed, 0);
  assert.equal(result.deadLetters.length, 1);
  assert.equal(result.deadLetters[0]?.id, "bad-1");
  assert.equal(result.loaded, 0);
});

test("processExtractedEntries loads and ACKs good entries", async () => {
  const calls: InsertCall[] = [];
  const db = fakeDb({ calls });
  const result = await processExtractedEntries(db, [
    makeEntry({ id: "ok-1", fields: goodFields() }),
  ]);
  assert.deepEqual(result.idsToAck, ["ok-1"]);
  assert.equal(result.transformed, 1);
  assert.equal(result.loaded, 1);
  assert.equal(result.failed, 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.table, "request");
  assert.equal(calls[1]?.table, "event");
});

test("processExtractedEntries does not ACK on load failure", async () => {
  const db = fakeDb({ fail: true });
  const result = await processExtractedEntries(db, [
    makeEntry({ id: "db-fail", fields: goodFields() }),
  ]);
  assert.deepEqual(result.idsToAck, []);
  assert.equal(result.failed, 1);
  assert.equal(result.transformed, 1);
  assert.equal(result.loaded, 0);
});
