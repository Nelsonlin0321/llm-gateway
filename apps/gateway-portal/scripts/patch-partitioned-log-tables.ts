/**
 * Drizzle cannot emit PARTITION BY. After `drizzle-kit generate`, rewrite
 * `request_log` / `event_log` CREATE TABLE endings to:
 *
 *   ) PARTITION BY RANGE ("log_date");
 *
 * Keep `--> statement-breakpoint` so drizzle-kit migrate still sends one
 * statement per prepared query.
 *
 * Usage (from apps/gateway-portal):
 *   npx tsx scripts/patch-partitioned-log-tables.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "drizzle",
  "migrations",
);

const TABLES = ["request_log", "event_log"] as const;
const PARTITION_CLAUSE = ` PARTITION BY RANGE ("log_date")`;

function hasNestedCreateTable(block: string): boolean {
  return block.indexOf("CREATE TABLE", "CREATE TABLE".length) !== -1;
}

function matchCreateTable(
  sql: string,
  table: string,
  fileName: string,
): { start: number; end: number; partitioned: boolean } | null {
  const start = sql.indexOf(`CREATE TABLE "${table}"`);
  if (start === -1) {
    return null;
  }
  const from = sql.slice(start);
  const partitioned = from.match(
    /^CREATE TABLE "[^"]+" \([\s\S]*?\n\) PARTITION BY RANGE \("log_date"\);/,
  );
  if (partitioned && !hasNestedCreateTable(partitioned[0])) {
    return { start, end: start + partitioned[0].length, partitioned: true };
  }
  const plain = from.match(/^CREATE TABLE "[^"]+" \([\s\S]*?\n\);/);
  if (!plain || hasNestedCreateTable(plain[0])) {
    throw new Error(
      `${fileName}: CREATE TABLE "${table}" close not found (or spanned another table)`,
    );
  }
  return { start, end: start + plain[0].length, partitioned: false };
}

function patchFile(sql: string, fileName: string): string {
  let out = sql;
  for (const table of TABLES) {
    const match = matchCreateTable(out, table, fileName);
    if (!match || match.partitioned) {
      continue;
    }
    out = `${out.slice(0, match.end - 1)}${PARTITION_CLAUSE};${out.slice(match.end)}`;
  }
  return out;
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`migrations dir not found: ${MIGRATIONS_DIR}`);
  }
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    throw new Error(`no SQL migrations in ${MIGRATIONS_DIR}`);
  }

  let changed = 0;
  for (const fileName of files) {
    const filePath = path.join(MIGRATIONS_DIR, fileName);
    const before = fs.readFileSync(filePath, "utf8");
    const after = patchFile(before, fileName);
    if (after !== before) {
      fs.writeFileSync(filePath, after);
      changed += 1;
      console.log(`patched ${fileName}`);
    }
  }
  if (changed === 0) {
    console.log("no CREATE TABLE patches needed");
  }
}

main();
