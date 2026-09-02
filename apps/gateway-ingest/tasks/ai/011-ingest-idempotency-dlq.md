# 011 — Ingest idempotency and dead-letter queue

## Summary of changes

- Inserts use `ON CONFLICT DO NOTHING`; unique violations (replayed stream ids) are treated as success and ACK'd.
- Transform validation failures are unrecoverable: they are written to `llm-gateway-request-logs-dlq` then ACK'd instead of spinning in the PEL.
- Tests include `organization_id` so transform/load matches the production stream contract.

## Files touched

- `src/load/insert.ts`, `src/process.ts`, `src/index.ts`, `src/lib/redis-keys.ts`, `src/lib/redis-client.ts`
- `tests/process.test.ts`, `tests/map.test.ts`, `tests/insert.test.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- Operator UI / alert on DLQ depth.
- Optional max-delivery cutoff for transient load errors after N reclaims.
