# 019 — Dead request/event log parking after >3 failures

## Summary of changes

- Added minimal Drizzle tables `dead_request_log` and `dead_event_log` (ingest, api, portal schemas). No migration generated.
  - Shared identity: `eventId`, `requestId`, `logDate`, `organizationId`
  - `dead_request_log` also stores `requestPayloadJson` and `responseText`
  - Failure meta: `streamId`, `failureReason`, `failureCount`, `deadLetteredAt`
  - Unpartitioned, no FKs, so poison payloads can still be inserted
- Load / unexpected process failures stay pending while Redis delivery count ≤ 3.
- When delivery count > 3, insert the dead rows and XACK so the PEL stops retrying. Do **not** also write `REQUEST_LOG_DLQ_STREAM`.
- Transform validation failures still go to the Redis DLQ (no valid rows to park).
- XAUTOCLAIM entries get `deliveryCount` from ranged XPENDING; new XREADGROUP messages are count 1.

## Files touched

- `apps/gateway-ingest/src/db/schema.ts`
- `apps/gateway-api/src/db/schema.ts`
- `apps/gateway-portal/lib/db/schema.ts`
- `apps/gateway-ingest/src/process.ts`
- `apps/gateway-ingest/src/load/insert.ts`, `src/load/index.ts`
- `apps/gateway-ingest/src/consumer/extract.ts`, `src/consumer/read-group.ts`, `src/consumer/index.ts`
- `apps/gateway-ingest/src/lib/redis-client.ts`
- `apps/gateway-ingest/src/consume-loop.ts`
- `apps/gateway-ingest/AGENTS.md`
- Tests: `process.test.ts`, `insert.test.ts`, `read-group.test.ts`, `extract.test.ts`, `redis-client.test.ts`, FakeRedis stubs

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- Generate and apply the SQL migration when asked.
- Operator UI / alert on `dead_*` table growth.
