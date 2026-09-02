# 051 — Cloudflare Workers deployment

## Summary of changes

Refactored gateway-api from a Bun-only Hono process to a Cloudflare Worker while keeping Bun for unit tests.

- Added `wrangler.jsonc`: non-secret `vars`, `secrets.required` (names only), local port 8080.
- Local `wrangler dev` loads secret values from `.env` as Worker bindings. Production uses `wrangler secret put` — no `.env` on Cloudflare.
- Request middleware merges `c.env` bindings onto `process.env` so JWT/crypto/DB helpers keep working.
- Replaced TCP `ioredis` with `@upstash/redis` HTTP REST (Workers cannot open Redis TCP). REST credentials are derived from `REDIS_URL` (`rediss://default:token@host:6379` → `https://host` + token).
- Background request-log emit uses `c.executionCtx.waitUntil` on Workers so the isolate is not killed mid-write.
- `bun run dev` / `start` now run Wrangler; `dev:bun` remains as an escape hatch.

## Files touched

- `wrangler.jsonc`, `.env.example`, `package.json`, `bun.lock`
- `src/index.ts`, `src/env.ts`, `src/lib/config.ts`, `src/lib/db.ts`, `src/lib/redis-client.ts`
- `src/proxy/upstream-proxy.ts`, `src/request-log/emit.ts`
- `tests/config.test.ts`, `tests/redis.test.ts`
- `README.md`, `AGENTS.md`, `.gitignore` (app + repo root)

## How to verify

```bash
cd apps/gateway-api
bun test tests --path-ignore-patterns='**/*.live.test.ts'
bun run build
bun run dev   # wrangler dev, loads .env
curl -s http://localhost:8080/health
curl -s http://localhost:8080/ready
```

Local Worker run (this change): `/health` 200, `/ready` `{"status":"ok","checks":{"postgres":"ok","redis":"ok"}}`.

Deploy:

```bash
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put JWT_SIGNING_SECRET
bunx wrangler secret put API_ENCRYPT_KEY
bunx wrangler secret put REDIS_URL
bun run deploy
```

## Follow-ups / next steps

- Optional: set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as extra secrets instead of deriving REST from `REDIS_URL`.
- Docker `redis://localhost:6379` (no password) is not usable from workerd; keep using Upstash for Worker local/prod.
- Consider Cloudflare Hyperdrive if Postgres WebSocket/fetch from Workers becomes a bottleneck.
