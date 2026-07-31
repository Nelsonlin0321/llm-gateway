import {
  REQUEST_LOG_CONSUMER_GROUP,
  REQUEST_LOG_STREAM,
} from "./redis-keys.js";

export type IngestConfig = {
  redisUrl: string;
  streamKey: string;
  groupName: string;
  consumerName: string;
  /** Max entries per XREADGROUP call (COUNT). */
  count: number;
  /** Block timeout in milliseconds (BLOCK). 0 = do not block. */
  blockMs: number;
  /**
   * Claim pending entries idle at least this many ms (CLAIM).
   * Requires Redis 8.4+ XREADGROUP CLAIM support.
   */
  claimMinIdleMs: number;
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
    count: parsePositiveInt(env.REQUEST_LOG_READ_COUNT, 100),
    blockMs: parsePositiveInt(env.REQUEST_LOG_BLOCK_MS, 2000), //Wait up to 2 seconds if nothing is available
    claimMinIdleMs: parsePositiveInt(env.REQUEST_LOG_CLAIM_MIN_IDLE_MS, 60_000), //Claim any pending messages that have been idle ≥ 60 000 ms (60 seconds)
  };
}
