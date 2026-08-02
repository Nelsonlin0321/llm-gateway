# Open LLM Gateway — System Design

Architecture for a **self-hosted**, multi-provider LLM control plane: low-latency proxy, async telemetry, and an admin portal with dimensional analytics.

Companion docs: [`README.MD`](./README.MD) (setup) · [`PROJECT.MD`](./PROJECT.MD) (product) · app READMEs under `apps/*`.

---

## 1. Goals

| Goal | Design implication |
| ---- | ------------------ |
| Fast proxy path | No synchronous DB writes for analytics on the request critical path |
| Multi-provider routing | Resolve `provider/alias` → base URL + master key + upstream model id |
| Safe key distribution | Master keys encrypted; clients only receive child `sk_…` JWTs |
| Durable usage data | Redis Stream buffer + consumer group + Postgres |
| Operator UX | Portal owns schema; analytics query `event_log` aggregates |
| Horizontal scale | Stateless gateway replicas; multiple ingest consumers |

### Non-goals (current design)

- Exactly-once analytics (at-least-once + idempotent event ids is enough)
- Real-time websocket dashboards (poll / request-time aggregates first)
- Guaranteeing 100% provider parity on day one

---

## 2. High-level architecture

```
                    ┌─────────────────────────────────────┐
   Clients / SDKs   │  Authorization: Bearer sk_<jwt>     │
   curl / apps      │  model: "provider/alias"            │
                    └─────────────────┬───────────────────┘
                                      │ HTTP
                                      ▼
                    ┌─────────────────────────────────────┐
                    │           gateway-api               │
                    │     Hono · Bun · :8080              │
                    │  auth → resolve → proxy → respond   │
                    │  (+ async XADD request log)         │
                    └───────────┬─────────────┬───────────┘
                                │             │
                    read path   │             │ best-effort
                    (cache miss)│             │ XADD
                                ▼             ▼
                         PostgreSQL      Redis Streams
                         + Redis cache   llm-gateway-request-logs
                         (auth/model)           │
                                                │ consumer group
                                                ▼
                                    ┌───────────────────────┐
                                    │    gateway-ingest     │
                                    │  reclaim → transform  │
                                    │  → load → XACK        │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                         PostgreSQL
                                    event_log · request_log
                                    (daily partitions)
                                                ▲
                                                │ SQL aggregates
                    ┌───────────────────────────┴───────────┐
                    │           gateway-portal              │
                    │     Next.js · Better Auth · :3000     │
                    │  providers · models · keys · analytics│
                    └───────────────────────────────────────┘
```

| Component | Runtime | Responsibility |
| --------- | ------- | -------------- |
| **gateway-api** | Bun + Hono | Data plane: auth, route, proxy, emit logs |
| **gateway-ingest** | Bun | Telemetry plane: stream → transform → Postgres |
| **gateway-portal** | Next.js | Control plane: CRUD, schema migrations, analytics UI |
| **PostgreSQL** | — | System of record (config + logs) |
| **Redis** | — | Auth/model cache + request-log stream |

---

## 3. Service design

### 3.1 gateway-api (proxy)

**Inbound surfaces (current):**

| Method | Path | Auth |
| ------ | ---- | ---- |
| `GET` | `/health` | none |
| `GET` | `/` | none (lists active routes) |
| `POST` | `/openai/*` | child key |
| `POST` | `/anthropic/*` | child key |

**Middleware pipeline (conceptual):**

```
requestId → logger → (route) childKeyAuth → payload rewrite → upstream fetch → response
                                                              ↘ async emitRequestLog
```

**Routing algorithm:**

1. Parse `Authorization: Bearer sk_…` → verify JWT with `JWT_SIGNING_SECRET`.  
2. Load child key record (Postgres; Redis cache when available).  
3. Parse body `model` as `providerName/alias`.  
4. Resolve active provider + model for the key’s creator scope.  
5. Decrypt provider master key with `API_ENCRYPT_KEY`.  
6. Rewrite `model` to upstream id; strip client-only `metadata`.  
7. Forward to provider `apiUrl` with compatibility-specific headers.  
8. Stream or buffer response to client.  
9. Build log fields (status, timings, usage if present) and `XADD` to Redis.

**Capture levels** (`REQUEST_LOG_CAPTURE_LEVEL`):

| Level | Request/response bodies |
| ----- | ----------------------- |
| `metadata` | Omitted (default, production-friendly) |
| `redacted` | Truncated |
| `full` | Included (trusted environments only) |

Always redacted: Authorization, master keys, child secrets, ciphertext material.

**Failure policy:**

- Auth / routing errors → 4xx/5xx to client.  
- Upstream errors → pass through status/body when possible.  
- Redis log failures → **log and continue** (never change client status).

---

### 3.2 gateway-ingest (worker)

**Pipeline per batch:**

