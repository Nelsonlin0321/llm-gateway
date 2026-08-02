# Open LLM Gateway — Product Vision

**Self-hosted control plane for multi-provider LLM access.**

One gateway. Many providers. Governed keys. Observable spend.

---

## One-liner

Open LLM Gateway is an open-source platform that sits between your applications and upstream model providers. It centralizes credentials, issues scoped child API keys, routes traffic by model alias, and turns every request into durable usage analytics — without shipping master API keys to every teammate or microservice.

---

## Problem

Teams adopting multiple LLM vendors hit the same walls:

| Problem | Impact |
| ------- | ------ |
| Master keys copied into services, CI, and chat threads | Security incidents, painful rotation |
| Different base URLs, auth headers, and SDKs per vendor | Slow integration, inconsistent tooling |
| No shared view of tokens, cost, or ownership | Surprise bills, no FinOps story |
| Logging bolted on after the fact | Incomplete audit trail, high proxy latency |
| SaaS gateways that own your traffic and data | Lock-in, data residency constraints |

Raw reverse proxies solve connectivity but not **governance**. Full SaaS gateways solve dashboards but not **ownership**. Open LLM Gateway targets the self-hosted middle ground.

---

## Solution

A three-service monorepo that separates the **hot path** from **telemetry** and **control**:

| Service | Job |
| ------- | --- |
| **gateway-api** | Authenticate child keys, route `provider/alias`, proxy OpenAI + Anthropic surfaces, emit async logs |
| **gateway-ingest** | Consume Redis Streams, compute tokens/cost, load Postgres |
| **gateway-portal** | Admin UI: providers, models, child keys, analytics, workspace overview |

Clients keep using familiar OpenAI-style or Anthropic-style HTTP APIs. Operators keep master keys encrypted in one place. Finance and eng leadership get honest spend and usage by dimension.

---

## Personas

| Persona | Goals |
| ------- | ----- |
| **Platform / AI infra eng** | One endpoint, multi-provider routing, safe key distribution |
| **App / product eng** | Drop-in proxy URL + child key; no master secrets in app env |
| **Team lead** | Tag keys by team/env/project; see who spends what |
| **FinOps / leadership** | Token and cost trends, attribution, budget readiness |
| **Security / compliance** | Encrypted secrets, audit of admin actions, capture levels for payloads |
| **Open-source adopter** | Self-host, extend providers, contribute without a sales call |

---

## Core product pillars

### 1. Unified multi-provider proxy

- OpenAI-compatible surface: `POST /openai/*`
- Anthropic Messages surface: `POST /anthropic/*`
- Model routing via `provider/alias` (e.g. `deepseek/chat`, `openai/gpt-4.1-mini`)
- Streaming pass-through (SSE) with usage-friendly options where supported
- Provider registry stores base URL, compatibility type, and encrypted master key

### 2. Hierarchical key model

| Concept | Meaning in this project |
| ------- | ----------------------- |
| **Provider credential** | Master upstream key + API URL (encrypted at rest) |
| **Child API key** | Downstream `sk_…` JWT issued to a user/app/team; never stores master secrets |
| **Tags / metadata** | Free-form labels (env, team, project, application) for attribution |

Lifecycle: create → reveal once → rotate (stable key id for analytics) → disable → delete.

### 3. Observable traffic without slowing chat

- Gateway emits best-effort Redis Stream events **after** the client response path
- Ingest transforms usage, prices, and attribution into Postgres
- Capture levels: `metadata` · `redacted` · `full` (bodies never required for cost math)

### 4. Analytics that operators actually use

Three controls define every chart:

| Control | Role | Examples |
| ------- | ---- | -------- |
| **Metric** | Y-axis | request count, total tokens, cost |
| **Dimension** | Stack segments | provider, model, env, team, metadata fields |
| **Filter** | Scope | multi-select tags + user-email autocomplete + date range |

Workspace overview surfaces the same series for spend-by-provider, requests-by-env, and tokens-by-model.

### 5. Self-hosted by default

