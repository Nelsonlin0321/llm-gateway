# 006 — Setup Drizzle ORM for gateway-ingest

## Summary of changes

Wired Drizzle ORM for the ingest worker so it can type-safely target the shared Postgres schema (for upcoming Redis → PG writes):

- Installed `drizzle-orm`, `@neondatabase/serverless`, `dotenv`, and `drizzle-kit`
- Added `drizzle.config.ts` (PostgreSQL, `casing: "snake_case"`, requires `DATABASE_URL`)
- Added lazy Drizzle client at `src/lib/db.ts` (Bun native WebSocket, Neon pool, schema re-export)
- Kept/aligned shared schema at `src/db/schema.ts` (same tables as api/portal, including `request_log` + `event_log`)
- Fixed `request_log` timestamps spread (`...timestamp` → `...timestamps`) in ingest, api, and portal schema copies
- Added `db:generate` / `db:migrate` / `db:studio` scripts
- Documented `DATABASE_URL` in `.env.example` and README

No consumer write path yet — Phase A still extract + log + XACK only.

## Files touched

- `apps/gateway-ingest/package.json`
- `apps/gateway-ingest/bun.lock`
- `apps/gateway-ingest/drizzle.config.ts`
- `apps/gateway-ingest/src/lib/db.ts`
- `apps/gateway-ingest/src/db/schema.ts`
- `apps/gateway-ingest/.env.example`
- `apps/gateway-ingest/README.md`
- `apps/gateway-ingest/AGENTS.md`
- `apps/gateway-api/src/db/schema.ts` (timestamps fix)
- `apps/gateway-portal/lib/db/schema.ts` (timestamps fix)

## How to verify

```bash
cd apps/gateway-ingest
bun install
bun run build
bun test
# optional, needs DATABASE_URL:
bun run db:studio
```

## Follow-ups / next steps

- Map Redis stream fields → `request_log` / `event_log` insert rows
- Write after extract; move `XACK` to after successful DB write
- Custom SQL migration for `PARTITION BY RANGE (log_date)` (portal-owned)