```
XAUTOCLAIM (idle PEL)  →  XREADGROUP (new)  →  extract
        → transform (tokens, cost, map fields)
        → transactional insert (request_log + event_log)
        → XACK
```

| Property | Choice |
| -------- | ------ |
| Stream | `llm-gateway-request-logs` |
| Group | `gateway-ingest` (configurable) |
| Delivery | At-least-once |
| ACK | Only after successful Postgres load |
| Redis features | `XAUTOCLAIM` + `XREADGROUP` (Redis 6.2+; avoids 8.4-only CLAIM syntax) |

**Transform highlights:**

- Map flat stream strings → typed rows  
- Path-based token extraction (provider response shapes differ)  
- Cost = f(input/output/cached tokens × price fields on event)  
- Preserve attribution: provider, model, child key, tags, `metadata_json`, `user_email`

**Partitions:** daily range partitions on `log_date` for `event_log` / `request_log` (ensured by load/seed paths).

**Scale-out:** run N consumers with unique `REQUEST_LOG_CONSUMER_NAME`; Redis assigns pending/new entries across the group.

---

### 3.3 gateway-portal (control plane)

**Owns:**

- Drizzle schema + migrations for shared tables  
- User auth (Better Auth)  
- CRUD for providers, models, child keys  
- Analytics query layer over `event_log`  
- Workspace overview KPIs

**Server Actions pattern:** portal workflows prefer Server Actions; shared secrets match gateway-api for JWT + AES.

**Analytics query model:**

```
SELECT log_date, dimension_value, metric_aggregate
FROM event_log
WHERE log_date BETWEEN :from AND :to
  AND <filters>
GROUP BY log_date, dimension_value
```

Dimensions:

- Built-in columns: `provider`, `requested_model`, `user_email`  
- Dynamic: `COALESCE(metadata_json→>k, child_key_tags_json→>k)`  

Metrics: `count(*)`, `sum(total_token)`, `sum(cost)`.

UI: stacked bar (date × metric, stacked by dimension) + multi-select filters + user-email autocomplete.

---

## 4. Data model (logical)

Names follow the implemented Drizzle schema (snake_case columns in Postgres).

### Configuration

| Table | Purpose |
| ----- | ------- |
| `user` / `session` / `account` / `verification` | Better Auth |
| `llm_provider` | Name, `api_url`, encrypted master key, `compatibility_type`, `is_active`, `creator_id` |
| `model` | Name, alias, prices, `provider_id` |
| `child_key` | Name, encrypted JWT material, tags JSONB, `user_email`, `is_active`, expiry, `creator_id` |

### Telemetry

| Table | Purpose |
| ----- | ------- |
| `event_log` | Analytics-friendly request facts: routing, tokens, cost, tags, metadata, timings |
| `request_log` | Optional heavier payload capture (headers/bodies) partitioned by `log_date` |

**Key analytics fields on `event_log`:**  
`provider`, `requested_model`, `total_token`, `cost`, `child_key_*`, `user_email`, `metadata_json`, `child_key_tags_json`, `log_date`, `duration_ms`, `status_code`.

Indexes of note: `log_date`, GIN on JSONB path ops for tags/metadata.

---

## 5. End-to-end data flow

```
1. Operator configures provider + model + mints child key in portal
2. App calls POST /openai/v1/chat/completions with sk_… and model provider/alias
3. gateway-api authenticates, resolves upstream, proxies, returns response
4. gateway-api XADDs event to Redis Stream (async)
5. gateway-ingest claims message, transforms, inserts event_log (+ request_log)
6. portal overview / analytics SELECT aggregates from event_log
```

**Consistency:** configuration is strongly consistent (Postgres). Usage analytics are **eventually consistent** (seconds under normal load).

---

## 6. Caching strategy

| Cache | Key idea | Invalidation |
| ----- | -------- | ------------ |
| Child key auth | Avoid DB hit on every request | Portal mutate → Redis delete / pattern invalidate |
| Provider + model resolve | Hot routing path | Same; TTL as safety net |

Redis is optional for local proxy smoke tests but **required** for production logging + low-latency auth at scale.

---

## 7. Security architecture

| Concern | Control |
| ------- | ------- |
| Master keys at rest | AES-GCM via `API_ENCRYPT_KEY` |
| Child keys at rest | Ciphertext in DB; plaintext JWT shown once at create/rotate/reveal |
| Child keys in transit | TLS termination at edge; `Authorization: Bearer` |
| JWT integrity | `JWT_SIGNING_SECRET` shared by portal (mint) and api (verify) |
| Log PII | Capture level + always-redact secrets; prefer `metadata` in prod |
| Portal access | Better Auth sessions; workspace routes require session |
| Admin audit | Roadmap: structured audit table for sensitive mutations |

**Threat notes:**

