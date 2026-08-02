# 010 — Move seed scripts under scripts/ + random 10–1000 rows/day

## Summary of changes

- Moved event_log mock tooling entirely under `scripts/seed-event-log/`:
  - `generate.ts` — pure generators
  - `seed.ts` — CLI (partition ensure + insert)
- Removed previous locations: `src/db/seed-event-log.ts`, `src/db/seed.ts`, `scripts/seed-event-log-mock.ts`
- Each `log_date` now gets a **random row count in [10, 1000]** by default
  - Override with `--per-day-min` / `--per-day-max`, or fixed `--per-day=N`
- Day-by-day insert path to keep peak memory lower on large ranges
- Updated package scripts, README, tests

## Files touched

- `apps/gateway-ingest/scripts/seed-event-log/generate.ts` (new)
- `apps/gateway-ingest/scripts/seed-event-log/seed.ts` (new)
- `apps/gateway-ingest/scripts/seed-event-log-mock.ts` (removed)
- `apps/gateway-ingest/src/db/seed-event-log.ts` (removed)
- `apps/gateway-ingest/src/db/seed.ts` (removed)
- `apps/gateway-ingest/tests/seed-event-log.test.ts`
- `apps/gateway-ingest/package.json`
- `apps/gateway-ingest/README.md`
- `apps/gateway-ingest/tsconfig.json`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
bun run scripts/seed-event-log/seed.ts --dry-run --from=2026-06-01 --to=2026-06-02
bun run seed:event-log   # needs DATABASE_URL
```
