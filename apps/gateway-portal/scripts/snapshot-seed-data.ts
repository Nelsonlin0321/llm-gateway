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
 *   user → session, account, verification, llmProviders, childKeys
 *   llmProviders → models
 */

import "dotenv/config";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  db,
  user,
  session,
  account,
  verification,
  llmProviders,
  models,
  childKeys,
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
  { key: "session", table: session },
  { key: "account", table: account },
  { key: "verification", table: verification },
  { key: "llmProvider", table: llmProviders },
  { key: "models", table: models },
  { key: "childKeys", table: childKeys },
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
  "issuedAt", // integer epoch — leave as number; listed only for docs
]);

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
