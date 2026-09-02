/**
 * Cloudflare Worker bindings for gateway-ingest.
 *
 * Non-secret values are set in `wrangler.jsonc` `vars`.
 * Secret values are:
 * - local: loaded from `.env` by `wrangler dev`
 * - production: `wrangler secret put <NAME>` (never stored in git)
 */
export type WorkerBindings = {
  DATABASE_URL?: string;
  REDIS_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  REQUEST_LOG_STREAM?: string;
  REQUEST_LOG_CONSUMER_GROUP?: string;
  REQUEST_LOG_CONSUMER_NAME?: string;
  REQUEST_LOG_READ_COUNT?: string;
  REQUEST_LOG_BLOCK_MS?: string;
  REQUEST_LOG_CLAIM_MIN_IDLE_MS?: string;
  REQUEST_LOG_IDLE_EXIT_MS?: string;
  REQUEST_LOG_MAX_DURATION_MS?: string;
  REQUEST_LOG_DEBUG?: string;
  NODE_ENV?: string;
};

function stringBindings(bindings: unknown): WorkerBindings {
  if (!bindings || typeof bindings !== "object") {
    return {};
  }

  const out: WorkerBindings = {};
  for (const [key, value] of Object.entries(
    bindings as Record<string, unknown>,
  )) {
    if (typeof value === "string") {
      (out as Record<string, string>)[key] = value;
    }
  }
  return out;
}

/**
 * Merge Worker bindings over `process.env`.
 *
 * `wrangler dev` / deployed Workers pass secrets and vars as `env`.
 * Bun unit tests typically have empty bindings and rely on `process.env`.
 */
export function mergeWorkerEnv(bindings: unknown): WorkerBindings {
  return { ...process.env, ...stringBindings(bindings) };
}

/** Copy string bindings onto `process.env` for helpers that still read it. */
export function applyWorkerBindings(env: WorkerBindings): void {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}
