# 012 — Subpartition request_log / event_log by organization

## Summary of changes

Daily `RANGE (log_date)` partitions are now further `PARTITION BY LIST (organization_id)` so analytics queries that filter by org only scan that org’s leaves.

Two-level DDL (same for `request_log` and `event_log`):

```sql
CREATE TABLE IF NOT EXISTS request_log_2026_08_23 PARTITION OF request_log
  FOR VALUES FROM ('2026-08-23') TO ('2026-08-24')
  PARTITION BY LIST (organization_id);

CREATE TABLE IF NOT EXISTS request_log_2026_08_23_org_1
  PARTITION OF request_log_2026_08_23
  FOR VALUES IN ('org-1');
```

`HASH (organization_id)` cannot attach one named table per org as a RANGE child of the parent for the same date (ranges would overlap). LIST on the daily child is the layout that matches `{table}_{YYYY_MM_DD}_{normalized_organization_id}`.

Load path still inserts first; on `no partition of relation … found for row` it creates the day parent + org leaf for both tables and retries once. Cache key is `logDate + organizationId`. Legacy daily leaf partitions (not subpartitioned) still accept inserts; org-child CREATE is skipped when the daily table is not partitioned.

Seed mock rows pick from 8 org ids so we do not create a LIST partition per generated row.

## Files touched

- `apps/gateway-ingest/src/load/partitions.ts`
- `apps/gateway-ingest/src/load/insert.ts`
- `apps/gateway-ingest/src/load/index.ts`
- `apps/gateway-ingest/src/db/schema.ts`
- `apps/gateway-api/src/db/schema.ts`
- `apps/gateway-portal/lib/db/schema.ts`
- `apps/gateway-ingest/scripts/seed-event-log/generate.ts`
- `apps/gateway-ingest/scripts/seed-event-log/seed.ts`
- `apps/gateway-ingest/tests/partitions.test.ts`
- `apps/gateway-ingest/tests/insert.test.ts`
- `apps/gateway-ingest/tests/seed-event-log.test.ts`
- `apps/gateway-ingest/AGENTS.md`
- `apps/gateway-ingest/README.md`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- Existing daily leaf partitions keep working as-is. Optional one-off migration: detach each leaf, recreate it as `PARTITION BY LIST (organization_id)`, and split rows into per-org children.
- Parent table definition stays `PARTITION BY RANGE (log_date)` (portal-owned migration); no catalog change required for new days.
