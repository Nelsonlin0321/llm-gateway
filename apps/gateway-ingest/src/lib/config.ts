import { REQUEST_LOG_CONSUMER_GROUP, REQUEST_LOG_STREAM } from "./redis-keys";

export type IngestConfig = {
  redisUrl: string;
  streamKey: string;
  groupName: string;
  consumerName: string;
  /** Shared COUNT budget: XAUTOCLAIM first, then XREADGROUP >. */
  count: number;
  /** Block timeout in milliseconds for new-message XREADGROUP. 0 = do not block. */
  blockMs: number;
  /**
   * XAUTOCLAIM min-idle-time in milliseconds (Redis 6.2+).
   * Pending entries idle at least this long are reclaimed first.
   * Set to 0 to skip reclaim (new messages only).
   */
  claimMinIdleMs: number;
  /**
   * Exit the process after this many milliseconds with no events to
   * ingest. Any ingested event resets the timer. 0 = never idle-exit
   * (consume until SIGINT/SIGTERM). Scheduling between runs is owned
   * by outside orchestration.
   */
  idleExitMs: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/**
 * Load ingest worker config from environment variables.
 * Throws when `REDIS_URL` is missing — the worker cannot run without Redis.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): IngestConfig {
  const redisUrl = (env.REDIS_URL ?? "").trim();
  if (!redisUrl) {
    throw new Error(
      "REDIS_URL is required. Set it in .env (see .env.example).",
    );
  }

  const hostname = (env.HOSTNAME ?? env.COMPUTERNAME ?? "local")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  const pid = typeof process.pid === "number" ? String(process.pid) : "0";
  const defaultConsumer = `consumer-${hostname}-${pid}`;

  return {
    redisUrl,
    streamKey:
      (env.REQUEST_LOG_STREAM ?? REQUEST_LOG_STREAM).trim() ||
      REQUEST_LOG_STREAM,
    groupName:
      (env.REQUEST_LOG_CONSUMER_GROUP ?? REQUEST_LOG_CONSUMER_GROUP).trim() ||
      REQUEST_LOG_CONSUMER_GROUP,
    consumerName:
      (env.REQUEST_LOG_CONSUMER_NAME ?? defaultConsumer).trim() ||
      defaultConsumer,
    count: parsePositiveInt(env.REQUEST_LOG_READ_COUNT, 20), // We sure we can process 20 messages within 60 seconds.
    blockMs: parsePositiveInt(env.REQUEST_LOG_BLOCK_MS, 5_000), // This should be shorter, wait like 5 seconds
    // XREADGROUP Wait up to 5_000 milliseconds (5 seconds) if there are no new messages available.
    claimMinIdleMs: parsePositiveInt(env.REQUEST_LOG_CLAIM_MIN_IDLE_MS, 60_000),
    // XAUTOCLAIM:Only claim messages that have been idle for at least 60 seconds.
    idleExitMs: parsePositiveInt(env.REQUEST_LOG_IDLE_EXIT_MS, 30_000),
    // Exit after 30s with no events; timer resets on each ingested event.
  };
}
