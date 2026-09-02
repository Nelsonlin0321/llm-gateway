# 014 — Remove in-process ingest schedule

## Summary of changes

Scheduling between ingest runs is owned by outside orchestration. Removed `REQUEST_LOG_SCHEDULE_MS` / `scheduleMs` and the in-process wait-and-rerun loop.

The worker still drains until `REQUEST_LOG_IDLE_EXIT_MS` with no events (timer resets on each ingested event), then exits so the orchestrator can start the next run.

## Files touched

- `src/lib/config.ts`
- `src/index.ts`
- `src/consume-loop.ts` (removed `sleepInterruptible`)
- `tests/config.test.ts`
- `tests/consume-loop.test.ts`
- `.env.example`
- `README.md`
- `AGENTS.md`
- `docs/001-graceful-shutdown-signals.md`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

None.
