## Runtime

- This app deploys as a **Cloudflare Worker** with a `scheduled()` Cron Trigger. Local runtime is `wrangler dev --test-scheduled` (workerd).
- Unit tests still run on **Bun** (`bun test`). Use `bun` for install and test.
- Prefer Web-standard APIs (`fetch`, Worker bindings) over Node-only packages.
- Node-compatible APIs (`process.env`, `Buffer`) remain fine — Workers `nodejs_compat` implements them.
- Config comes from **Worker bindings**:
  - Local: `.env` next to `wrangler.jsonc` (loaded by `wrangler dev`).
  - Production: `vars` in `wrangler.jsonc` plus `wrangler secret put` (never commit secret values).
  - `scheduled()` / `fetch` hydrate helpers that still read `process.env` from those bindings.

## Scope

- Consume Redis Stream request-log events via consumer groups:
  - `XAUTOCLAIM` for idle pending (Redis 6.2+; works on 8.2)
  - `XREADGROUP … >` for new messages
  - Transform → load Postgres → `XACK` on success
- Do **not** use `XREADGROUP … CLAIM` (Redis 8.4+ only).
- Redis is **Upstash HTTP REST** (`@upstash/redis/cloudflare`). Workers cannot open Redis TCP. REST credentials are derived from `REDIS_URL` or `UPSTASH_REDIS_REST_*`.
- `XREADGROUP BLOCK` is not supported on Upstash REST; default `REQUEST_LOG_BLOCK_MS=0`. An empty non-blocking read ends the drain.
- Pipeline modules:
  - `src/consumer/` — Redis read / extract / ack / ensure-group
  - `src/transform/` — stream fields → `request_log` + `event_log` rows (token paths + cost)
  - `src/load/` — transactional inserts; auto-create day + org partitions on miss
  - `src/process.ts` — batch orchestrator (only successful entries are ACKed)
  - `src/consume-loop.ts` — drain until idle-exit, max duration, or empty non-blocking read
  - `src/job.ts` — one invocation (ensure group + drain)
  - `src/index.ts` — Worker `scheduled()` + `fetch` (`/health`, `/ready`)
- Scheduling between runs is the Cloudflare Cron Trigger in `wrangler.jsonc` (`triggers.crons`).
- Token field paths live in `src/transform/token-paths.ts` (extend arrays for new providers).
- `request_log` / `event_log` are `PARTITION BY RANGE (log_date)`, with
  daily children `PARTITION BY LIST (organization_id)`. On
  `no partition of relation … found for row`, create
  `{table}_{YYYY_MM_DD}` (LIST parent) and
  `{table}_{YYYY_MM_DD}_{normalized_organization_id}` (org leaf) and retry
  once (`src/load/partitions.ts`).
- Prefer matching `gateway-api` Drizzle patterns (Neon serverless, `casing: "snake_case"`, lazy `db` proxy).

## Testing Expectations

- Add or update automated tests for any behavior change, especially stream parsing, token extraction, and consumer helpers.
- Prefer small focused unit tests with a fake Redis / DB client.
- Before handing work off, run `bun test` and `bun run build` in this app.
