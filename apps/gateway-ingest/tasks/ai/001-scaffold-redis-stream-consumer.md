# 001 — Scaffold gateway-ingest Redis Stream consumer (extract only)

**Status:** Done  
**App:** `gateway-ingest`  
**Depends on:** `gateway-api` request-log stream (`llm-gateway-request-logs`)

---

## Summary

Created a new monorepo app `apps/gateway-ingest` that consumes request-log events from the Redis Stream published by `gateway-api`, using consumer groups.

**This phase only extracts Redis stream entries.** No field transformation and no PostgreSQL ingest. No `XACK` yet (entries remain pending so later phases can process them; `CLAIM` reclaims idle pending messages).

### Consumer command

Equivalent of:

```text
XREADGROUP GROUP gateway-ingest consumer1 COUNT 100 BLOCK 2000 CLAIM 60000 STREAMS llm-gateway-request-logs >
```

- Ensures the consumer group exists (`XGROUP CREATE … MKSTREAM`, treats `BUSYGROUP` as OK)
- Reads via `XREADGROUP` with optional `CLAIM` (Redis 8.4+)
- Parses flat field/value arrays into `ExtractedStreamEntry` records
- Logs a summary per entry (full fields when `REQUEST_LOG_DEBUG=1`)

---

## Files Touched

- `apps/gateway-ingest/package.json` — Bun app, `ioredis`
- `apps/gateway-ingest/tsconfig.json`
- `apps/gateway-ingest/AGENTS.md`
- `apps/gateway-ingest/README.md`
- `apps/gateway-ingest/.env.example`
- `apps/gateway-ingest/.gitignore`
- `apps/gateway-ingest/src/index.ts` — long-lived consumer loop
- `apps/gateway-ingest/src/lib/config.ts` — env → config
- `apps/gateway-ingest/src/lib/redis-client.ts` — Redis client surface
- `apps/gateway-ingest/src/lib/redis-keys.ts` — stream + group defaults
- `apps/gateway-ingest/src/consumer/extract.ts` — parse XREADGROUP reply
- `apps/gateway-ingest/src/consumer/ensure-group.ts` — XGROUP CREATE
- `apps/gateway-ingest/src/consumer/read-group.ts` — XREADGROUP + CLAIM args
- `apps/gateway-ingest/src/consumer/index.ts` — public exports
- `apps/gateway-ingest/tests/*.test.ts` — unit tests (fake Redis)
- `apps/gateway-ingest/tasks/ai/001-scaffold-redis-stream-consumer.md` — this log

---

## How To Verify

```bash
cd apps/gateway-ingest
bun install
bun test
bun run build
```

Optional live run (requires Redis with the request-log stream):

```bash
cp .env.example .env   # set REDIS_URL
bun run dev
```

Generate traffic via `gateway-api` proxy calls, or seed with:

```text
XADD llm-gateway-request-logs * schema_version 1 event_type request_log event_id test-1
```

---

## Follow-ups / Next Steps

- Transform extracted fields into domain/usage records
- Ingest into PostgreSQL (request log / usage tables)
- `XACK` after successful ingest; dead-letter / max-delivery handling
- Optional: multi-consumer horizontal scale docs
- Wire into root README architecture diagram when ready
