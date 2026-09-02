import { sql } from "drizzle-orm";

import { runIngestJob } from "./job";
import { loadConfig } from "./lib/config";
import { db } from "./lib/db";
import { getRedisClient, resolveRedisRest } from "./lib/redis-client";
import {
  applyWorkerBindings,
  mergeWorkerEnv,
  type WorkerBindings,
} from "./env";

type ScheduledController = {
  readonly scheduledTime: number;
  readonly cron: string;
  readonly type: string;
};

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

/**
 * Run one ingest drain using Worker bindings (cron `scheduled()`).
 */
export async function handleIngestInvocation(
  bindings: WorkerBindings,
): Promise<{ result: string }> {
  const env = mergeWorkerEnv(bindings);
  applyWorkerBindings(env);

  const config = loadConfig(env);
  const client = getRedisClient(env);
  if (!client) {
    throw new Error(
      "Redis REST credentials are required. Set REDIS_URL (Upstash) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  if (!(env.DATABASE_URL ?? "").trim()) {
    throw new Error("DATABASE_URL is required");
  }

  console.log("[gateway-ingest] starting", {
    stream: config.streamKey, // Redis Stream key (XADD target from gateway-api)
    group: config.groupName, // Consumer group; PEL + XACK are scoped to this
    consumer: config.consumerName, // This worker's id; stable across cron ticks
    count: config.count, // Max entries per loop: XAUTOCLAIM first, then XREADGROUP
    // How long XREADGROUP waits for never-delivered messages (`>`).
    // Applied only when XAUTOCLAIM returned nothing; if claimed work is
    // already in hand the new-message read is non-blocking. 0 = return
    // immediately (Upstash REST / Workers cannot BLOCK).
    blockMs: config.blockMs, // 0 seconds
    // XAUTOCLAIM min-idle-time: pending PEL entries (delivered, not yet
    // XACK'd) idle at least this long are reclaimed first — recovers work
    // left by a crashed or timed-out previous invocation. 0 = skip reclaim
    // and only read new messages.
    claimMinIdleMs: config.claimMinIdleMs, // 30 seconds
    idleExitMs: config.idleExitMs, // End drain after this idle; timer resets on each event // 5 seconds
    maxDurationMs: config.maxDurationMs, // Wall-clock cap for this invocation; leftover waits for next cron // 60 seconds
    mode: "xautoclaim + xreadgroup → transform → load → xack",
  });

  const result = await runIngestJob({
    config,
    client,
    db,
    isStopping: () => false,
  });

  console.log("[gateway-ingest] finished", { result });
  return { result };
}

async function handleFetch(
  request: Request,
  env: WorkerBindings,
  ctx: WorkerExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const bindings = mergeWorkerEnv(env);
  applyWorkerBindings(bindings);

  if (url.pathname === "/health") {
    return Response.json({ status: "ok" });
  }

  if (url.pathname === "/ready") {
    const redisConfigured = Boolean(resolveRedisRest(bindings));
    const checks: {
      postgres: "ok" | "error";
      redis: "ok" | "skipped" | "error";
    } = {
      postgres: "error",
      redis: redisConfigured ? "error" : "skipped",
    };

    try {
      await db.execute(sql`select 1`);
      checks.postgres = "ok";
    } catch (error) {
      console.error("[ready] postgres check failed", error);
    }

    if (redisConfigured) {
      const redis = getRedisClient(bindings);
      try {
        if (!redis) {
          throw new Error("redis client missing");
        }
        await redis.ping();
        checks.redis = "ok";
      } catch (error) {
        console.error("[ready] redis check failed", error);
      }
    }

    const ready =
      checks.postgres === "ok" &&
      (checks.redis === "ok" || checks.redis === "skipped");

    return Response.json(
      { status: ready ? "ok" : "error", checks },
      { status: ready ? 200 : 503 },
    );
  }

  if (url.pathname === "/") {
    return Response.json({
      name: "gateway-ingest",
      status: "ok",
      scheduled: true,
      docs: "Cron Trigger invokes scheduled(). wrangler dev --test-scheduled exposes /__scheduled.",
      health: "/health",
      ready: "/ready",
    });
  }

  void ctx;
  return new Response("Not found", { status: 404 });
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: WorkerBindings,
    ctx: WorkerExecutionContext,
  ): Promise<void> {
    console.log("[gateway-ingest] scheduled", {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
    });
    try {
      await handleIngestInvocation(env);
    } catch (error) {
      console.error("[gateway-ingest] scheduled invocation failed", error);
      throw error;
    }
    void ctx;
  },

  fetch: handleFetch,
};
