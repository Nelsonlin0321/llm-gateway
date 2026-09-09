# 001 — Schema audit: generated SQL could not be migrated

## Summary of changes

`lib/db/schema.ts` generates valid PostgreSQL, but `drizzle-kit migrate` could not apply it for two reasons:

1. **Driver.** drizzle-kit prefers `pg`, then `postgres`, then `@neondatabase/serverless`. Only the last was installed, so migrate used Neon’s websocket client against a normal Postgres/Xata URL and failed with no SQL error printed.
2. **Partitioning.** `request_log` and `event_log` must be `PARTITION BY RANGE (log_date)` for gateway-ingest. Drizzle cannot emit that. The previous `0000` was hand-edited to add `PARTITION BY` and dropped `--> statement-breakpoint` after those `CREATE TABLE`s, so drizzle-kit sent two statements in one prepared query (`cannot insert multiple commands into a prepared statement`). Regenerating without the hand-edit produced heap tables (`relkind = r`), which ingest cannot attach partitions to.

Fixes:

- Add `pg` so `drizzle-kit migrate` uses node-postgres.
- Patch generated `CREATE TABLE` for `request_log` / `event_log` to `PARTITION BY RANGE ("log_date")` while keeping statement breakpoints.
- Run that patch after `npm run generate`.

## Files touched

- `lib/db/schema.ts`
- `scripts/patch-partitioned-log-tables.ts`
- `drizzle/migrations/0000_faithful_black_panther.sql`
- `package.json` / `package-lock.json`

## How to verify

```bash
cd apps/gateway-portal
npx tsx scripts/patch-partitioned-log-tables.ts   # idempotent: no CREATE TABLE patches needed
DATABASE_URL='postgresql://postgres@127.0.0.1:55432/gateway' npx drizzle-kit migrate
# request_log and event_log relkind = p
# CREATE TABLE … PARTITION OF request_log … PARTITION BY LIST (organization_id) succeeds
```

Local Postgres 16: migrate applied; `request_log`/`event_log` are partitioned; ingest-style day + org partitions accepted inserts. Dead-letter tables stay unpartitioned.

## Follow-ups / next steps

- Existing databases that already applied the old `0000`/`0001`/`0002` hashes cannot replay this squashed `0000`. Reset `__drizzle_migrations` + schema, or keep the old chain.
- `updatedAt` is `NOT NULL` with `$onUpdate` only (no `DEFAULT now()`). DDL is valid; inserts must set the column.
- `child_key_tags_idx` comment claims `jsonb_path_ops`; the index uses default `jsonb_ops`.
- `request_log` PK column order is `(organization_id, event_id, log_date)` vs `event_log` `(organization_id, log_date, event_id)`.
- Keep `apps/gateway-ingest/src/db/schema.ts` comments in sync if that copy is still the ingest source of truth.
