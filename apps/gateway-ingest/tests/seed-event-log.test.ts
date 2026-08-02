import assert from "node:assert/strict";
import test from "node:test";

import {
  createRng,
  DEFAULT_PER_DAY_MAX,
  DEFAULT_PER_DAY_MIN,
  eachLogDate,
  generateMockEventLogRow,
  generateMockEventLogRows,
  resolvePerDayCount,
} from "../scripts/seed-event-log/generate.js";

test("eachLogDate is inclusive on both ends", () => {
  const dates = eachLogDate("2026-06-01", "2026-06-03");
  assert.deepEqual(dates, ["2026-06-01", "2026-06-02", "2026-06-03"]);
});

test("eachLogDate covers June 1 through August 1 2026", () => {
  const dates = eachLogDate("2026-06-01", "2026-08-01");
  assert.equal(dates[0], "2026-06-01");
  assert.equal(dates[dates.length - 1], "2026-08-01");
  // 30 + 31 + 1 = 62
  assert.equal(dates.length, 62);
});

test("generateMockEventLogRow fills required fields", () => {
  const row = generateMockEventLogRow("2026-07-15", createRng(1));
  assert.equal(row.logDate, "2026-07-15");
  assert.equal(row.schemaVersion, 1);
  assert.equal(row.eventType, "request");
  assert.equal(row.gatewayPath, "/chat");
  assert.equal(row.httpMethod, "POST");
  assert.equal(row.statusCode, 200);
  assert.equal(row.providerId, null);
  assert.equal(row.childKeyId, null);
  assert.equal(row.childKeyCreatorId, null);
  assert.ok(row.eventId.length > 0);
  assert.ok(row.requestId.length > 0);
  assert.ok(["openai", "anthropic"].includes(row.apiFamily));
  assert.ok(row.inputToken >= 10 && row.inputToken <= 100_000);
  assert.ok(row.outputToken >= 10 && row.outputToken <= 100_000);
  assert.ok(row.cachedInputToken >= 0 && row.cachedInputToken <= 1000);
  assert.equal(
    row.totalToken,
    row.cachedInputToken + row.inputToken + row.outputToken,
  );
  assert.ok(row.inputPrice >= 1 && row.inputPrice <= 15);
  assert.ok(row.outputPrice >= 2 && row.outputPrice <= 25);
  assert.ok(row.inputCachePrice >= 0 && row.inputCachePrice <= 10);
  assert.equal(row.startedAt.slice(0, 10), "2026-07-15");
  assert.ok(
    row.responseMode === "stream" || row.responseMode === "non-stream",
  );
  assert.equal(row.isStream, row.responseMode === "stream");
});

test("resolvePerDayCount uses fixed perDay when set", () => {
  assert.equal(resolvePerDayCount({ perDay: 42 }, createRng(1)), 42);
});

test("resolvePerDayCount samples within default 10–1000", () => {
  const rng = createRng(99);
  for (let i = 0; i < 50; i++) {
    const n = resolvePerDayCount({}, rng);
    assert.ok(n >= DEFAULT_PER_DAY_MIN && n <= DEFAULT_PER_DAY_MAX);
  }
});

test("generateMockEventLogRows uses random per-day counts by default", () => {
  const { rows, countsByDate } = generateMockEventLogRows({
    from: "2026-06-01",
    to: "2026-06-03",
    seed: 7,
  });

  const counts = Object.values(countsByDate);
  assert.equal(counts.length, 3);
  for (const c of counts) {
    assert.ok(c >= 10 && c <= 1000);
  }
  assert.equal(
    rows.length,
    counts.reduce((a, b) => a + b, 0),
  );
  // With a wide range, three days are very unlikely to all match.
  assert.ok(new Set(counts).size >= 1);
});

test("generateMockEventLogRows respects fixed per-day", () => {
  const { rows, countsByDate } = generateMockEventLogRows({
    from: "2026-06-01",
    to: "2026-06-02",
    perDay: 3,
    seed: 7,
  });
  assert.equal(rows.length, 6);
  assert.equal(countsByDate["2026-06-01"], 3);
  assert.equal(countsByDate["2026-06-02"], 3);
});
