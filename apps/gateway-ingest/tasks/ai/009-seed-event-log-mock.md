# 009 — Seed mock event_log data

## Summary of changes

Added a mock data generator + CLI seeder for the partitioned `event_log` table:

- **Generator** (`src/db/seed-event-log.ts`): builds realistic rows from field comments (providers, tokens, prices, tags, stream mode, etc.)
- **CLI** (`scripts/seed-event-log-mock.ts`):
  1. Generate rows for `log_date` range (default `2026-06-01` … `2026-08-01`)
  2. Optionally write JSON (`--write-json=…`)
  3. Ensure daily partitions via `ensureDayPartitions`
  4. Batch-insert into `event_log`
- npm scripts: `seed:event-log`, `seed:event-log:json`
- Unit tests for date range + field constraints

Note: inserts target **`event_log`** (analytics table). The human task mentioned `request_log` once, but the schema/field comments are for `event_log`.

## Files touched

- `apps/gateway-ingest/src/db/seed-event-log.ts` (new)
- `apps/gateway-ingest/src/db/seed.ts`
- `apps/gateway-ingest/scripts/seed-event-log-mock.ts` (new)
- `apps/gateway-ingest/tests/seed-event-log.test.ts` (new)
- `apps/gateway-ingest/package.json`
- `apps/gateway-ingest/README.md`
- `apps/gateway-ingest/.gitignore`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build

# JSON only
bun run seed:event-log:json

# Live insert (needs DATABASE_URL)
bun run seed:event-log
# or smaller sample:
bun run scripts/seed-event-log-mock.ts --from=2026-08-01 --to=2026-08-01 --per-day=5
```

## Follow-ups / next steps

- Optional companion seeder for `request_log` raw payloads
- Optional wipe flag for re-seeding a date range
