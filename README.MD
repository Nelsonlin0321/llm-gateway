# Open LLM Gateway

### Self-hosted control plane for multi-provider LLM access

<p align="center">
  <strong>One gateway. Many providers. Governed keys. Real cost analytics.</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="apps/gateway-api"><img src="https://img.shields.io/badge/proxy-Hono%20%2B%20Bun-orange" alt="Hono" /></a>
  <a href="apps/gateway-portal"><img src="https://img.shields.io/badge/portal-Next.js-black?logo=next.js" alt="Next.js" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License" /></a>
  <a href="#contributing"><img src="https://img.shields.io/badge/PRs-welcome-ff69b4" alt="PRs welcome" /></a>
</p>

Open LLM Gateway sits between your applications and upstream model providers. It gives you a **single place** to manage credentials, issue scoped child API keys, route by model alias, stream request telemetry, and explore spend — without shipping master provider keys to every teammate or microservice.

> **Star this repo** if you care about self-hosted LLM governance, multi-provider routing, and honest usage analytics. Stars help others discover the project.

---

## Why teams use this

| Pain | Open LLM Gateway |
| ---- | ---------------- |
| Master API keys scattered across services | Encrypt master keys once; issue **child keys** to apps & teams |
| Different SDKs / base URLs per vendor | Unified **OpenAI-compatible** + **Anthropic** proxy surfaces |
| No ownership of tokens or cost | Model pricing, key tags, and **stacked analytics** by env / team / provider |
| Hard to audit what went upstream | Async Redis Stream logs → Postgres `event_log` with tokens & cost |
| SaaS gateways lock you in | **Self-hosted**, open source, your data stays in your VPC |

If you want something between a raw reverse proxy and a full SaaS gateway (OpenRouter / Helicone-style control), this is the open middle ground.

---

## Features

### Gateway API — high-performance proxy
- OpenAI-compatible routes: `POST /openai/*`
- Anthropic Messages routes: `POST /anthropic/*`
- Model routing via `provider/alias` (e.g. `deepseek/chat`)
- Child key auth: `Authorization: Bearer sk_…`
- Streaming SSE pass-through with usage-friendly options
- Best-effort Redis Stream request logs (never blocks the client)

### Portal — admin control plane
- Better Auth (sign-up / sign-in)
- Provider management (encrypted master keys, OpenAI or Anthropic compatibility)
- Model registry with pricing metadata
- Child key lifecycle (create, rotate, reveal, tags)
- **Live analytics dashboard** — stacked bars by day, metric × dimension × filters
- Workspace overview with real spend / requests / tokens

### Ingest worker — durable telemetry
- Redis Stream consumer group (`XAUTOCLAIM` + `XREADGROUP`)
- Transform → token/cost calculation → Postgres load
- Daily partitions for `event_log` / `request_log`
- Mock seed scripts for local analytics demos

---

## Architecture

```
   Apps / SDKs / curl
           │  Bearer sk_<child_key>
           ▼
   ┌───────────────────┐
   │   gateway-api     │  Hono · Bun
   │   :8080           │  OpenAI + Anthropic proxy
   └─────────┬─────────┘
             │ XADD (async)
             ▼
        Redis Streams  ·  Redis cache (auth / model resolve)
             │
             │ consumer group
             ▼
   ┌───────────────────┐
   │  gateway-ingest   │  transform · cost · load
   └─────────┬─────────┘
             ▼
         PostgreSQL
      event_log · request_log
             ▲
   ┌─────────┴─────────┐
   │  gateway-portal   │  Next.js · Drizzle · Better Auth
   │  :3000            │  providers · keys · analytics
   └───────────────────┘
```

| App | Role | Port | Runtime |
| --- | ---- | ---- | ------- |
| [`gateway-api`](./apps/gateway-api) | LLM proxy | `8080` | Bun + Hono |
| [`gateway-portal`](./apps/gateway-portal) | Admin UI + schema owner | `3000` | Next.js |
| [`gateway-ingest`](./apps/gateway-ingest) | Stream → Postgres | — | Bun |

---

## Quick start

### Prerequisites

- **Node.js** 20+ (portal) and/or **[Bun](https://bun.sh)** ≥ 1.1 (api + ingest)
- **PostgreSQL** (Neon, local, or Docker)
- **Redis** (cache + request-log stream; strongly recommended)

### 1. Portal (control plane)

```bash
cd apps/gateway-portal
npm install
# Configure DATABASE_URL, JWT_SIGNING_SECRET, API_ENCRYPT_KEY, auth secrets
npm run db:migrate   # if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign up → add a **provider** → register **models** → create a **child API key**.

### 2. Gateway API (proxy)

```bash
cd apps/gateway-api
bun install
# Same DATABASE_URL, JWT_SIGNING_SECRET, API_ENCRYPT_KEY, REDIS_URL
bun run dev
```

Proxy: [http://localhost:8080](http://localhost:8080)

### 3. Ingest (telemetry)

```bash
cd apps/gateway-ingest
bun install
# REDIS_URL + DATABASE_URL
bun run dev
```

Optional demo data for analytics:

```bash
bun run seed:event-log
```

### 4. Call the gateway

```bash
curl -s http://localhost:8080/health

curl -s http://localhost:8080/openai/v1/chat/completions \
  -H "Authorization: Bearer sk_YOUR_CHILD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/your-model-alias",
    "messages": [{"role": "user", "content": "Hello from Open LLM Gateway"}],
    "stream": false
  }'
