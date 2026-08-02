# 008 — Auto-create daily partitions on insert miss

## Summary of changes

`request_log` and `event_log` are `PARTITION BY RANGE (log_date)`. Inserts into a day with no child partition fail with:

```text
no partition of relation "request_log" found for row
code: 23514
```

Load path now:

1. Try transactional insert (`request_log` + `event_log`)
2. If missing-partition error → create both daily partitions for that `log_date`
3. Retry the insert once

Partition DDL shape:

```sql
CREATE TABLE IF NOT EXISTS request_log_2026_08_01 PARTITION OF request_log
  FOR VALUES FROM ('2026-08-01') TO ('2026-08-02');
```

Same pattern for `event_log`. In-process cache skips re-CREATE for dates already ensured in this process. Concurrent races tolerate `already exists` / `42P07`.

## Files touched

- `apps/gateway-ingest/src/load/partitions.ts` (new)
- `apps/gateway-ingest/src/load/insert.ts`
- `apps/gateway-ingest/src/load/index.ts`
- `apps/gateway-ingest/tests/partitions.test.ts` (new)
- `apps/gateway-ingest/tests/insert.test.ts` (new)
- `apps/gateway-ingest/AGENTS.md`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- Optional: proactively ensure partitions for “today” at worker startup
- Optional: month-sized partitions if daily partition count grows too large
