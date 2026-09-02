# 016 — Remove HTTP `/run` endpoint

## Summary of changes

Ingest drains are cron-only. Removed the public `POST /run` handler so a Worker HTTP request cannot start a drain.

Local one-shot drains still use Wrangler `GET /__scheduled` (`bun run dev --test-scheduled`).

## Files touched

- `src/index.ts`
- `tests/worker.test.ts`
- `README.md`, `AGENTS.md`, `docs/001-graceful-shutdown-signals.md`
- `tasks/ai/015-cloudflare-scheduled-worker.md` (drop `/run` follow-up)

## How to verify

```bash
cd apps/gateway-ingest
bun test tests/worker.test.ts
bun run build
```

## Follow-ups / next steps

None.
