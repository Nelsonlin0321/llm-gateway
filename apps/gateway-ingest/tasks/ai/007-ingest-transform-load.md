# 007 — Ingest transform + load for request_log / event_log

## Summary of changes

Implemented the Redis → Postgres ingest pipeline for `gateway-ingest`:

1. **Transform** (`src/transform/`)
   - Map flat Redis stream fields → `request_log` + `event_log` rows
   - `responseText`: stream body when `is_stream=true`, else JSON body
   - Token extraction via configurable dot-paths (`token-paths.ts`):
     - input: `usage.prompt_tokens` / `usage.input_tokens`
     - output: `usage.completion_tokens` / `usage.output_tokens`
     - cached: `usage.prompt_tokens_details.cached_tokens` / `usage.cache_creation_input_tokens`
   - Stream: scan last N SSE `data:` chunks for usage (default 5)
   - `inputToken = rawInput − cached`; `totalToken = cached + input + output`
   - Cost: `cached/1M * cachePrice + input/1M * inputPrice + output/1M * outputPrice`
   - Missing usage → zeros

2. **Load** (`src/load/`)
   - Transactional insert of both tables

3. **Process** (`src/process.ts`) + main loop (`src/index.ts`)
   - Missing payload → ACK without write
   - Transform/load failure → leave pending (no ACK)
   - Success → XACK
   - Requires `DATABASE_URL` at startup

## Files touched

- `apps/gateway-ingest/src/transform/token-paths.ts` (new)
- `apps/gateway-ingest/src/transform/tokens.ts` (new)
- `apps/gateway-ingest/src/transform/parse.ts` (new)
- `apps/gateway-ingest/src/transform/map.ts` (new)
- `apps/gateway-ingest/src/transform/index.ts` (new)
- `apps/gateway-ingest/src/load/insert.ts` (new)
- `apps/gateway-ingest/src/load/index.ts` (new)
- `apps/gateway-ingest/src/process.ts` (new)
- `apps/gateway-ingest/src/index.ts` (refactored)
- `apps/gateway-ingest/tests/tokens.test.ts` (new)
- `apps/gateway-ingest/tests/map.test.ts` (new)
- `apps/gateway-ingest/tests/process.test.ts` (new)
- `apps/gateway-ingest/AGENTS.md`
- `apps/gateway-ingest/README.md`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
# live path (needs REDIS_URL + DATABASE_URL + traffic):
bun run dev
```

## Follow-ups / next steps

- Idempotent upserts if re-delivery after partial ACK failure becomes an issue
- Extend token path lists (e.g. Anthropic `cache_read_input_tokens`) when needed
- Optional batch multi-row insert for higher throughput
