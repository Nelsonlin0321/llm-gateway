# 013 — Idle-exit timeout and scheduled drains

## Summary of changes

The ingest worker no longer polls Redis in a forever consume loop.

- `REQUEST_LOG_IDLE_EXIT_MS` (default `30000`) ends a drain when no events arrive for that long. Any ingested event resets the timer to `now + idleExitMs`. `0` restores a forever consume loop.
- `REQUEST_LOG_SCHEDULE_MS` (default `1800000`, 30 minutes) waits after idle-exit then starts another drain. `0` exits the process after one drain (pair with an external cron every 30 minutes).
- XREADGROUP `BLOCK` is capped to the remaining idle time so the loop does not overshoot the deadline.

## Files touched

- `src/lib/config.ts`
- `src/lib/idle-exit.ts`
- `src/consume-loop.ts`
- `src/index.ts`
- `tests/config.test.ts`
- `tests/idle-exit.test.ts`
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

Idle-exit + timer reset: `tests/idle-exit.test.ts`, `tests/consume-loop.test.ts`.
Config defaults/overrides: `tests/config.test.ts`.

## Follow-ups / next steps

- For a one-shot CronJob, set `REQUEST_LOG_SCHEDULE_MS=0`.
- For a long-lived dev consumer, set `REQUEST_LOG_IDLE_EXIT_MS=0`.
