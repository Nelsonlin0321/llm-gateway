/// <reference types="node" />

import { and, eq } from "drizzle-orm";

import { db, llmProviders, models } from "../src/lib/db";

const ITERATIONS = 30;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function summarize(timesMs: number[]) {
  const sorted = [...timesMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, t) => acc + t, 0);
  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

async function runQuery() {
  const name = "deepinfra";
  const compatibilityType = "openai" as const;
  const modelAlias = "glm-5.2";

  const started = performance.now();
  const [llmAndModel] = await db
    .select({
      model: models,
      provider: llmProviders,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(
      and(
        eq(models.alias, `${name}/${modelAlias}`),
        eq(llmProviders.name, name),
        eq(llmProviders.compatibilityType, compatibilityType),
      ),
    )
    .limit(1);
  const elapsedMs = performance.now() - started;

  return { llmAndModel: llmAndModel ?? null, elapsedMs };
}

async function main(): Promise<void> {
  const timesMs: number[] = [];
  let lastResult: unknown = null;

  for (let i = 1; i <= ITERATIONS; i++) {
    const { llmAndModel, elapsedMs } = await runQuery();
    timesMs.push(elapsedMs);
    lastResult = llmAndModel;
    console.log(
      `  run ${String(i).padStart(2, " ")}: ${elapsedMs.toFixed(2)} ms`,
    );
  }

  const stats = summarize(timesMs);

  console.log("\nlast result:");
  console.log(lastResult);
  console.log("\nquery time stats (ms):");
  console.log(`  count: ${stats.count}`);
  console.log(`  min:   ${stats.min.toFixed(2)}`);
  console.log(`  max:   ${stats.max.toFixed(2)}`);
  console.log(`  mean:  ${stats.mean.toFixed(2)}`);
  console.log(`  p50:   ${stats.p50.toFixed(2)}`);
  console.log(`  p95:   ${stats.p95.toFixed(2)}`);
  console.log(`  p99:   ${stats.p99.toFixed(2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
