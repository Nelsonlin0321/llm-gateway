# 021 — Remove Redis DLQ; park all unrecoverable failures in dead_* tables

## Summary of changes

- Removed `REQUEST_LOG_DLQ_STREAM` and the consume-loop `XADD` to it.
- Transform validation failures insert `dead_request_log` / `dead_event_log` from raw stream fields (identity fallbacks when fields are missing) and XACK.
- Load / unexpected failures still retry until delivery count > `MAX_PROCESS_FAILURES`, then the same dead_* insert + ACK.
- ACK only happens after the dead-table insert succeeds.

## Files touched

- `apps/gateway-ingest/src/process.ts`
- `apps/gateway-ingest/src/consume-loop.ts`
- `apps/gateway-ingest/src/lib/redis-keys.ts`
- `apps/gateway-ingest/src/load/insert.ts`, `src/load/index.ts`
- `apps/gateway-ingest/AGENTS.md`
- Tests: `process.test.ts`, `insert.test.ts`, `consume-loop.test.ts`, `job.test.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- Generate and apply the SQL migration when asked.
