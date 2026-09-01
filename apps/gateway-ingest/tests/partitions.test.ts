import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreateDayPartitionSql,
  buildCreateOrgPartitionSql,
  clearEnsuredPartitionCache,
  dayPartitionTableName,
  ensureDayPartitions,
  isAlreadyExistsError,
  isMissingPartitionError,
  isNotPartitionedError,
  isValidLogDate,
  isValidOrganizationId,
  nextLogDate,
  normalizeLogDate,
  normalizeOrganizationId,
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

test("normalizeOrganizationId sanitizes for identifiers", () => {
  assert.equal(normalizeOrganizationId("org-1"), "org_1");
  assert.equal(
    normalizeOrganizationId("550e8400-e29b-41d4-a716-446655440000"),
    "550e8400_e29b_41d4_a716_446655440000",
  );
  assert.equal(isValidOrganizationId(""), false);
  assert.equal(isValidOrganizationId("org-1"), true);
  assert.throws(() => normalizeOrganizationId("   "));
  assert.throws(() => normalizeOrganizationId("!!!"));
});

test("partitionTableName matches date + org naming", () => {
  assert.equal(
    dayPartitionTableName("request_log", "2026-08-23"),
    "request_log_2026_08_23",
  );
  assert.equal(
    partitionTableName("request_log", "2026-08-23", "org-1"),
    "request_log_2026_08_23_org_1",
  );
  assert.equal(
    partitionTableName("event_log", "2026-08-23", "org-1"),
    "event_log_2026_08_23_org_1",
  );
});

test("buildCreateDayPartitionSql LIST-partitions the daily child", () => {
  assert.equal(
    buildCreateDayPartitionSql("request_log", "2026-08-23"),
    "CREATE TABLE IF NOT EXISTS request_log_2026_08_23 PARTITION OF request_log " +
      "FOR VALUES FROM ('2026-08-23') TO ('2026-08-24') " +
      "PARTITION BY LIST (organization_id)",
  );
});

test("buildCreateOrgPartitionSql attaches the org leaf", () => {
  assert.equal(
    buildCreateOrgPartitionSql("request_log", "2026-08-23", "org-1"),
    "CREATE TABLE IF NOT EXISTS request_log_2026_08_23_org_1 PARTITION OF request_log_2026_08_23 " +
      "FOR VALUES IN ('org-1')",
  );
  assert.equal(
    buildCreateOrgPartitionSql("event_log", "2026-08-23", "o'hara"),
    "CREATE TABLE IF NOT EXISTS event_log_2026_08_23_o_hara PARTITION OF event_log_2026_08_23 " +
      "FOR VALUES IN ('o''hara')",
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
    isMissingPartitionError({
      code: "23514",
      message: 'no partition of relation "request_log_2026_08_23" found for row',
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

test("isNotPartitionedError detects legacy daily leaves", () => {
  assert.equal(
    isNotPartitionedError({
      message:
        'cannot create partition of relation "request_log_2026_08_23" because it is not partitioned',
    }),
    true,
  );
  assert.equal(isNotPartitionedError({ message: "already exists" }), false);
});

test("ensureDayPartitions runs CREATE for both parents once per org", async () => {
  clearEnsuredPartitionCache();
  const executed: string[] = [];
  const db = {
    execute: async (query: { queryChunks?: unknown } | string) => {
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

  await ensureDayPartitions(db, "2026-08-23", "org-1");
  assert.equal(executed.length, 4);
  assert.match(executed[0] ?? "", /request_log_2026_08_23 PARTITION OF request_log/);
  assert.match(executed[0] ?? "", /PARTITION BY LIST \(organization_id\)/);
  assert.match(
    executed[1] ?? "",
    /request_log_2026_08_23_org_1 PARTITION OF request_log_2026_08_23/,
  );
  assert.match(executed[2] ?? "", /event_log_2026_08_23 PARTITION OF event_log/);
  assert.match(
    executed[3] ?? "",
    /event_log_2026_08_23_org_1 PARTITION OF event_log_2026_08_23/,
  );

  await ensureDayPartitions(db, "2026-08-23", "org-1");
  assert.equal(executed.length, 4);

  await ensureDayPartitions(db, "2026-08-23", "org-2");
  assert.equal(executed.length, 8);
  assert.match(executed[5] ?? "", /request_log_2026_08_23_org_2/);
});