- Your Postgres, your Redis, your VPC
- No mandatory cloud vendor for the control plane
- Schema owned by the portal app; services share typed Drizzle models

---

## What ships today (MVP reality)

Honest status — not a vaporware list.

| Capability | Status |
| ---------- | ------ |
| OpenAI + Anthropic proxy paths | **Shipped** |
| Child key auth (JWT `sk_…`) | **Shipped** |
| Provider + model admin UI | **Shipped** |
| Child key create / rotate / reveal / tags | **Shipped** |
| Redis Stream request logging | **Shipped** |
| Ingest worker → `event_log` / `request_log` | **Shipped** |
| Token + cost calculation on ingest | **Shipped** |
| Analytics dashboard (metric × dimension × filters) | **Shipped** |
| Workspace overview with live usage panels | **Shipped** |
| Better Auth portal login | **Shipped** |
| Per-key rate limits / hard budgets | Roadmap |
| Guardrails / model allow-lists middleware | Roadmap |
| Unified single `/v1` OpenAI surface | Roadmap |
| Full log explorer UI | Roadmap |
| RBAC multi-tenant orgs | Roadmap |
| Terraform provider / public REST admin API | Roadmap |

---

## Competitive landscape (positioning)

| Option | Strength | Gap we address |
| ------ | -------- | -------------- |
| **LiteLLM** | Broad provider adapters | We emphasize child-key governance + portal analytics as first-class product |
| **OpenRouter** | Hosted multi-model marketplace | We are self-hosted; you keep keys and logs |
| **Helicone / Langfuse-style** | Observability UX | We combine **proxy + keys + cost** in one monorepo |
| **Raw nginx / custom proxy** | Simple | No key hierarchy, pricing, or dimensional analytics |

Open LLM Gateway is for teams who want **control-plane UX + data-plane proxy + durable telemetry** under one roof, open source.

---

## Success metrics

| Metric | Target signal |
| ------ | ------------- |
| Master key exposure | Near-zero master keys outside the portal vault |
| Traffic centralization | Majority of org LLM calls through the gateway |
| FinOps clarity | Cost & tokens attributable by team/env/app |
| Operator time | Provider + key onboarding in minutes, not days |
| Community | Stars, issues, and PRs that extend providers and policies |

---

## Product principles

1. **Hot path stays hot** — never block completions on analytics writes.  
2. **Honest empty states** — no fabricated dashboard numbers.  
3. **Secrets stay server-side** — encrypt at rest; reveal child secrets once.  
4. **Dimensions over dashboards** — one flexible analytics model beats ten hardcoded charts.  
5. **Ship the boring backbone** — routing, keys, logs, cost before exotic agent features.  
6. **Open by default** — readable code, documented architecture, contribution-friendly modules.

---

## Non-goals (near term)

- Replacing full observability platforms (Datadog, full ELK)
- Being a model marketplace or hosting GPUs
- Guaranteeing byte-identical behavior for every proprietary provider quirk on day one
- Multi-region active-active in the first public release

---

## Roadmap themes

### Near term
- Rate limits and spend budgets on child keys  
- Policy / guardrails middleware (allow-lists, basic privacy controls)  
- Analytics URL state (shareable views) + top-N “Other” segment caps  

### Medium term
- Unified `/v1` OpenAI surface  
- Log explorer with search over `request_log`  
- Audit log for admin actions  
- More provider token-path coverage  

### Longer term
- Org/team RBAC  
- Fallbacks and weighted routing  
- Webhooks (budget exceeded, anomaly)  
- Optional object storage for full payloads  

Architecture detail: [`SYSTEM_DESIGN.MD`](./SYSTEM_DESIGN.MD)  
User-facing setup: [`README.MD`](./README.MD)

---

## Out of scope for this document

Implementation tickets live under each app’s `tasks/` folders. This file is the **product north star** for contributors, users, and stargazers — not a sprint backlog.

---

<p align="center">
  <strong>Open LLM Gateway</strong> — govern multi-provider LLM access without giving up your data.<br />
  If this product vision matches a problem you have, ★ star the repo and open an issue with your use case.
</p>
