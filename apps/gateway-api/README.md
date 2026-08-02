# Gateway API

### High-performance multi-provider LLM proxy

<p align="left">
  <img src="https://img.shields.io/badge/framework-Hono-orange" alt="Hono" />
  <img src="https://img.shields.io/badge/runtime-Bun-f472b6?logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/auth-child%20API%20keys-7624f4" alt="Auth" />
  <img src="https://img.shields.io/badge/streams-Redis-DC382D?logo=redis&logoColor=white" alt="Redis" />
</p>

**Gateway API** is the data plane of [Open LLM Gateway](../../README.MD): a Hono service that authenticates **child API keys**, routes `provider/alias` models to the right upstream, streams responses, and emits best-effort request logs to Redis — without ever giving clients your master provider keys.

> Drop-in OpenAI-compatible and Anthropic surfaces for teams that want **self-hosted** routing and governance.  
> ★ Star the [root repo](../../README.MD) if this saves you from re-implementing multi-vendor proxies again.

---

## Features

- **OpenAI-compatible proxy** — `POST /openai/*` (e.g. `/openai/v1/chat/completions`)
- **Anthropic Messages proxy** — `POST /anthropic/*` (e.g. `/anthropic/v1/messages`)
- **Model routing** — body `model: "provider/alias"` resolves credentials + upstream model id
- **Child key auth** — `Authorization: Bearer sk_<jwt>`; verified against Postgres (Redis-cached)
- **Streaming** — SSE pass-through; OpenAI chat can request usage on stream
- **Request logging** — async `XADD` to `llm-gateway-request-logs` (never fails the client response)
- **Health & discovery** — `GET /health`, `GET /` lists active model routes
- **Capture levels** — `metadata` · `redacted` · `full` for body retention policy

---

## Architecture (this service)

```
Client
  │  Bearer sk_…
  │  model: "deepseek/chat"
  ▼
┌──────────────────────────────────────┐
│  gateway-api (Hono · Bun · :8080)    │
│  1. request id                       │
│  2. child-key auth (+ Redis cache)   │
│  3. resolve provider + model (PG)    │
│  4. rewrite model → upstream id      │
│  5. forward with master API key      │
│  6. stream / JSON response           │
│  7. XADD request log (best-effort)   │
└──────────────────────────────────────┘
          │                    │
          ▼                    ▼
     Upstream LLM          Redis Stream
   (OpenAI / Anthropic      (→ gateway-ingest)
    compatible hosts)
```

Providers and models are managed in **gateway-portal**. This service only **reads** them for routing.

---

## Quick start

