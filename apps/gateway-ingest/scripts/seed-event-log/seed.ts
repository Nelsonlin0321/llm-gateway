/// <reference types="bun" />

/**
 * Generate mock `event_log` rows and insert them into Postgres.
 *
 * - Date range default: 2026-06-01 .. 2026-08-01 (inclusive)
 * - Each log_date gets a random row count in [10, 1000] by default
 * - Ensures daily partitions before insert
 * - Optional: write generated rows to JSON
 *
 * Usage:
 *   bun run scripts/seed-event-log/seed.ts
 *   bun run scripts/seed-event-log/seed.ts --per-day-min=10 --per-day-max=1000
 *   bun run scripts/seed-event-log/seed.ts --per-day=50
 *   bun run scripts/seed-event-log/seed.ts --write-json=scripts/data/event-log-mockon
 *   bun run scripts/seed-event-log/seed.ts --dry-run --write-json=scripts/data/event-log-mockon
 *
 * Requires DATABASE_URL (see .env.example).
 */

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { NewEventLog } from "../../src/db/schema";
import { eventLog } from "../../src/db/schema";
import { db } from "../../src/lib/db";
import { ensureDayPartitions } from "../../src/load/partitions";
import {
  createRng,
  DEFAULT_PER_DAY_MAX,
  DEFAULT_PER_DAY_MIN,
  eachLogDate,
  generateMockEventLogRows,
  generateMockEventLogRowsForDate,
  type MockEventLogRow,
} from "./generate";

type CliOptions = {
  from: string;
  to: string;
  /** Fixed count; when set, ignores min/max. */
  perDay: number | null;
  perDayMin: number;
  perDayMax: number;
  seed: number;
  batchSize: number;
  writeJson: string | null;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    from: "2026-06-01",
    to: "2026-08-01",
    perDay: null,
    perDayMin: DEFAULT_PER_DAY_MIN,
    perDayMax: DEFAULT_PER_DAY_MAX,
    seed: 42,
    batchSize: 200,
    writeJson: null,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg.startsWith("--from=")) {
      opts.from = arg.slice("--from=".length);
      continue;
    }
    if (arg.startsWith("--to=")) {
      opts.to = arg.slice("--to=".length);
      continue;
    }
    if (arg.startsWith("--per-day=")) {
      opts.perDay = Number(arg.slice("--per-day=".length));
      continue;
    }
    if (arg.startsWith("--per-day-min=")) {
      opts.perDayMin = Number(arg.slice("--per-day-min=".length));
      continue;
    }
    if (arg.startsWith("--per-day-max=")) {
      opts.perDayMax = Number(arg.slice("--per-day-max=".length));
      continue;
    }
    if (arg.startsWith("--seed=")) {
      opts.seed = Number(arg.slice("--seed=".length));
      continue;
    }
    if (arg.startsWith("--batch-size=")) {
      opts.batchSize = Number(arg.slice("--batch-size=".length));
      continue;
    }
    if (arg.startsWith("--write-json=")) {
      opts.writeJson = arg.slice("--write-json=".length);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (
    opts.perDay !== null &&
    (!Number.isFinite(opts.perDay) || opts.perDay < 1)
  ) {
    throw new Error(`--per-day must be a positive integer, got ${opts.perDay}`);
  }
  if (!Number.isFinite(opts.perDayMin) || opts.perDayMin < 1) {
    throw new Error(
      `--per-day-min must be a positive integer, got ${opts.perDayMin}`,
    );
  }
  if (!Number.isFinite(opts.perDayMax) || opts.perDayMax < 1) {
    throw new Error(
      `--per-day-max must be a positive integer, got ${opts.perDayMax}`,
    );
  }
  if (opts.perDayMin > opts.perDayMax) {
    throw new Error(
      `--per-day-min (${opts.perDayMin}) must be <= --per-day-max (${opts.perDayMax})`,
    );
  }
  if (!Number.isFinite(opts.batchSize) || opts.batchSize < 1) {
    throw new Error(
      `--batch-size must be a positive integer, got ${opts.batchSize}`,
    );
  }

  return opts;
}

function printHelp(): void {
  console.log(`seed-event-log — insert mock rows into event_log

Options:
  --from=YYYY-MM-DD       start log_date (default 2026-06-01)
  --to=YYYY-MM-DD         end log_date inclusive (default 2026-08-01)
  --per-day-min=N         min random rows/day (default ${DEFAULT_PER_DAY_MIN})
  --per-day-max=N         max random rows/day (default ${DEFAULT_PER_DAY_MAX})
  --per-day=N             fixed rows/day (overrides min/max)
  --seed=N                PRNG seed (default 42)
  --batch-size=N          insert batch size (default 200)
  --write-json=PATH       also write generated rows as JSON
  --dry-run               generate (+ optional JSON) without DB writes
  -h, --help              show this help
`);
}

