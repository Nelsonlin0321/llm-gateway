import type { WorkerBindings } from "../env";
import { resolveRedisRest } from "./redis-client";
import { REQUEST_LOG_CONSUMER_GROUP, REQUEST_LOG_STREAM } from "./redis-keys";

export const DEFAULT_CONSUMER_NAME = "gateway-ingest-worker";

export type IngestConfig = {
  redisUrl: string | null;
  streamKey: string;
  groupName: string;
  consumerName: string;
  /** Shared COUNT budget: XAUTOCLAIM first, then XREADGROUP >. */
  count: number;
  /**
   * Block timeout in milliseconds for new-message XREADGROUP.
   * 0 = do not block (required on Upstash REST / Cloudflare Workers).
   */
  blockMs: number;
  /**
   * XAUTOCLAIM min-idle-time in milliseconds (Redis 6.2+).
   * Pending entries idle at least this long are reclaimed first.
   * Set to 0 to skip reclaim (new messages only).
   */
  claimMinIdleMs: number;
  /**
   * Exit the drain after this many milliseconds with no events to
   * ingest. Any ingested event resets the timer. 0 = never idle-exit
   * (consume until the invocation is stopped). A non-blocking empty
   * read also ends the drain when this is > 0.
   */
  idleExitMs: number;
  /**
   * Stop the drain after this many milliseconds even if events remain.
   * Leftover entries stay pending and are picked up on the next cron.
   * 0 = no wall-clock cap.
   */
  maxDurationMs: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/**
 * Load ingest worker config from Worker bindings / process env.
 * Throws when Redis credentials are missing.
 */
export function loadConfig(env: WorkerBindings = process.env): IngestConfig {
  const redisUrl = (env.REDIS_URL ?? "").trim() || null;
  const rest = resolveRedisRest(env);
  if (!redisUrl && !rest) {
    throw new Error(
      "REDIS_URL is required. Set it in .env (see .env.example).",
    );
  }

  const consumerName =
    (env.REQUEST_LOG_CONSUMER_NAME ?? DEFAULT_CONSUMER_NAME).trim() ||
    DEFAULT_CONSUMER_NAME;

  return {
    redisUrl,
    streamKey:
      (env.REQUEST_LOG_STREAM ?? REQUEST_LOG_STREAM).trim() ||
      REQUEST_LOG_STREAM,
    groupName:
      (env.REQUEST_LOG_CONSUMER_GROUP ?? REQUEST_LOG_CONSUMER_GROUP).trim() ||
      REQUEST_LOG_CONSUMER_GROUP,
    consumerName,
    count: parsePositiveInt(env.REQUEST_LOG_READ_COUNT, 20),
    // Upstash REST does not support XREADGROUP BLOCK; default to non-blocking.
    blockMs: parsePositiveInt(env.REQUEST_LOG_BLOCK_MS, 0),
    claimMinIdleMs: parsePositiveInt(env.REQUEST_LOG_CLAIM_MIN_IDLE_MS, 60_000),
    idleExitMs: parsePositiveInt(env.REQUEST_LOG_IDLE_EXIT_MS, 30_000),
    // Stay under the Workers CPU budget so the next cron can continue.
    maxDurationMs: parsePositiveInt(env.REQUEST_LOG_MAX_DURATION_MS, 25_000),
  };
}
