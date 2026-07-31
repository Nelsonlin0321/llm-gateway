# gateway-ingest

Redis Stream consumer for Open LLM Gateway request logs.

Reads events published by `gateway-api` (`XADD` → `llm-gateway-request-logs`) using a consumer group, extracts each entry into a structured record, and (later) will transform and ingest into PostgreSQL.

**Current scope (Phase A):** reclaim idle pending + read new messages, extract/log, then `XACK`. No transform. No Postgres writes.

## Architecture

```
gateway-api  ──XADD──►  Redis Stream (llm-gateway-request-logs)
                                │
              ┌─────────────────┴──────────────────┐
              │ 1) XAUTOCLAIM (idle pending)       │
              │ 2) XREADGROUP … > (new messages)   │
              │ 3) extract + log → XACK            │
              └─────────────────┬──────────────────┘
                                ▼
                        gateway-ingest
                                │
                    (planned) transform → Postgres
```

## Read path (Redis 8.2 compatible)

Does **not** use `XREADGROUP … CLAIM` (Redis 8.4+ only). Instead:

```text
# 1) Prefer stuck / idle pending work (paginated PEL scan)
XAUTOCLAIM llm-gateway-request-logs gateway-ingest consumer-1 60000 <cursor> COUNT 100
# cursor starts at 0-0; then use next id from each XAUTOCLAIM reply

# 2) Fill remaining COUNT with never-delivered messages
XREADGROUP GROUP gateway-ingest consumer-1 COUNT <remaining> BLOCK 2000 STREAMS llm-gateway-request-logs >

# 3) After successful extract + log
XACK llm-gateway-request-logs gateway-ingest <id…>
```

`nextAutoclaimStartId` is kept across loops so a large PEL is scanned incrementally. Restarting at `0-0` every iteration would re-walk already-visited pending entries and add latency. When Redis returns next id `0-0`, the scan has wrapped.

| Option | Env | Default | Meaning |
| ------ | --- | ------- | ------- |
| `GROUP` | `REQUEST_LOG_CONSUMER_GROUP` | `gateway-ingest` | Consumer group name |
| consumer | `REQUEST_LOG_CONSUMER_NAME` | `consumer-<host>-<pid>` | This process’s consumer id |
| `COUNT` | `REQUEST_LOG_READ_COUNT` | `100` | Shared budget: claim first, then new |
| `BLOCK` | `REQUEST_LOG_BLOCK_MS` | `2000` | Block on new-message read when claim returned nothing |
| min-idle | `REQUEST_LOG_CLAIM_MIN_IDLE_MS` | `60000` | `XAUTOCLAIM` min idle ms (`0` skips reclaim) |
| stream | `REQUEST_LOG_STREAM` | `llm-gateway-request-logs` | Stream key |

`XAUTOCLAIM` requires **Redis 6.2+** (fine on Redis 8.2).

When claim already returned some entries, the new-message `XREADGROUP` is **non-blocking** so claimed work is handled promptly.

## Quick start

```bash
cd apps/gateway-ingest
cp .env.example .env   # set REDIS_URL
bun install
bun run dev
```

With `REQUEST_LOG_DEBUG=1`, each entry’s full field map is printed.

## Scripts

| Script | Description |
| ------ | ----------- |
| `bun run dev` | Hot-reload consumer loop |
| `bun run start` | Run consumer once (long-lived loop) |
| `bun run build` | Typecheck (`tsc --noEmit`) |
| `bun test` | Unit tests |

## Extracted shape

Each stream entry becomes:

```ts
{
  stream: "llm-gateway-request-logs",
  id: "1710000000000-0",
  source: "autoclaim" | "xreadgroup",
  payloadMissing?: boolean,
  fields: {
    schema_version: "1",
    event_type: "request_log",
    event_id: "...",
    // ... flat string fields from gateway-api request-log schema v1
  }
}
```

## ACK policy (Phase A)

After extract + log succeeds for an entry, the worker issues `XACK` so the PEL does not grow and reclaimed messages are not reprocessed forever.

Entries that fail handling stay pending and may be reclaimed after `REQUEST_LOG_CLAIM_MIN_IDLE_MS`.

Null-payload pending entries (stream entry deleted while still in PEL) are logged and ACKed so they do not loop.

## Intentionally deferred

- Field transformation / enrichment
- PostgreSQL ingest (move `XACK` to after successful DB write)
- Dead-letter / max-delivery limits

## Related

- `apps/gateway-api` — producer (`emitRequestLog` → `XADD`)
- Stream schema: `apps/gateway-api/tasks/ai/022-proxy-redis-stream-log-schema.md`
- System design: root `SYSTEM_DESIGN.MD` (Ingest Worker)