function toInsertRow(row: MockEventLogRow): NewEventLog {
  return {
    eventId: row.eventId,
    requestId: row.requestId,
    organizationId: row.organizationId,
    schemaVersion: row.schemaVersion,
    eventType: row.eventType,
    startedAt: new Date(row.startedAt),
    completedAt: new Date(row.completedAt),
    gatewayPath: row.gatewayPath,
    httpMethod: row.httpMethod,
    apiFamily: row.apiFamily,
    providerId: row.providerId,
    provider: row.provider,
    requestedModel: row.requestedModel,
    requestedModelAlias: row.requestedModelAlias,
    upstreamModel: row.upstreamModel,
    upstreamUrl: row.upstreamUrl,
    isStream: row.isStream,
    responseMode: row.responseMode,
    childKeyId: row.childKeyId,
    childKeyName: row.childKeyName,
    childKeyCreatorId: row.childKeyCreatorId,
    childKeyIssuedAt: row.childKeyIssuedAt,
    childKeyTagsJson: row.childKeyTagsJson,
    userEmail: row.userEmail,
    metadataJson: row.metadataJson,
    statusCode: row.statusCode,
    responseContentType: row.responseContentType,
    durationMs: row.durationMs,
    firstTokenMs: row.firstTokenMs,
    responseId: row.responseId,
    inputToken: row.inputToken,
    outputToken: row.outputToken,
    cachedInputToken: row.cachedInputToken,
    totalToken: row.totalToken,
    cost: row.cost,
    loggedAt: new Date(row.loggedAt),
    logDate: row.logDate,
    inputPrice: row.inputPrice,
    outputPrice: row.outputPrice,
    inputCachePrice: row.inputCachePrice,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

async function writeJsonFile(
  path: string,
  rows: MockEventLogRow[],
): Promise<void> {
  const abs = resolve(path);
  await mkdir(dirname(abs), { recursive: true });
  await Bun.write(abs, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`[seed-event-log] wrote ${rows.length} rows → ${abs}`);
}

async function insertRows(
  rows: MockEventLogRow[],
  batchSize: number,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize).map(toInsertRow);
    await db.insert(eventLog).values(chunk);
  }
}

function genOptions(opts: CliOptions) {
  return {
    perDay: opts.perDay ?? undefined,
    perDayMin: opts.perDayMin,
    perDayMax: opts.perDayMax,
    seed: opts.seed,
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const dates = eachLogDate(opts.from, opts.to);

  console.log("[seed-event-log] generating mock event_log rows", {
    from: opts.from,
    to: opts.to,
    days: dates.length,
    perDay:
      opts.perDay !== null
        ? opts.perDay
        : `${opts.perDayMin}–${opts.perDayMax} (random)`,
    seed: opts.seed,
    dryRun: opts.dryRun,
  });

  // Dry-run / JSON path: generate the full set once so --write-json is complete.
  if (opts.dryRun || opts.writeJson) {
    const { rows, countsByDate } = generateMockEventLogRows({
      from: opts.from,
      to: opts.to,
      ...genOptions(opts),
    });

    console.log(`[seed-event-log] generated ${rows.length} rows`, {
      minPerDay: Math.min(...Object.values(countsByDate)),
      maxPerDay: Math.max(...Object.values(countsByDate)),
    });

    if (opts.writeJson) {
      await writeJsonFile(opts.writeJson, rows);
    }

    if (opts.dryRun) {
      console.log(
        "[seed-event-log] dry-run: skipping partition ensure + insert",
      );
      return;
    }

    // Fall through: still insert the same generated rows when not dry-run
    // but write-json was requested (same RNG path as generate-all).
    if (!(process.env.DATABASE_URL ?? "").trim()) {
      throw new Error("DATABASE_URL is required (set in .env)");
    }

    for (const logDate of dates) {
      await ensureDayPartitions(db, logDate);
    }
    await insertRows(rows, opts.batchSize);
    console.log("[seed-event-log] done", {
      rows: rows.length,
      from: opts.from,
      to: opts.to,
    });
    return;
  }

  if (!(process.env.DATABASE_URL ?? "").trim()) {
    throw new Error("DATABASE_URL is required (set in .env)");
  }

  // Day-by-day: lower peak memory for large ranges (up to 1000 rows/day).
  const rng = createRng(opts.seed);
  let total = 0;

  for (const logDate of dates) {
    await ensureDayPartitions(db, logDate);
    const dayRows = generateMockEventLogRowsForDate(
      logDate,
      genOptions(opts),
      rng,
    );
    await insertRows(dayRows, opts.batchSize);
    total += dayRows.length;
    console.log(
      `[seed-event-log] ${logDate}: inserted ${dayRows.length} rows (total ${total})`,
    );
  }

  console.log("[seed-event-log] done", {
    rows: total,
    from: opts.from,
    to: opts.to,
  });
}

main().catch((error) => {
  console.error("[seed-event-log] failed", error);
  process.exit(1);
});
