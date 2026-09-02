# 015 — Cloudflare Worker Cron (`scheduled()`)

## Summary of changes

Refactored `gateway-ingest` from a long-lived Bun process into a Cloudflare Worker job with a `scheduled()` handler, matching `gateway-api` deployment.

- Added `wrangler.jsonc`: Cron Trigger `* * * * *`, non-secret `vars`, `secrets.required` (`DATABASE_URL`, `REDIS_URL`), local port 8081.
- Worker entry exports `scheduled()` (cron drain) and `fetch` (`/health`, `/ready`).
- Replaced TCP `ioredis` with `@upstash/redis` HTTP REST. REST credentials are derived from `REDIS_URL` or `UPSTASH_REDIS_REST_*`.
- Default `REQUEST_LOG_BLOCK_MS=0` (Upstash REST does not support `XREADGROUP BLOCK`). An empty non-blocking read ends the drain.
- Stable consumer name `gateway-ingest-worker` across cron ticks. `REQUEST_LOG_MAX_DURATION_MS` (default 25000) caps one invocation so leftover PEL work is reclaimed on the next tick.
- Local `wrangler dev --test-scheduled` loads `.env`. Production uses `wrangler secret put`.

## Files touched

- `wrangler.jsonc`, `package.json`, `bun.lock`, `.env.example`, `.gitignore`
- `src/index.ts`, `src/env.ts`, `src/job.ts`
- `src/lib/config.ts`, `src/lib/redis-client.ts`, `src/lib/db.ts`, `src/consume-loop.ts`
- `tests/config.test.ts`, `tests/consume-loop.test.ts`, `tests/job.test.ts`, `tests/redis-client.test.ts`, `tests/worker.test.ts`, plus FakeRedis `ping`/`xadd` on existing consumer tests
- `README.md`, `AGENTS.md`, `docs/001-graceful-shutdown-signals.md`
- Root `README.MD`, `SYSTEM_DESIGN.MD`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
bunx wrangler deploy --dry-run
bun run dev   # wrangler dev --test-scheduled, loads .env
curl -s http://localhost:8081/health
curl "http://localhost:8081/__scheduled?cron=*+*+*+*+*"
```

This change: `bun test` 100 pass, `tsc --noEmit` ok, `wrangler deploy --dry-run` bundles (657.52 KiB).

Deploy:

```bash
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put REDIS_URL
bun run deploy
```

## Follow-ups / next steps

- Optional: set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as extra secrets instead of deriving REST from `REDIS_URL`.
- Docker `redis://localhost:6379` (no password) is not usable from workerd; keep using Upstash for Worker local/prod.
- Change `triggers.crons` if every-minute is too frequent.
