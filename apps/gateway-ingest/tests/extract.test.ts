import assert from "node:assert/strict";
import test from "node:test";

import {
  extractAutoclaimEntries,
  extractStreamEntries,
  fieldsArrayToRecord,
} from "../src/consumer/extract.js";
import type {
  XAutoClaimResult,
  XReadGroupResult,
} from "../src/lib/redis-client.js";

test("fieldsArrayToRecord pairs alternating key/value entries", () => {
  const record = fieldsArrayToRecord([
    "schema_version",
    "1",
    "event_type",
    "request_log",
    "event_id",
    "evt-1",
  ]);

  assert.deepEqual(record, {
    schema_version: "1",
    event_type: "request_log",
    event_id: "evt-1",
  });
});

test("fieldsArrayToRecord last value wins for duplicate keys", () => {
  const record = fieldsArrayToRecord(["a", "1", "a", "2"]);
  assert.equal(record.a, "2");
});

test("fieldsArrayToRecord ignores a trailing orphan key", () => {
  const record = fieldsArrayToRecord(["a", "1", "orphan"]);
  assert.deepEqual(record, { a: "1" });
});

test("extractStreamEntries returns empty for null / empty reply", () => {
  assert.deepEqual(extractStreamEntries(null), []);
  assert.deepEqual(extractStreamEntries(undefined), []);
  assert.deepEqual(extractStreamEntries([]), []);
});

test("extractStreamEntries parses a multi-entry XREADGROUP reply", () => {
  const reply: XReadGroupResult = [
    [
      "llm-gateway-request-logs",
      [
        [
          "1710000000000-0",
          [
            "schema_version",
            "1",
            "event_type",
            "request_log",
            "event_id",
            "evt-a",
            "provider",
            "openai",
          ],
        ],
        [
          "1710000000001-0",
          [
            "schema_version",
            "1",
            "event_type",
            "request_log",
            "event_id",
            "evt-b",
            "provider",
            "anthropic",
          ],
        ],
      ],
    ],
  ];

  const entries = extractStreamEntries(reply);

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.source, "xreadgroup");
  assert.deepEqual(entries[0], {
    stream: "llm-gateway-request-logs",
    id: "1710000000000-0",
    fields: {
      schema_version: "1",
      event_type: "request_log",
      event_id: "evt-a",
      provider: "openai",
    },
    source: "xreadgroup",
  });
  assert.equal(entries[1]?.id, "1710000000001-0");
  assert.equal(entries[1]?.fields.provider, "anthropic");
});

test("extractStreamEntries marks null payload entries", () => {
  const reply: XReadGroupResult = [
    ["s", [["1-0", null]]],
  ];
  const entries = extractStreamEntries(reply);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.payloadMissing, true);
  assert.deepEqual(entries[0]?.fields, {});
});

test("extractStreamEntries skips malformed stream/entry rows", () => {
  const reply = [
    ["only-key"],
    [
      "good-stream",
      [
        ["bad-entry"],
        ["ok-id", ["k", "v"]],
      ],
    ],
  ] as unknown as XReadGroupResult;

  const entries = extractStreamEntries(reply);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    stream: "good-stream",
    id: "ok-id",
    fields: { k: "v" },
    source: "xreadgroup",
  });
});

test("extractAutoclaimEntries parses next cursor and entries", () => {
  const reply: XAutoClaimResult = [
    "9-0",
    [
      ["1-0", ["event_id", "c1"]],
      ["2-0", null],
    ],
    ["ghost-id"],
  ];

  const { nextStartId, entries } = extractAutoclaimEntries(
    "llm-gateway-request-logs",
    reply,
  );

  assert.equal(nextStartId, "9-0");
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.source, "autoclaim");
  assert.equal(entries[0]?.fields.event_id, "c1");
  assert.equal(entries[1]?.payloadMissing, true);
});

test("extractAutoclaimEntries handles empty / malformed reply", () => {
  assert.deepEqual(extractAutoclaimEntries("s", null), {
    nextStartId: "0-0",
    entries: [],
  });
  assert.deepEqual(extractAutoclaimEntries("s", undefined), {
    nextStartId: "0-0",
    entries: [],
  });
});
