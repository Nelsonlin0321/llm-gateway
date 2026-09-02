/**
 * Cloudflare Worker bindings for gateway-api.
 *
 * Non-secret values are set in `wrangler.jsonc` `vars`.
 * Secret values are:
 * - local: loaded from `.env` by `wrangler dev`
 * - production: `wrangler secret put <NAME>` (never stored in git)
 */
export type WorkerBindings = {
  DATABASE_URL?: string;
  JWT_SIGNING_SECRET?: string;
  API_ENCRYPT_KEY?: string;
  REDIS_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  PORT?: string;
  REQUEST_BODY_LIMIT_BYTES?: string;
  UPSTREAM_TIMEOUT_MS?: string;
  CHILD_KEY_RATE_LIMIT_RPM?: string;
  GATEWAY_CORS_ORIGINS?: string;
  REQUEST_LOG_STREAM_MAXLEN?: string;
  NODE_ENV?: string;
};

function stringBindings(bindings: unknown): WorkerBindings {
  if (!bindings || typeof bindings !== "object") {
    return {};
  }

  const out: WorkerBindings = {};
  for (const [key, value] of Object.entries(bindings as Record<string, unknown>)) {
    if (typeof value === "string") {
      (out as Record<string, string>)[key] = value;
    }
  }
  return out;
}

/**
 * Merge Worker bindings over `process.env`.
 *
 * `wrangler dev` / deployed Workers pass secrets and vars as `c.env`.
 * Bun unit tests and `app.request()` typically have an empty `c.env` and
 * rely on `process.env` (including Bun auto-loaded `.env`).
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
