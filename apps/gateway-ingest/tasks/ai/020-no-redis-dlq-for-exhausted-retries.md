# 020 — No Redis DLQ for exhausted retries

## Summary of changes

- After more than 3 process failures, entries are parked in `dead_request_log` / `dead_event_log` and XACK'd only.
- They are no longer written to `REQUEST_LOG_DLQ_STREAM`.
- Transform validation failures (no mapped rows) still use the existing Redis DLQ path.

## Files touched

- `apps/gateway-ingest/src/process.ts`
- `apps/gateway-ingest/tests/process.test.ts`
- `apps/gateway-ingest/AGENTS.md`
- `apps/gateway-ingest/tasks/ai/019-dead-request-event-log.md`

## How to verify

```bash
cd apps/gateway-ingest
bun test tests/process.test.ts
bun run build
```

## Follow-ups / next steps

- None.
