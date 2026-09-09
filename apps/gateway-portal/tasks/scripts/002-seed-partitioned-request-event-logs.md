# 002 — Seed partitioned request and event logs

## Summary

Updated `scripts/snapshot-seed-data.ts` so `seed` now creates missing day and organization partitions before inserting `requestLog` and `eventLog` rows. This avoids Postgres `no partition of relation "request_log" found for row` failures when loading snapshot data into partitioned log tables.

## Files touched

- `scripts/snapshot-seed-data.ts`

## How to verify

1. `npx tsc --noEmit` from `apps/gateway-portal`
2. `DATABASE_URL='postgres://user:pass@localhost:5432/db' npx tsx scripts/snapshot-seed-data.ts --help` from `apps/gateway-portal`
3. Run `npx tsx scripts/snapshot-seed-data.ts seed [path]` against a database with the partitioned `request_log` / `event_log` schema and confirm snapshot rows insert without missing-partition errors

## Follow-ups / next steps

- Consider extracting the partition helper into a shared module if other portal scripts need to write directly to partitioned log tables
