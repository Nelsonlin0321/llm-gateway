/**
 * Snapshot selected portal tables from the current DATABASE_URL into a JSON
 * seed file, and optionally load that seed into another (empty) database.
 *
 * Usage (from apps/gateway-portal):
 *   npx tsx scripts/snapshot-seed-data.ts export [path]
 *   npx tsx scripts/snapshot-seed-data.ts seed [path]
 *   npx tsx scripts/snapshot-seed-data.ts seed --clear [path]
 *
 * Env:
 *   DATABASE_URL  — Postgres connection string (required)
 *
 * Default seed path: scripts/seed/snapshot.json
 *
 * Tables (export + seed order respects FKs):
 *   user → session, account, member, invitation, auditLog, llmProviders, childKeys, eventLog
 *   organization → member, invitation, auditLog, llmProviders, models, childKeys, requestLog, eventLog
 *   llmProviders → models, eventLog
 *   childKeys → eventLog
 *   verification, deadRequestLog, deadEventLog (no FKs)
 */

import "dotenv/config";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

import {
  db,
  type Db,
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  auditLog,
  llmProviders,
  models,
  childKeys,
  requestLog,
  eventLog,
} from "../lib/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SEED_PATH = path.join(__dirname, "seed", "snapshot.json");

/** Snapshot version for forward compatibility. */
const SNAPSHOT_VERSION = 1 as const;

/**
 * Tables included in the seed, in FK-safe insert order.
 * Delete/clear uses the reverse of this list.
 */
const TABLE_SPECS = [
  { key: "user", table: user },
  { key: "organization", table: organization },
  { key: "verification", table: verification },
  { key: "session", table: session },
  { key: "account", table: account },
  { key: "member", table: member },
  { key: "invitation", table: invitation },
  { key: "auditLog", table: auditLog },
  { key: "llmProvider", table: llmProviders },
  { key: "models", table: models },
  { key: "childKeys", table: childKeys },
  { key: "requestLog", table: requestLog },
  { key: "eventLog", table: eventLog },
] as const;

type TableKey = (typeof TABLE_SPECS)[number]["key"];

type SnapshotFile = {
  version: typeof SNAPSHOT_VERSION;
  exportedAt: string;
  source: string;
  counts: Partial<Record<TableKey, number>>;
  tables: Partial<Record<TableKey, unknown[]>>;
};

/** Date-like columns that must be rehydrated on seed. */
const DATE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "expiresAt",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "loggedAt",
  "startedAt",
  "completedAt",
  "issuedAt", // integer epoch — leave as number; listed only for docs
]);

const PARTITIONED_LOG_TABLES = {
  requestLog: "request_log",
  eventLog: "event_log",
} as const;

type PartitionedLogTableKey = keyof typeof PARTITIONED_LOG_TABLES;
type PartitionedParentTable =
  (typeof PARTITIONED_LOG_TABLES)[PartitionedLogTableKey];

/**
 * `request_log_YYYY_MM_DD_` is the longest prefix (23 chars). PostgreSQL
 * identifiers truncate at 63 bytes, so keep the org suffix within 40.
 */
const MAX_NORMALIZED_ORG_ID_LENGTH = 40;

/** In-process cache: `table\0logDate\0organizationId` already ensured. */
const ensuredPartitions = new Set<string>();

function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)
  );
}

/** JSON.stringify replacer: Date → ISO string. */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Walk row objects and convert ISO timestamp strings back to Date for columns
 * that are timestamps (skips numeric issuedAt).
 */
function rehydrateRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "issuedAt") {
      out[key] = value;
      continue;
    }
    if (
      (DATE_FIELDS.has(key) || key.endsWith("At") || key.endsWith("Date")) &&
      isIsoDateString(value)
    ) {
      out[key] = new Date(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function resolveSeedPath(arg?: string): string {
  if (!arg) return DEFAULT_SEED_PATH;
  return path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
}

function partitionCacheKey(
  parent: PartitionedParentTable,
  logDate: string,
  organizationId: string,
): string {
  return `${parent}\0${logDate}\0${organizationId}`;
}

function isValidLogDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function normalizePartitionLogDate(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, 10);
    return isValidLogDate(trimmed) ? trimmed : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

function isValidOrganizationId(value: string): boolean {
  return value.trim().length > 0 && !value.includes("\0");
}

function normalizeOrganizationId(value: string): string {
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

function nextLogDate(logDate: string): string {
  const d = new Date(`${logDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function dayPartitionTableName(
  parent: PartitionedParentTable,
  logDate: string,
): string {
  return `${parent}_${logDate.replaceAll("-", "_")}`;
}

function partitionTableName(
  parent: PartitionedParentTable,
  logDate: string,
  organizationId: string,
): string {
  return `${dayPartitionTableName(parent, logDate)}_${normalizeOrganizationId(organizationId)}`;
}

function isAlreadyExistsError(error: unknown): boolean {
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

function buildCreateDayPartitionSql(
  parent: PartitionedParentTable,
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

function buildCreateOrgPartitionSql(
  parent: PartitionedParentTable,
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

async function ensureDayPartition(
  db: Db,
  parent: PartitionedParentTable,
  logDate: string,
  organizationId: string,
): Promise<void> {
  if (!isValidLogDate(logDate)) {
    throw new Error(`invalid log_date for partition: ${logDate}`);
  }
  if (!isValidOrganizationId(organizationId)) {
    throw new Error(`invalid organization_id for partition: ${organizationId}`);
  }

  const key = partitionCacheKey(parent, logDate, organizationId.trim());
  if (ensuredPartitions.has(key)) {
    return;
  }

  await executeDdl(db, buildCreateDayPartitionSql(parent, logDate));
  await executeDdl(
    db,
    buildCreateOrgPartitionSql(parent, logDate, organizationId),
  );
  ensuredPartitions.add(key);
}

async function ensureLogPartitionsForRows(
  key: PartitionedLogTableKey,
  rows: Record<string, unknown>[],
): Promise<void> {
  const parent = PARTITIONED_LOG_TABLES[key];

  for (const row of rows) {
    const logDate = normalizePartitionLogDate(row.logDate);
    if (!logDate) {
      throw new Error(
        `invalid ${key}.logDate for partition seed: ${String(row.logDate)}`,
      );
    }

    const organizationId = row.organizationId;
    if (
      typeof organizationId !== "string" ||
      !isValidOrganizationId(organizationId)
    ) {
      throw new Error(
        `invalid ${key}.organizationId for partition seed: ${String(organizationId)}`,
      );
    }

    await ensureDayPartition(db, parent, logDate, organizationId);
  }
}

async function exportSnapshot(outPath: string): Promise<void> {
  const tables: SnapshotFile["tables"] = {};
  const counts: SnapshotFile["counts"] = {};

  for (const { key, table } of TABLE_SPECS) {
    const rows = await db.select().from(table);
    tables[key] = rows;
    counts[key] = rows.length;
    console.log(`  ${key}: ${rows.length} row(s)`);
  }

  const snapshot: SnapshotFile = {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    source: "DATABASE_URL",
    counts,
    tables,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    JSON.stringify(snapshot, jsonReplacer, 2) + "\n",
    "utf8",
  );

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  console.log(`\nWrote ${total} row(s) → ${outPath}`);
  console.log(
    "Note: snapshot may include secrets (passwords, encrypted API keys, sessions).",
  );
}

async function clearTables(): Promise<void> {
  // Reverse FK order
  for (let i = TABLE_SPECS.length - 1; i >= 0; i--) {
    const { key, table } = TABLE_SPECS[i]!;
    await db.delete(table);
    console.log(`  cleared ${key}`);
  }
}

async function seedFromSnapshot(
  inPath: string,
  options: { clear: boolean },
): Promise<void> {
  const raw = await readFile(inPath, "utf8");
  const snapshot = JSON.parse(raw) as SnapshotFile;

  if (snapshot.version !== SNAPSHOT_VERSION) {
    throw new Error(
      `Unsupported snapshot version ${String(snapshot.version)}; expected ${SNAPSHOT_VERSION}`,
    );
  }

  console.log(
    `Loading snapshot exportedAt=${snapshot.exportedAt} from ${inPath}`,
  );

  if (options.clear) {
    console.log("Clearing target tables (reverse FK order)…");
    await clearTables();
  }

  for (const { key, table } of TABLE_SPECS) {
    const rows = snapshot.tables[key] ?? [];
    if (rows.length === 0) {
      console.log(`  ${key}: 0 row(s) (skip)`);
      continue;
    }

    const prepared = rows.map((row) =>
      rehydrateRow(row as Record<string, unknown>),
    );

    if (key === "requestLog" || key === "eventLog") {
      await ensureLogPartitionsForRows(key, prepared);
    }

    // Batch insert to stay under parameter limits on large tables
    const BATCH = 100;
    for (let i = 0; i < prepared.length; i += BATCH) {
      const chunk = prepared.slice(i, i + BATCH);
      await db.insert(table).values(chunk as never[]);
    }
    console.log(`  ${key}: inserted ${prepared.length} row(s)`);
  }

  console.log("\nSeed complete.");
}

function printUsage(): void {
  console.log(`Usage:
  npx tsx scripts/snapshot-seed-data.ts export [path]
  npx tsx scripts/snapshot-seed-data.ts seed [--clear] [path]

Default path: ${DEFAULT_SEED_PATH}

export  — read tables from DATABASE_URL and write JSON seed
seed    — insert seed into DATABASE_URL (empty DB with same schema)
  --clear  delete existing rows in these tables before insert
`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "-h" || command === "--help") {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  if (command === "export") {
    const outPath = resolveSeedPath(args[1]);
    console.log("Exporting snapshot from DATABASE_URL…");
    await exportSnapshot(outPath);
    return;
  }

  if (command === "seed") {
    const clear = args.includes("--clear");
    // argv after "seed": optional --clear and optional path
    const positional = args.slice(1).filter((a) => a !== "--clear");
    const inPath = resolveSeedPath(positional[0]);
    console.log(
      `Seeding DATABASE_URL from snapshot${clear ? " (with --clear)" : ""}…`,
    );
    await seedFromSnapshot(inPath, { clear });
    return;
  }

  printUsage();
  throw new Error(`Unknown command: ${command}`);
}

main()
  .then(() => {
    // Neon pool may keep the process alive
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
