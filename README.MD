# Open LLM Gateway

**Open-source control plane for multi-provider LLM access.**

Open LLM Gateway sits between your applications and upstream model providers (OpenAI-compatible APIs, Anthropic Messages, and more). It gives you a single place to manage credentials, issue scoped child API keys, route by model alias, and capture request/response telemetry—without shipping master provider keys to every service or teammate.

```
Clients / apps
      │  Bearer sk_<child_api_key>
      ▼
┌─────────────────────┐
│  gateway-api        │  Hono proxy (OpenAI + Anthropic surfaces)
│  :8080              │
└─────────┬───────────┘
          │ async XADD
          ▼
   Redis Streams          Redis cache (auth, model resolution)
          │
          ▼ (planned)
   Ingest worker → PostgreSQL
          ▲
┌─────────┴───────────┐
│  gateway-portal     │  Next.js admin UI
│  :3000              │  providers · models · child keys
└─────────────────────┘
```

---

## Why this exists

Teams using multiple LLM vendors usually hit the same problems:

| Pain                                  | How LLM Gateway helps                                                  |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Master keys scattered across services | Store encrypted provider keys once; issue **child keys** to apps/teams |
| Different SDKs and base URLs          | Unified **OpenAI-compatible** and **Anthropic** proxy paths            |
| No cost or usage ownership            | Model aliases, tags on keys, request logs with latency and attribution |
| Hard to audit what went upstream      | Best-effort Redis Stream logs (request + response, capture levels)     |

If you want something between a raw reverse proxy and a full SaaS gateway (OpenRouter / Helicone-style control), this is the self-hosted middle ground.

---

## Features (current)

### Gateway API (`apps/gateway-api`)

- **OpenAI-compatible proxy** — `POST /openai/*` (e.g. `/openai/v1/chat/completions`)
- **Anthropic Messages proxy** — `POST /anthropic/*` (e.g. `/anthropic/v1/messages`)
- **Model routing** — client sends `model: "provider/alias"`; gateway resolves upstream credentials and model name from Postgres
- **Child API key auth** — `Authorization: Bearer sk_<jwt>`; keys minted in the portal, verified against the DB (with Redis cache)
- **Streaming** — pass-through SSE with usage-friendly options on OpenAI chat completions when `stream: true`
- **Request logging** — after each proxied call, best-effort `XADD` to Redis Stream `llm-gateway-request-logs` with:
  - routing / child-key identity
  - timings (`duration_ms`, `first_token_ms` for streams)
  - status, errors, response id
  - optional bodies gated by capture level (`metadata` \| `redacted` \| `full`)
- **Health** — `GET /health`, `GET /` (lists active model routes)

### Portal (`apps/gateway-portal`)

- **Better Auth** sign-in / sign-up
- **LLM providers** — base URL, encrypted master API key, compatibility type (`openai` \| `anthropic`)
- **Models** — upstream name, gateway alias, pricing metadata
- **Child keys** — create / rotate / manage keys and tags for downstream consumers

### Roadmap (designed, not all shipped)

- Redis Stream **ingest worker** → Postgres log tables
- Per-key rate limits, budgets, and policy middleware
- Usage / cost analytics dashboards in the portal
- Unified `/v1` surface and broader provider coverage

See [`PROJECT.MD`](./PROJECT.MD) and [`SYSTEM_DESIGN.MD`](./SYSTEM_DESIGN.MD) for product vision and architecture notes.

---

## Repository layout

```
llm-gateway/
├── apps/
│   ├── gateway-api/      # Hono proxy service (port 8080)
│   ├── gateway-portal/   # Next.js admin portal (port 3000)
│   └── redis/            # Local Redis helpers (optional)
├── PROJECT.MD            # Product vision
├── SYSTEM_DESIGN.MD      # Target architecture
└── README.MD             # You are here
```

Each app has its own `package.json`, Drizzle schema, and tests.

---

## Quick start

### Prerequisites

- **Node.js** 20+ (22+ recommended)
- **PostgreSQL** (e.g. Neon, local Postgres, or Docker)
- **Redis** (optional for local dev, required for cache + request-log streams in production)

### 1. Portal (control plane)

