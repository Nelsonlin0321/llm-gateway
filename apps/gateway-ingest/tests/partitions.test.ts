import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreatePartitionSql,
  clearEnsuredPartitionCache,
  ensureDayPartitions,
  isAlreadyExistsError,
  isMissingPartitionError,
  isValidLogDate,
  nextLogDate,
  normalizeLogDate,
  partitionTableName,
} from "../src/load/partitions.js";
import type { Db } from "../src/lib/db.js";

test("isValidLogDate accepts calendar dates only", () => {
  assert.equal(isValidLogDate("2026-08-01"), true);
  assert.equal(isValidLogDate("2026-02-28"), true);
  assert.equal(isValidLogDate("2026-13-01"), false);
  assert.equal(isValidLogDate("2026-08-1"), false);
  assert.equal(isValidLogDate("not-a-date"), false);
});

test("normalizeLogDate handles string and Date", () => {
  assert.equal(normalizeLogDate("2026-08-01"), "2026-08-01");
  assert.equal(normalizeLogDate("2026-08-01T12:00:00.000Z"), "2026-08-01");
  assert.equal(
    normalizeLogDate(new Date("2026-08-01T15:30:00.000Z")),
    "2026-08-01",
  );
  assert.equal(normalizeLogDate(null), null);
  assert.equal(normalizeLogDate("bad"), null);
});

test("nextLogDate advances one UTC day", () => {
  assert.equal(nextLogDate("2026-08-01"), "2026-08-02");
  assert.equal(nextLogDate("2026-12-31"), "2027-01-01");
});

test("partitionTableName matches example naming", () => {
  assert.equal(
    partitionTableName("request_log", "2026-08-01"),
    "request_log_2026_08_01",
  );
  assert.equal(
    partitionTableName("event_log", "2026-08-01"),
    "event_log_2026_08_01",
  );
});

test("buildCreatePartitionSql matches expected DDL", () => {
  assert.equal(
    buildCreatePartitionSql("request_log", "2026-08-01"),
    "CREATE TABLE IF NOT EXISTS request_log_2026_08_01 PARTITION OF request_log " +
      "FOR VALUES FROM ('2026-08-01') TO ('2026-08-02')",
  );
});

test("isMissingPartitionError detects Postgres partition miss", () => {
  assert.equal(
    isMissingPartitionError({
      code: "23514",
      message: 'no partition of relation "request_log" found for row',
      detail:
        "Partition key of the failing row contains (log_date) = (2026-08-01).",
    }),
    true,
  );
  assert.equal(
    isMissingPartitionError({
      message: "wrapped",
      cause: {
        code: "23514",
        message: 'no partition of relation "event_log" found for row',
      },
    }),
    true,
  );
  assert.equal(
    isMissingPartitionError({ code: "23514", message: "check constraint" }),
    false,
  );
  assert.equal(isMissingPartitionError(new Error("other")), false);
});

test("isAlreadyExistsError detects 42P07", () => {
  assert.equal(
    isAlreadyExistsError({ code: "42P07", message: "exists" }),
    true,
  );
  assert.equal(
    isAlreadyExistsError({ message: 'relation "x" already exists' }),
    true,
  );
  assert.equal(isAlreadyExistsError({ code: "23514" }), false);
});

test("ensureDayPartitions runs CREATE for both parents once", async () => {
  clearEnsuredPartitionCache();
  const executed: string[] = [];
  const db = {
    execute: async (query: { queryChunks?: unknown } | string) => {
      // drizzle sql.raw — extract string from toSQL or stringified form
      const text =
        typeof query === "string"
          ? query
          : String(
              (query as { sql?: string }).sql ??
                (query as { queryChunks?: Array<{ value?: string[] }> })
                  .queryChunks?.[0]?.value?.[0] ??
                query,
            );
      executed.push(text);
    },
  } as unknown as Db;

  await ensureDayPartitions(db, "2026-08-01");
  assert.equal(executed.length, 2);
  assert.match(executed[0] ?? "", /request_log_2026_08_01/);
  assert.match(executed[1] ?? "", /event_log_2026_08_01/);

  // Second call is cached — no more DDL.
  await ensureDayPartitions(db, "2026-08-01");
  assert.equal(executed.length, 2);
});
