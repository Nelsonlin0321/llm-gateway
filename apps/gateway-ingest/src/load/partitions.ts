import { sql } from "drizzle-orm";

import type { Db } from "../lib/db";

/**
 * Parent tables: PARTITION BY RANGE (log_date).
 * Each daily child is PARTITION BY LIST (organization_id), with one leaf
 * per org: `{parent}_{YYYY_MM_DD}_{normalized_organization_id}`.
 */
export const PARTITIONED_TABLES = ["request_log", "event_log"] as const;

export type PartitionedTable = (typeof PARTITIONED_TABLES)[number];

/**
 * `request_log_YYYY_MM_DD_` is the longest prefix (23 chars). PostgreSQL
 * identifiers truncate at 63 bytes, so keep the org suffix within 40.
 */
const MAX_NORMALIZED_ORG_ID_LENGTH = 40;

/** In-process cache: `logDate\0organizationId` already ensured in this process. */
const ensuredPartitions = new Set<string>();

function partitionCacheKey(logDate: string, organizationId: string): string {
  return `${logDate}\0${organizationId}`;
}

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

export function isValidOrganizationId(value: string): boolean {
  return value.trim().length > 0 && !value.includes("\0");
}

/**
 * Identifier-safe org suffix for partition table names.
 * LIST bound values still use the original `organization_id`.
 */
export function normalizeOrganizationId(value: string): string {
  if (!isValidOrganizationId(value)) {
    throw new Error(`invalid organization_id for partition: ${value}`);
  }
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (!normalized) {
    throw new Error(`invalid organization_id for partition: ${value}`);
  }
  if (normalized.length > MAX_NORMALIZED_ORG_ID_LENGTH) {
    throw new Error(
      `organization_id too long for partition name (${normalized.length} > ${MAX_NORMALIZED_ORG_ID_LENGTH}): ${value}`,
    );
  }
  return normalized;
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

/** Next calendar day in UTC (exclusive upper bound for a 1-day range partition). */
export function nextLogDate(logDate: string): string {
  const d = new Date(`${logDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Daily range child (itself LIST-partitioned): `request_log_2026_08_23`.
 */
export function dayPartitionTableName(
  parent: PartitionedTable,
  logDate: string,
): string {
  return `${parent}_${logDate.replaceAll("-", "_")}`;
}

/**
 * Org leaf: `request_log_2026_08_23_{normalized_organization_id}`.
 */
export function partitionTableName(
  parent: PartitionedTable,
  logDate: string,
  organizationId: string,
): string {
  return `${dayPartitionTableName(parent, logDate)}_${normalizeOrganizationId(organizationId)}`;
}

/**
 * True when Postgres rejected the row because no partition covers log_date
 * (or no LIST child covers organization_id).
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
 * True when attaching a LIST child to a daily table that is still a leaf
 * (legacy date-only partitions created before org subpartitioning).
 */
export function isNotPartitionedError(error: unknown): boolean {
  if (error == null || typeof error !== "object") {
    return false;
  }
  const e = error as { message?: unknown; cause?: unknown };
  if (/is not partitioned/i.test(String(e.message ?? ""))) {
    return true;
  }
  if (e.cause !== undefined) {
    return isNotPartitionedError(e.cause);
  }
  return false;
}

/**
 * Daily RANGE child, further partitioned by organization.
 *
 * Example:
 *   CREATE TABLE IF NOT EXISTS request_log_2026_08_23 PARTITION OF request_log
 *     FOR VALUES FROM ('2026-08-23') TO ('2026-08-24')
 *     PARTITION BY LIST (organization_id);
 */
export function buildCreateDayPartitionSql(
  parent: PartitionedTable,
  logDate: string,
): string {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }
  const name = dayPartitionTableName(parent, logDate);
  const until = nextLogDate(logDate);
  return (
    `CREATE TABLE IF NOT EXISTS ${name} PARTITION OF ${parent} ` +
    `FOR VALUES FROM ('${logDate}') TO ('${until}') ` +
    `PARTITION BY LIST (organization_id)`
  );
}

/**
 * Org LIST leaf of the daily parent.
 *
 * Example:
 *   CREATE TABLE IF NOT EXISTS request_log_2026_08_23_org_1
 *     PARTITION OF request_log_2026_08_23
 *     FOR VALUES IN ('org-1');
 */
export function buildCreateOrgPartitionSql(
  parent: PartitionedTable,
  logDate: string,
  organizationId: string,
): string {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }
  if (!isValidOrganizationId(organizationId)) {
    throw new Error(`invalid organization_id for partition: ${organizationId}`);
  }
  const dayName = dayPartitionTableName(parent, logDate);
  const name = partitionTableName(parent, logDate, organizationId);
  const bound = escapeSqlLiteral(organizationId.trim());
  return (
    `CREATE TABLE IF NOT EXISTS ${name} PARTITION OF ${dayName} ` +
    `FOR VALUES IN ('${bound}')`
  );
}

async function executeDdl(db: Db, ddl: string): Promise<void> {
  try {
    await db.execute(sql.raw(ddl));
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return;
    }
    throw error;
  }
}

/**
 * Ensure daily LIST parents + org leaves exist for request_log and event_log.
 * Safe under concurrent workers (IF NOT EXISTS + ignore already-exists).
 *
 * Legacy daily leaf partitions (not subpartitioned) still accept inserts;
 * creating an org child against those is skipped.
 */
export async function ensureDayPartitions(
  db: Db,
  logDate: string,
  organizationId: string,
): Promise<void> {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }
  if (!isValidOrganizationId(organizationId)) {
    throw new Error(`invalid organization_id for partition: ${organizationId}`);
  }

  const key = partitionCacheKey(logDate, organizationId.trim());
  if (ensuredPartitions.has(key)) {
    return;
  }

  for (const parent of PARTITIONED_TABLES) {
    await executeDdl(db, buildCreateDayPartitionSql(parent, logDate));
    try {
      await executeDdl(
        db,
        buildCreateOrgPartitionSql(parent, logDate, organizationId),
      );
    } catch (error) {
      if (isNotPartitionedError(error)) {
        continue;
      }
      throw error;
    }
  }

  ensuredPartitions.add(key);
}

/** Test helper: clear the in-process partition cache. */
export function clearEnsuredPartitionCache(): void {
  ensuredPartitions.clear();
}