```bash
cd apps/gateway-portal
cp .env.example .env   # if present; otherwise create .env (see Environment)
npm install
# Schema already applied via historical migrations under prisma/migrations
# For new schema changes: npm run db:generate && npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, then:

1. Add an **LLM provider** (API URL + master key, OpenAI or Anthropic compatibility).
2. Add **models** (upstream name + alias used by clients).
3. Create a **child API key** and copy the plain `sk_…` secret (shown once).

### 2. Gateway API (proxy)

```bash
cd apps/gateway-api
cp .env.example .env   # if present; otherwise create .env (see Environment)
npm install
npm run dev
```

Proxy listens on [http://localhost:8080](http://localhost:8080) by default.

### 3. Call the proxy

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
      {"role": "user", "content": "Hello from LLM Gateway"}
    ],
    "stream": false
  }'

# Anthropic Messages
curl -s http://localhost:8080/anthropic/v1/messages \
  -H "Authorization: Bearer sk_YOUR_CHILD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax/your-model-alias",
    "max_tokens": 256,
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**Model string format:** `providerName/modelAlias`  
The provider name must match a row in the portal; the alias maps to the upstream model id.

Optional client `metadata` is stripped before the upstream call and stored on the request log.

---

## Environment

Share the same crypto secrets between portal and gateway so child keys and provider keys decrypt correctly.

### Shared

| Variable             | Purpose                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Postgres connection string (Neon / Drizzle)                                           |
| `JWT_SIGNING_SECRET` | Signs / verifies child API key JWTs                                                   |
| `API_ENCRYPT_KEY`    | AES key for encrypting provider keys and stored child-key ciphertext                  |
| `REDIS_URL`          | Redis for cache + request-log stream (omit to skip Redis; logs will not be published) |

### Gateway API

| Variable                    | Default    | Purpose                                                                                  |
| --------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `PORT`                      | `8080`     | HTTP listen port                                                                         |
| `REQUEST_LOG_CAPTURE_LEVEL` | `metadata` | `metadata` \| `redacted` \| `full` — how much request/response body to put on the stream |
| `REQUEST_LOG_STREAM_MAXLEN` | `10000`    | Max entries kept in the request-log Redis Stream (uses `XADD MAXLEN ~ <n>` when `> 0`)  |

### Portal

| Variable                      | Purpose                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Better Auth / email vars      | Sign-in, verification email (see portal docs under `apps/gateway-portal/docs/`) |
| `EMAIL_FROM`, `AWS_REGION`, … | Optional SES email delivery                                                     |

> **Security:** Never commit `.env` files. Use the plain `sk_…` child key only on the client; the DB stores ciphertext only.

---

## How routing works

1. Client authenticates with a **child key**.
2. Body includes `model: "provider/alias"`.
3. Gateway loads the creator-scoped provider + model from Postgres (Redis-cached).
4. Request is rewritten (`model` → upstream name) and forwarded with the **master** provider API key.
5. Response is returned to the client; a request-log event is emitted asynchronously to Redis.

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
 Authorization: Bearer <encrypted master key>
 { "model": "<upstream model id>", ... }
```

---

## Request logging

Stream name: **`llm-gateway-request-logs`**

Emission is **best-effort**: Redis failures never change the HTTP status returned to the client.

Capture levels:

| Level                | Bodies                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `metadata` (default) | No request/response payloads; headers metadata, routing, status, timings, ids |
| `redacted`           | Truncated payloads                                                            |
| `full`               | Full bodies (use only in trusted / dev environments)                          |

Always redacted: `Authorization`, provider API keys, child key secrets, encrypted key material.

For the full field list, see [`apps/gateway-api/tasks/ai/022-proxy-redis-stream-log-schema.md`](./apps/gateway-api/tasks/ai/022-proxy-redis-stream-log-schema.md).

---

## Development

```bash
# Gateway API
cd apps/gateway-api
npm test
npm run build

# Live proxy smoke tests (require env + real keys)
npm run test:openai-chat
npm run test:anthropic-messages

# Manual scripts
npx tsx scripts/openai/chat-completion/test-non-stream.ts
npx tsx scripts/openai/chat-completion/test-stream.ts
npx tsx scripts/anthropic/messages/test-non-stream.ts
npx tsx scripts/anthropic/messages/test-stream.ts

# Portal
cd apps/gateway-portal
npm test
npm run lint
npm run build
```

Work on a feature? Meaningful changes are logged under each app’s `tasks/ai/` or `tasks/human/` folders (see `AGENTS.MD`).

---

## Tech stack

| Layer  | Stack                                                          |
| ------ | -------------------------------------------------------------- |
| Proxy  | [Hono](https://hono.dev), Node.js, TypeScript, ioredis         |
| Portal | Next.js (App Router), Better Auth, shadcn/ui, Tailwind         |
| Data   | PostgreSQL via Drizzle, Redis (cache + streams)                |
| Crypto | `jose` (child key JWT), AES-GCM (provider / child key at rest) |

---

## Contributing

1. Fork and create a feature branch.
2. Prefer small, focused PRs with tests for behavior changes (auth, routing, payload transform, logging).
3. Run the relevant app’s `npm test` (and `tsc` / `lint` where applicable) before opening a PR.
4. Do not commit secrets, live API keys, or production `.env` files.

Issues and discussions are welcome for bugs, provider support, and roadmap prioritization.

---

## Security

- Master provider keys are **encrypted at rest** and never returned to proxy clients.
- Child keys presented on the wire are **plain `sk_…` JWTs**; only ciphertext is stored in the database.
- Prefer `REQUEST_LOG_CAPTURE_LEVEL=metadata` in production unless you have a clear need and retention policy for bodies.
- Rotate `JWT_SIGNING_SECRET` / `API_ENCRYPT_KEY` carefully—rotation invalidates or re-encrypts existing material.

If you discover a vulnerability, please report it privately to the maintainers rather than opening a public issue with exploit details.

---

## License

License TBD — add an SPDX license file (e.g. MIT or Apache-2.0) before a public release.

---

## Related docs

- [`PROJECT.MD`](./PROJECT.MD) — product vision and personas
- [`SYSTEM_DESIGN.MD`](./SYSTEM_DESIGN.MD) — target multi-service architecture
- [`apps/gateway-api/`](./apps/gateway-api/) — proxy service
- [`apps/gateway-portal/`](./apps/gateway-portal/) — admin portal

---

**LLM Gateway** — one gateway, many providers, governed keys, observable traffic.
