import { sql } from "drizzle-orm";

import type { Db } from "../lib/db";

/** Parent tables that are PARTITION BY RANGE (log_date). */
export const PARTITIONED_TABLES = ["request_log", "event_log"] as const;

export type PartitionedTable = (typeof PARTITIONED_TABLES)[number];

/** In-process cache: dates we already ensured partitions for this process. */
const ensuredLogDates = new Set<string>();

/**
 * Accept only ISO calendar dates (YYYY-MM-DD) so partition DDL stays safe.
 */
export function isValidLogDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Normalize logDate from a row (string or Date) to `YYYY-MM-DD`.
 */
export function normalizeLogDate(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, 10);
    return isValidLogDate(trimmed) ? trimmed : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

/** Next calendar day in UTC (exclusive upper bound for a 1-day range partition). */
export function nextLogDate(logDate: string): string {
  const d = new Date(`${logDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Partition child name: `request_log_2026_08_01`.
 */
export function partitionTableName(
  parent: PartitionedTable,
  logDate: string,
): string {
  return `${parent}_${logDate.replaceAll("-", "_")}`;
}

/**
 * True when Postgres rejected the row because no partition covers log_date.
 *
 * Error shape (Neon / node-pg):
 *   code: "23514"
 *   message: no partition of relation "request_log" found for row
 */
export function isMissingPartitionError(error: unknown): boolean {
  if (error == null) {
    return false;
  }

  if (typeof error === "object") {
    const e = error as {
      code?: unknown;
      message?: unknown;
      detail?: unknown;
      cause?: unknown;
    };
    const message = String(e.message ?? "");
    const detail = String(e.detail ?? "");
    const combined = `${message}\n${detail}`;

    if (/no partition of relation/i.test(combined)) {
      return true;
    }

    // Nested cause (some drivers wrap the original).
    if (e.cause !== undefined && isMissingPartitionError(e.cause)) {
      return true;
    }
  }

  if (typeof error === "string" && /no partition of relation/i.test(error)) {
    return true;
  }

  return false;
}

/**
 * True when CREATE TABLE failed because the partition already exists (race).
 */
export function isAlreadyExistsError(error: unknown): boolean {
  if (error == null || typeof error !== "object") {
    return false;
  }
  const e = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (e.code === "42P07") {
    return true;
  }
  if (/already exists/i.test(String(e.message ?? ""))) {
    return true;
  }
  if (e.cause !== undefined) {
    return isAlreadyExistsError(e.cause);
  }
  return false;
}

/**
 * Build CREATE TABLE … PARTITION OF … FOR VALUES FROM (day) TO (next day).
 *
 * Example:
 *   CREATE TABLE request_log_2026_08_01 PARTITION OF request_log
 *     FOR VALUES FROM ('2026-08-01') TO ('2026-08-02');
 */
export function buildCreatePartitionSql(
  parent: PartitionedTable,
  logDate: string,
): string {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }
  const name = partitionTableName(parent, logDate);
  const until = nextLogDate(logDate);
  // Identifiers and dates are validated / derived — safe to interpolate.
  return (
    `CREATE TABLE IF NOT EXISTS ${name} PARTITION OF ${parent} ` +
    `FOR VALUES FROM ('${logDate}') TO ('${until}')`
  );
}

/**
 * Ensure daily partitions exist for request_log and event_log for `logDate`.
 * Safe under concurrent workers (IF NOT EXISTS + ignore already-exists).
 */
export async function ensureDayPartitions(
  db: Db,
  logDate: string,
): Promise<void> {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }

  if (ensuredLogDates.has(logDate)) {
    return;
  }

  for (const parent of PARTITIONED_TABLES) {
    const ddl = buildCreatePartitionSql(parent, logDate);
    try {
      await db.execute(sql.raw(ddl));
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        continue;
      }
      throw error;
    }
  }

  ensuredLogDates.add(logDate);
}

/** Test helper: clear the in-process partition cache. */
export function clearEnsuredPartitionCache(): void {
  ensuredLogDates.clear();
}
