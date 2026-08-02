# Gateway Ingest

### Redis Stream → Postgres telemetry worker for Open LLM Gateway

<p align="left">
  <img src="https://img.shields.io/badge/runtime-Bun-f472b6?logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/queue-Redis%20Streams-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/DB-Postgres%20%2B%20Drizzle-336791?logo=postgresql&logoColor=white" alt="Postgres" />
</p>

**Gateway Ingest** is the durable analytics pipeline for [Open LLM Gateway](../../README.MD). It consumes request-log events published by **gateway-api**, transforms them into structured rows (tokens, cost, attribution), and loads them into PostgreSQL for the portal dashboards.

> Self-hosted observability without bolting a second SaaS onto your LLM stack.  
> ★ Star the [root repo](../../README.MD) if this design is useful to you.

---

## Why a separate worker?

The proxy must stay fast. Logging is **asynchronous**:

1. `gateway-api` finishes the upstream call and `XADD`s a flat event to Redis (best-effort).  
2. **gateway-ingest** claims the message, enriches it, and writes Postgres.  
3. `gateway-portal` reads aggregates — never blocks a chat completion.

```
gateway-api  ──XADD──►  Redis Stream  llm-gateway-request-logs
                                │
              ┌─────────────────┴──────────────────┐
              │ 1) XAUTOCLAIM  (idle / pending)    │
              │ 2) XREADGROUP  (new messages)      │
              │ 3) transform → load PG → XACK      │
              └─────────────────┬──────────────────┘
                                ▼
                         gateway-ingest
                         /    |    \
                  consumer transform load
                                │
                                ▼
                    PostgreSQL (Drizzle)
                    request_log + event_log
                    (daily range partitions)
```

---

## Features

- Consumer-group processing with **reclaim** of stuck pending entries  
- Compatible with **Redis 6.2+ / 8.2** (`XAUTOCLAIM` + `XREADGROUP`, not 8.4-only CLAIM syntax)  
- Path-based token usage extraction (extendable per provider)  
- Cost calculation from model pricing fields on the event  
- Transactional load of `request_log` + `event_log`  
- **ACK only after successful DB write**  
- Daily partition ensure + **mock seed** scripts for analytics demos  
- Graceful shutdown signal handling  

---

## Quick start

```bash
cd apps/gateway-ingest
cp .env.example .env   # set REDIS_URL and DATABASE_URL
bun install
bun run dev
```

With `REQUEST_LOG_DEBUG=1`, successful loads print token/cost summaries.

### Seed mock analytics data

Useful when developing the portal without live traffic:

```bash
# Default: 2026-06-01..2026-08-01, random 10–1000 rows per day
bun run seed:event-log

# Fixed volume
bun run scripts/seed-event-log/seed.ts --per-day=50

# JSON only (no DB)
bun run seed:event-log:json
```

The seeder creates missing daily partitions (`event_log_YYYY_MM_DD` / `request_log_YYYY_MM_DD`) before insert.

---

## Environment

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DATABASE_URL` | — | Postgres (same cluster as portal) |
| `REDIS_URL` | — | Redis with Streams |
| `REQUEST_LOG_STREAM` | `llm-gateway-request-logs` | Stream key |
| `REQUEST_LOG_CONSUMER_GROUP` | `gateway-ingest` | Consumer group |
| `REQUEST_LOG_CONSUMER_NAME` | `consumer-<host>-<pid>` | This process id |
| `REQUEST_LOG_READ_COUNT` | `100` | Batch budget (claim first, then new) |
| `REQUEST_LOG_BLOCK_MS` | `2000` | Block when waiting for new messages |
| `REQUEST_LOG_CLAIM_MIN_IDLE_MS` | `60000` | Min idle before reclaim (`0` skips) |
| `REQUEST_LOG_DEBUG` | — | Verbose load summaries when `1` |

---

## Read path (detail)

```text
# 1) Prefer stuck / idle pending work (paginated PEL scan)
XAUTOCLAIM llm-gateway-request-logs gateway-ingest consumer-1 60000 <cursor> COUNT 100

# 2) Fill remaining COUNT with never-delivered messages
XREADGROUP GROUP gateway-ingest consumer-1 COUNT <remaining> BLOCK 2000 \
  STREAMS llm-gateway-request-logs >

# 3) After successful transform + Postgres load
XACK llm-gateway-request-logs gateway-ingest <id…>
```

`nextAutoclaimStartId` is retained across loops so a large PEL is scanned incrementally. When Redis returns next id `0-0`, the scan has wrapped.

When claim already returned entries, the new-message `XREADGROUP` is **non-blocking** so claimed work is drained promptly.

---

## Module layout

| Path | Role |
| ---- | ---- |
| `src/consumer/` | Group ensure, read (`XAUTOCLAIM` + `XREADGROUP`), extract, `XACK` |
| `src/transform/` | Map stream fields → rows; token paths + cost |
| `src/load/` | Insert both tables in one transaction; partitions |
| `src/process.ts` | Per-batch orchestrator |
| `src/index.ts` | Main loop |
| `scripts/seed-event-log/` | Mock generator + seeder CLI |

Token lookup paths for new providers live in `src/transform/token-paths.ts`.

---

## Database

- Schema: `src/db/schema.ts` (mirrors portal; includes `request_log` + `event_log`)  
- Client: `src/lib/db.ts` (`casing: "snake_case"`)  
- **Migrations are owned by `gateway-portal`** — ingest inserts into the shared schema  

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `bun run dev` | Hot-reload consumer loop |
| `bun run start` | Long-lived consumer |
| `bun run build` | Typecheck (`tsc --noEmit`) |
| `bun test` | Unit tests |
| `bun run seed:event-log` | Partitions + insert mock `event_log` |
| `bun run seed:event-log:json` | Dry-run JSON dump |

---

## ACK & failure policy

| Outcome | Action |
| ------- | ------ |
| Transform + load OK | `XACK` — entry leaves PEL |
| Handler error | Leave pending → reclaimed after min-idle |
| Null / deleted payload still in PEL | Log + ACK (avoid infinite reclaim loops) |

Proxy clients are never blocked by ingest lag or Redis outages on the write path of gateway-api.

---

## Extracted shape (summary)

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
    // flat string fields from gateway-api request-log schema v1
  }
}
```

Full field list: [`gateway-api` stream schema notes](../gateway-api/tasks/ai/022-proxy-redis-stream-log-schema.md) (when present in tree).

---

## Related

| Package | Role |
| ------- | ---- |
| [`gateway-api`](../gateway-api) | Producer (`emitRequestLog` → `XADD`) |
| [`gateway-portal`](../gateway-portal) | Analytics consumer of `event_log` |
| [Root README](../../README.MD) | End-to-end setup |
| [`SYSTEM_DESIGN.MD`](../../SYSTEM_DESIGN.MD) | Architecture vision |

---

## Contributing

Great contributions include:

- New provider token paths  
- Better cost / caching accounting  
- Dead-letter / max-delivery policies  
- Metrics (processed/sec, lag, error rate)

Please add tests under `tests/` and keep the ACK-after-load guarantee intact.

---

## License

Licensed under the [Apache License, Version 2.0](../../LICENSE) — same as the monorepo root.

---

<p align="center">
  Durable LLM telemetry, without slowing the hot path.<br />
  ★ Star <a href="../../README.MD">Open LLM Gateway</a> to support open, self-hosted AI infrastructure.
</p>