- Compromised child key → revoke/disable in portal; master key remains sealed.  
- Compromised `API_ENCRYPT_KEY` → full secret re-encryption / rotation incident.  
- Stream consumers must be trusted (they see log fields, possibly bodies).

---

## 8. Scalability & reliability

| Concern | Approach |
| ------- | -------- |
| Proxy QPS | Stateless gateway replicas behind LB |
| Stream backpressure | Redis Stream length cap (`MAXLEN ~`); scale ingest consumers |
| Ingest lag | Horizontal consumers; reclaim idle PEL |
| Postgres growth | Daily partitions on `log_date`; retention jobs (ops) |
| Hot config reads | Redis cache |
| Gateway crash mid-request | Client retries; no partial XACK impact (log may be missing — acceptable) |
| Ingest crash mid-batch | Un-ACKed messages reclaimed after min-idle |

### Deployment sketch

```
[LB] → gateway-api × N
         │
      Redis · Postgres
         │
      gateway-ingest × M
         │
      gateway-portal × K  (or serverless/edge Next.js)
```

Secrets: env / Vault / cloud secret manager — never git.

---

## 9. Observability (platform)

| Layer | Recommendation |
| ----- | -------------- |
| Proxy logs | Structured request id + Hono logger |
| Ingest | Debug flag for token/cost summaries; future Prometheus counters |
| Portal | Server action errors; no silent metric fabrication |
| Metrics (future) | tokens/sec, p95 latency, stream lag, error rate, cost burn |
| Tracing (future) | OpenTelemetry from gateway → upstream |

---

## 10. Sequence diagrams

### Happy path completion

```
Client          Gateway-API        Upstream       Redis        Ingest       Postgres
  |                 |                 |             |            |             |
  |-- POST /openai->|                 |             |            |             |
  |                 |-- verify key -->|             |            |             |
  |                 |<-- ok ----------|             |            |             |
  |                 |-- chat req ---->|             |            |             |
  |                 |<-- stream/json -|             |            |             |
  |<-- response ----|                 |             |            |             |
  |                 |-- XADD -------->|------------>|            |             |
  |                 |                 |             |<- XREAD ---|             |
  |                 |                 |             |            |-- INSERT -->|
  |                 |                 |             |<-- XACK ---|             |
```

### Analytics read

```
Browser          Portal             Postgres
  |-- open /workspace/analytics -->|
  |                                |-- aggregate event_log -->|
  |                                |<-- series rows ---------|
  |<-- stacked chart + KPIs -------|
```

---

## 11. Module map (monorepo)

```
apps/
  gateway-api/
    src/child-keys/     auth middleware, JWT
    src/proxy/          openai / anthropic / upstream
    src/request-log/    capture + XADD
    src/providers/      resolve provider/model
  gateway-ingest/
    src/consumer/       Redis group read/claim/ack
    src/transform/      map + token paths + cost
    src/load/           inserts + partitions
  gateway-portal/
    app/workspace/      UI routes
    app/server-actions/ mutations & queries
    lib/analytics/      series aggregation
    lib/db/schema.ts    schema source of truth
```

---

## 12. Design decisions (ADRs, short form)

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Async logs via Redis Stream | vs sync Postgres insert | Protect p99 latency of completions |
| Separate ingest process | vs in-process queue | Independent scale, crash isolation |
| Child JWT `sk_…` | vs opaque random secrets only | Portable claims + rotate with stable id |
| Portal owns migrations | vs each service migrates | Single schema truth |
| Dual proxy prefixes `/openai` `/anthropic` | vs only `/v1` | Explicit compatibility; unified `/v1` later |
| Stacked analytics model | vs fixed charts | One engine for env/team/provider/model questions |
| Drizzle + Neon serverless driver | vs Prisma-only | Align monorepo TS stack; edge-friendly options |

---

## 13. Future architecture extensions

1. **Policy middleware** on gateway-api (allow-lists, rate limits, budgets) reading Redis-cached policy snapshots.  
2. **Dead-letter stream** for poison messages after N deliveries.  
3. **Object storage** for `full` capture bodies; Postgres stores pointers.  
4. **Materialized daily rollups** if raw `event_log` scans get expensive.  
5. **Multi-tenant orgs** — workspace isolation beyond single creator scope.  
6. **OpenAPI** published from gateway route inventory.

---

## 14. Related implementation docs

| Path | Content |
| ---- | ------- |
| `apps/gateway-api/README.md` | Proxy ops & curl |
| `apps/gateway-ingest/README.md` | Consumer env & ACK policy |
| `apps/gateway-portal/README.md` | Portal features & analytics UX |
| `apps/*/tasks/` | Work logs and historical design notes |

---

<p align="center">
  Designed for teams who need <strong>production LLM plumbing</strong> they can own and extend.<br />
  ★ Star the repo if this architecture helps you build with confidence.
</p>