```

**Model string format:** `providerName/modelAlias`  
Provider name matches the portal row; alias maps to the upstream model id.

---

## Environment (shared secrets)

Share crypto secrets between **portal** and **gateway-api** so child keys and provider keys decrypt correctly.

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres (Neon / Drizzle) |
| `JWT_SIGNING_SECRET` | Signs / verifies child API key JWTs |
| `API_ENCRYPT_KEY` | AES key for provider + child-key ciphertext |
| `REDIS_URL` | Cache + request-log stream |

Gateway-only: `PORT` (default `8080`), `REQUEST_LOG_CAPTURE_LEVEL` (`metadata` \| `redacted` \| `full`).

> Never commit `.env` files. Treat `sk_…` child keys like passwords.

---

## How routing works

```
POST /openai/v1/chat/completions
Authorization: Bearer sk_…
{ "model": "deepseek/chat", ... }
        │
        ▼
 resolve provider "deepseek" + alias "chat"  (Postgres + Redis cache)
        │
        ▼
 POST https://api.deepseek.com/v1/chat/completions
 Authorization: Bearer <decrypted master key>
 { "model": "<upstream model id>", ... }
```

1. Client authenticates with a **child key**.
2. Body includes `model: "provider/alias"`.
3. Gateway resolves creator-scoped provider + model.
4. Request is rewritten and forwarded with the **master** provider key.
5. Response returns to the client; a log event is emitted to Redis (best-effort).

---

## Analytics at a glance

The portal analytics surface is built for real operations teams:

| Control | What it does |
| ------- | ------------ |
| **Metric** | Y-axis: request count · total tokens · cost |
| **Dimension** | Stack segments: provider · model · env · team · metadata fields |
| **Filters** | Multi-select dropdowns + user-email autocomplete |
| **Date range** | Last 7 / 30 days or custom |

Workspace overview cards reuse the same query layer for spend-by-provider, requests-by-env, and tokens-by-model.

---

## Repository layout

```
llm-gateway/
├── apps/
│   ├── gateway-api/       # Hono proxy (Bun)
│   ├── gateway-portal/    # Next.js admin + analytics
│   ├── gateway-ingest/    # Redis Stream → Postgres worker
│   └── redis/             # Local Redis helpers
├── PROJECT.MD             # Product vision
├── SYSTEM_DESIGN.MD       # Target architecture
└── README.MD              # You are here
```

Each app has its own `package.json`, tests, and `tasks/` work logs.

---

## Development

```bash
# API
cd apps/gateway-api && bun test && bun run build

# Portal
cd apps/gateway-portal && npm test && npm run lint && npm run build

# Ingest
cd apps/gateway-ingest && bun test && bun run build
```

Live proxy smoke tests (need real upstream keys):

```bash
cd apps/gateway-api
bun run test:openai-chat
bun run test:anthropic-messages
```

---

## Tech stack

| Layer | Stack |
| ----- | ----- |
| Proxy | [Hono](https://hono.dev), [Bun](https://bun.sh), TypeScript, ioredis |
| Portal | Next.js App Router, Better Auth, shadcn/ui, Tailwind, Drizzle |
| Ingest | Bun, Redis Streams, Drizzle, Postgres partitions |
| Data | PostgreSQL · Redis (cache + streams) |
| Crypto | `jose` (JWT child keys) · AES-GCM at rest |

---

## Roadmap

- [x] Multi-provider proxy (OpenAI + Anthropic surfaces)
- [x] Encrypted providers + child keys
- [x] Redis Stream logging + ingest worker
- [x] Cost / token analytics dashboard
- [ ] Per-key rate limits & budgets
- [ ] Policy / guardrails middleware
- [ ] Unified `/v1` OpenAI surface
- [ ] Broader provider coverage & fallbacks

See [`PROJECT.MD`](./PROJECT.MD) and [`SYSTEM_DESIGN.MD`](./SYSTEM_DESIGN.MD) for the full vision.

---

## Contributing

Contributions make this project better for everyone.

1. **Star** the repo (seriously — it helps discovery).
2. Fork → feature branch → focused PR.
3. Add tests for auth, routing, payload transforms, and logging changes.
4. Run the app’s test suite before opening a PR.
5. Never commit secrets, live keys, or production env files.

Bug reports, provider requests, and design discussions are all welcome.

---

## Security

- Master provider keys are **encrypted at rest** and never returned to proxy clients.
- Child keys on the wire are plain `sk_…` JWTs; the DB stores **ciphertext only**.
- Prefer `REQUEST_LOG_CAPTURE_LEVEL=metadata` in production.
- Rotate `JWT_SIGNING_SECRET` / `API_ENCRYPT_KEY` carefully.

Found a vulnerability? Report it privately to the maintainers — please do not open a public issue with exploit details.

---

## License

This project is licensed under the [Apache License, Version 2.0](./LICENSE).

```text
Copyright 2026 Open LLM Gateway contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## Docs

| Doc | Description |
| --- | ----------- |
| [`apps/gateway-api`](./apps/gateway-api) | Proxy service README |
| [`apps/gateway-portal`](./apps/gateway-portal) | Admin portal README |
| [`apps/gateway-ingest`](./apps/gateway-ingest) | Ingest worker README |
| [`PROJECT.MD`](./PROJECT.MD) | Product vision |
| [`SYSTEM_DESIGN.MD`](./SYSTEM_DESIGN.MD) | Architecture notes |

---

<p align="center">
  <strong>Open LLM Gateway</strong> — one gateway, many providers, governed keys, observable spend.<br />
  If this saves you a weekend of plumbing multi-provider LLM access, please <strong>★ star the repo</strong>.
</p>
