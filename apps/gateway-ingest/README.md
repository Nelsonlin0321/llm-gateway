# gateway-ingest

Redis Stream consumer for Open LLM Gateway request logs.

Reads events published by `gateway-api` (`XADD` → `llm-gateway-request-logs`) using a consumer group, extracts each entry into a structured record, and (later) will transform and ingest into PostgreSQL.

**Current scope:** extract Redis stream events only. No transform. No Postgres writes. No `XACK`.

## Architecture

```
gateway-api  ──XADD──►  Redis Stream (llm-gateway-request-logs)
                                │
                    XREADGROUP GROUP … CLAIM …
                                ▼
                        gateway-ingest
                     (extract + log only)
                                │
                    (planned) transform → Postgres
```

## Redis command

The worker issues the equivalent of:

```text
XREADGROUP GROUP gateway-ingest consumer-1 COUNT 100 BLOCK 2000 CLAIM 60000 STREAMS llm-gateway-request-logs >
```

| Option   | Env                             | Default                    | Meaning                                                    |
| -------- | ------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `GROUP`  | `REQUEST_LOG_CONSUMER_GROUP`    | `gateway-ingest`           | Consumer group name                                        |
| consumer | `REQUEST_LOG_CONSUMER_NAME`     | `consumer-<host>-<pid>`    | This process’s consumer id                                 |
| `COUNT`  | `REQUEST_LOG_READ_COUNT`        | `100`                      | Max entries per read (claims + new share budget)           |
| `BLOCK`  | `REQUEST_LOG_BLOCK_MS`          | `2000`                     | Block up to N ms waiting for messages                      |
| `CLAIM`  | `REQUEST_LOG_CLAIM_MIN_IDLE_MS` | `60000`                    | Reclaim pending entries idle ≥ N ms first (Redis **8.4+**) |
| stream   | `REQUEST_LOG_STREAM`            | `llm-gateway-request-logs` | Stream key                                                 |

`CLAIM` requires **Redis 8.4+**. Set `REQUEST_LOG_CLAIM_MIN_IDLE_MS=0` to omit `CLAIM` on older Redis.

## Quick start

```bash
cd apps/gateway-ingest
cp .env.example .env   # set REDIS_URL
bun install
bun run dev
```

With `REQUEST_LOG_DEBUG=1`, each entry’s full field map is printed.

## Scripts

| Script          | Description                         |
| --------------- | ----------------------------------- |
| `bun run dev`   | Hot-reload consumer loop            |
| `bun run start` | Run consumer once (long-lived loop) |
| `bun run build` | Typecheck (`tsc --noEmit`)          |
| `bun test`      | Unit tests                          |

## Extracted shape

Each stream entry becomes:

```ts
{
  stream: "llm-gateway-request-logs",
  id: "1710000000000-0",
  fields: {
    schema_version: "1",
    event_type: "request_log",
    event_id: "...",
    // ... flat string fields from gateway-api request-log schema v1
  }
}
```

## Intentionally deferred

- Field transformation / enrichment
- PostgreSQL ingest
- `XACK` after successful processing
- Dead-letter / retry limits

## Related

- `apps/gateway-api` — producer (`emitRequestLog` → `XADD`)
- Stream schema: `apps/gateway-api/tasks/ai/022-proxy-redis-stream-log-schema.md`
- System design: root `SYSTEM_DESIGN.MD` (Ingest Worker)