Requires [Bun](https://bun.sh) ≥ 1.1, Postgres, and (recommended) Redis.

```bash
cd apps/gateway-api
bun install

# .env — share secrets with gateway-portal:
#   DATABASE_URL=
#   JWT_SIGNING_SECRET=
#   API_ENCRYPT_KEY=
#   REDIS_URL=              # optional locally; required for logs + cache in prod
#   PORT=8080
#   REQUEST_LOG_CAPTURE_LEVEL=metadata

bun run dev
```

Open [http://localhost:8080](http://localhost:8080) · health at `/health`.

### Call examples

```bash
# Health
curl -s http://localhost:8080/health

# OpenAI-compatible chat completions
curl -s http://localhost:8080/openai/v1/chat/completions \
  -H "Authorization: Bearer sk_YOUR_CHILD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/your-model-alias",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello from Open LLM Gateway"}
    ],
    "stream": false
  }'

# Streaming
curl -N http://localhost:8080/openai/v1/chat/completions \
  -H "Authorization: Bearer sk_YOUR_CHILD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/your-model-alias",
    "messages": [{"role": "user", "content": "Stream a short haiku"}],
    "stream": true,
    "stream_options": { "include_usage": true }
  }'

# Anthropic Messages
curl -s http://localhost:8080/anthropic/v1/messages \
  -H "Authorization: Bearer sk_YOUR_CHILD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/your-model-alias",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Model format:** `providerName/modelAlias`  
`providerName` must match a portal provider; `modelAlias` maps to the upstream model id.

Optional client `metadata` is stripped before the upstream call and stored on the request log for analytics filters.

---

## Environment

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DATABASE_URL` | — | Postgres (same as portal) |
| `JWT_SIGNING_SECRET` | — | Verify child key JWTs (must match portal) |
| `API_ENCRYPT_KEY` | — | Decrypt provider master keys (must match portal) |
| `REDIS_URL` | — | Auth/model cache + request-log stream |
| `PORT` | `8080` | HTTP listen port |
| `REQUEST_LOG_CAPTURE_LEVEL` | `metadata` | `metadata` \| `redacted` \| `full` |
| `REQUEST_LOG_STREAM_MAXLEN` | `10000` | Approximate max stream length (`XADD MAXLEN ~`) |

> Never commit `.env` files or master keys.

---

## HTTP surface

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/` | no | Service info + active model routes |
| `GET` | `/health` | no | Liveness |
| `POST` | `/openai/*` | child key | OpenAI-compatible upstream proxy |
| `POST` | `/anthropic/*` | child key | Anthropic Messages upstream proxy |

---

## How routing works

1. Middleware validates the **child key** (DB + optional Redis cache).  
2. Body `model` is parsed as `provider/alias`.  
3. Creator-scoped provider + model rows are loaded.  
4. Request is rewritten (`model` → upstream name) and sent with the **decrypted master** key.  
5. Response is returned; a request-log event is emitted to Redis asynchronously.

```
POST /openai/v1/chat/completions
Authorization: Bearer sk_…
{ "model": "deepseek/chat", ... }
        │
        ▼
 resolve provider "deepseek" + alias "chat"
        │
        ▼
 POST https://api.deepseek.com/v1/chat/completions
 Authorization: Bearer <master key>
 { "model": "<upstream model id>", ... }
```

---

## Request logging

Stream: **`llm-gateway-request-logs`**

Emission is **best-effort** — Redis errors never change the HTTP status returned to the client.

| Capture level | Bodies |
| ------------- | ------ |
| `metadata` (default) | No payloads; routing, status, timings, ids |
| `redacted` | Truncated payloads |
| `full` | Full bodies (trusted / dev only) |

Always redacted: `Authorization`, provider API keys, child secrets, encrypted material.

Downstream consumer: [`gateway-ingest`](../gateway-ingest).

---

## Project structure

```
apps/gateway-api/
├── src/
│   ├── index.ts              # App entry, routes
│   ├── child-keys/           # Auth middleware + JWT verify
│   ├── proxy/                # OpenAI / Anthropic / upstream handlers
│   ├── payload/              # Body rewrite helpers
│   ├── providers/            # Model/provider resolution
│   ├── request-log/          # Capture + Redis XADD
│   ├── lib/                  # db, redis, crypto
│   └── db/schema.ts          # Shared Drizzle tables (read path)
├── scripts/                  # Bulk / manual proxy tests
└── tests/                    # Unit + optional live tests
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `bun run dev` | Hot-reload proxy |
| `bun run start` | Production-style start |
| `bun run build` | Typecheck |
| `bun test` | Unit tests (excludes `*.live.test.ts`) |
| `bun run test:openai-chat` | Live OpenAI path smoke tests |
| `bun run test:anthropic-messages` | Live Anthropic path smoke tests |

```bash
# Bulk / scripted checks
bun run scripts/bulk-proxy-test.ts
```

---

## Testing tips

- Unit tests cover payload transforms, auth helpers, Redis key shapes, and proxy unit paths.  
- Live tests need real upstream credentials and a configured portal provider/model/child key.  
- Prefer failing closed on auth; prefer failing open on logging.

---

## Security

- Master keys decrypted only in-process for the upstream hop.  
- Child keys are JWTs (`sk_` prefix); rotate via portal.  
- Use `REQUEST_LOG_CAPTURE_LEVEL=metadata` in production.  
- Share `JWT_SIGNING_SECRET` and `API_ENCRYPT_KEY` only with portal (and secrets manager).

---

## Related

| Package | Role |
| ------- | ---- |
| [`gateway-portal`](../gateway-portal) | Configure providers, models, keys, analytics |
| [`gateway-ingest`](../gateway-ingest) | Persist stream events to Postgres |
| [Root README](../../README.MD) | Full-stack quick start |
| [`SYSTEM_DESIGN.MD`](../../SYSTEM_DESIGN.MD) | Broader architecture |

---

## Contributing

High-impact areas:

- Additional OpenAI-compatible paths (embeddings, responses, etc.)  
- Provider-specific quirks and fallbacks  
- Rate limiting / budget middleware  
- Stronger cache invalidation tests  

Please keep the proxy hot path lean and logging non-blocking.

---

## License

Same as the monorepo root (license TBD until SPDX file is added).

---

<p align="center">
  <strong>One endpoint. Many providers. Your keys stay yours.</strong><br />
  ★ Star <a href="../../README.MD">Open LLM Gateway</a> to support open LLM infrastructure.
</p>
