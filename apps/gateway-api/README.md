# Gateway API

### High-performance multi-provider LLM proxy

<p align="left">
  <img src="https://img.shields.io/badge/framework-Hono-orange" alt="Hono" />
  <img src="https://img.shields.io/badge/runtime-Cloudflare%20Workers-f38020?logo=cloudflare" alt="Cloudflare Workers" />
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
│  gateway-api (Hono · Workers · :8080)│
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

Requires [Bun](https://bun.sh) ≥ 1.1, Postgres, and (recommended) [Upstash Redis](https://upstash.com) (HTTP REST — required on Cloudflare Workers).

```bash
cd apps/gateway-api
bun install

# .env — share secrets with gateway-portal. wrangler dev loads this file:
#   DATABASE_URL=
#   JWT_SIGNING_SECRET=
#   API_ENCRYPT_KEY=
#   REDIS_URL=              # Upstash rediss:// URL; REST is derived from it

bun run dev                 # wrangler dev on http://localhost:8080
```

Open [http://localhost:8080](http://localhost:8080) · health at `/health`.

Non-secret settings live in `wrangler.jsonc` `vars`. Secret **names** are listed in `wrangler.jsonc` `secrets.required`; values stay in `.env` locally and in Cloudflare secrets when deployed.

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

Bindings are available as `c.env.<NAME>` (and `process.env` after request hydration).

### Secrets (`wrangler.jsonc` → `secrets.required`)

Set locally in `.env`. Set in production with `wrangler secret put <NAME>` — **do not** put values in `wrangler.jsonc`.

| Binding | Purpose |
| ------- | ------- |
| `DATABASE_URL` | Postgres (same as portal) |
| `JWT_SIGNING_SECRET` | Verify child key JWTs (must match portal, ≥ 32 chars) |
| `API_ENCRYPT_KEY` | Decrypt provider master keys (must match portal, ≥ 16 chars) |
| `REDIS_URL` | Upstash Redis TCP URL; Worker derives REST URL + token |

Optional instead of (or in addition to) `REDIS_URL`:

| Binding | Purpose |
| ------- | ------- |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

### Vars (`wrangler.jsonc` → `vars`)

| Binding | Default | Purpose |
| ------- | ------- | ------- |
| `REQUEST_BODY_LIMIT_BYTES` | `1048576` | Max proxy request body |
| `UPSTREAM_TIMEOUT_MS` | `120000` | Upstream fetch timeout |
| `CHILD_KEY_RATE_LIMIT_RPM` | `600` | Default child-key requests per minute (`0` disables) |
| `REQUEST_LOG_STREAM_MAXLEN` | `10000` | Approximate max stream length (`XADD MAXLEN ~`) |
| `GATEWAY_CORS_ORIGINS` | *(empty)* | Comma-separated CORS allowlist; empty disables CORS |

### Deploy secrets

```bash
cd apps/gateway-api
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put JWT_SIGNING_SECRET
bunx wrangler secret put API_ENCRYPT_KEY
bunx wrangler secret put REDIS_URL
bun run deploy
```

> Never commit `.env` / `.dev.vars` files or master keys.

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
├── wrangler.jsonc            # Worker name, vars, required secrets
├── src/
│   ├── index.ts              # App entry, routes (Worker fetch export)
│   ├── env.ts                # Binding types + process.env hydration
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
| `bun run dev` | `wrangler dev` (workerd, loads `.env`) |
| `bun run dev:bun` | Bun hot-reload (still uses `.env` via Bun) |
| `bun run deploy` | Deploy to Cloudflare Workers |
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
- Keep `REQUEST_LOG_STREAM_MAXLEN` modest in production (`vars` in `wrangler.jsonc`).  
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

Licensed under the [Apache License, Version 2.0](../../LICENSE) — same as the monorepo root.

---

<p align="center">
  <strong>One endpoint. Many providers. Your keys stay yours.</strong><br />
  ★ Star <a href="../../README.MD">Open LLM Gateway</a> to support open LLM infrastructure.
</p>
