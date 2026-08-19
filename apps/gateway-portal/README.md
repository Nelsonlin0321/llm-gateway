# Gateway Portal

### Self-service control plane for Open LLM Gateway

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Auth-Better%20Auth-7624f4" alt="Better Auth" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-C5F74F" alt="Drizzle" />
  <img src="https://img.shields.io/badge/UI-shadcn%20%2B%20Tailwind-06B6D4" alt="UI" />
</p>

**Gateway Portal** is the admin UI and schema owner for [Open LLM Gateway](../../README.MD). Platform teams use it to register upstream providers, price models, issue scoped child API keys, and explore **live usage analytics** — without exposing master API keys to every developer.

> Part of the Open LLM Gateway monorepo. If you find this useful, **★ star the root repo** — it helps the project grow.

---

## What you can do

| Area | Capabilities |
| ---- | ------------ |
| **Providers** | Master API URL, encrypted API key, OpenAI or Anthropic compatibility |
| **Models** | Upstream name, gateway alias, input/output/cache pricing |
| **Child keys** | Create, rotate, reveal, tag, enable/disable, expire |
| **Analytics** | Stacked bar charts: metric × dimension × filters × date range |
| **Overview** | Real KPIs + spend / requests / tokens by provider, env, and model |
| **Auth** | Better Auth username/password with optional SES verification email |

---

## Screens (product map)

```
/sign-in · /sign-up
       │
       ▼
/workspace                 Overview KPIs + usage snapshot
  ├── /providers           LLM provider CRUD
  ├── /:providerId/models  Model registry + test
  ├── /child-keys          Downstream key lifecycle
  └── /analytics           Full dimensional analytics dashboard
```

### Analytics model

Three controls define the chart:

1. **Metric** (Y-axis) — request count · total tokens · cost  
2. **Dimension** (stack segments) — provider · model · `metadata_json` / tag fields (`env`, `team`, …)  
3. **Filters** — multi-select dropdowns + **user email** autocomplete over `event_log.user_email`  
4. **Date range** (X-axis) — last 7 days · last 30 days · custom  

Data is aggregated from Postgres `event_log` (populated by **gateway-ingest**).

---

## Stack

- **Next.js** App Router + Server Actions  
- **Better Auth** + Drizzle adapter  
- **Drizzle ORM** + Neon serverless Postgres  
- **shadcn/ui** · Tailwind CSS · Lucide  
- **jose** / AES for child-key and provider-key crypto (shared with gateway-api)  
- **React Hot Toast** for feedback  

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (`DATABASE_URL`)
- Shared secrets with `gateway-api` (see below)
- Optional: Redis for portal cache invalidation patterns

```bash
cd apps/gateway-portal
npm install

# Create .env with at least:
#   DATABASE_URL=
#   JWT_SIGNING_SECRET=
#   API_ENCRYPT_KEY=
#   BETTER_AUTH_SECRET=
#   BETTER_AUTH_URL=http://localhost:3000
#   GOOGLE_CLIENT_ID=
#   GOOGLE_CLIENT_SECRET=
#   EMAIL_FROM=                # verified SES sender for verification emails
#   AWS_REGION=us-east-1       # SES region (credentials via default AWS chain)

npm run db:migrate   # apply Drizzle migrations
npm run dev          # http://localhost:3000
```

### Email/password sign-up and verification

1. Set `EMAIL_FROM` to a verified SES identity and ensure AWS credentials can call SES.
2. Open `/sign-up`, enter name, email, password, and confirm password.
3. After **Create account**, the UI shows a pending-verification state (no session yet).
4. Open the verification link from the email (valid for 15 minutes).
5. Better Auth verifies the address, signs you in, and redirects to `/` (home).

Unverified users cannot sign in with email/password until they complete verification. A failed sign-in attempt re-sends the verification email when `requireEmailVerification` is enabled.

### Google social login

1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
2. Add authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-domain>/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. Ensure `BETTER_AUTH_URL` matches the public origin of the portal (used to build the OAuth callback URL).
5. Restart `npm run dev`, then use **Continue with Google** on `/sign-in` or `/sign-up`.

### First-run checklist

1. Sign up with email/password, or **Continue with Google**.  
2. **Providers** → add upstream URL + master key.  
3. **Models** → register alias + pricing.  
4. **Child keys** → mint a key; copy the `sk_…` secret (shown once).  
5. Point clients at **gateway-api** with that key.  
6. Run **gateway-ingest** (or `seed:event-log` there) → open **Analytics**.

### Seed / snapshot helpers

```bash
npm run db:snapshot   # export selected tables to scripts/seed/snapshot.json
npm run db:seed       # re-seed from snapshot
```

---

## Environment

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SIGNING_SECRET` | yes | Child key JWT (must match gateway-api) |
| `API_ENCRYPT_KEY` | yes | AES key for provider/child secrets (must match gateway-api) |
| `BETTER_AUTH_SECRET` | yes | Better Auth session secret |
| `BETTER_AUTH_URL` | yes | Public portal URL (OAuth callback base) |
| `GOOGLE_CLIENT_ID` | no* | Google OAuth client ID (*required for Google login) |
| `GOOGLE_CLIENT_SECRET` | no* | Google OAuth client secret (*required for Google login) |
| `EMAIL_FROM` | yes* | Verified SES From address (*required for email verification) |
| `AWS_REGION` / AWS credentials | yes* | SES send permissions for verification emails |
| `REDIS_URL` | no | Cache invalidation helpers |

> **Security:** Never commit `.env`. Master keys and child-key ciphertext never leave the server in plain form after create/reveal flows.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm test` | Node test runner (`tests/**/*.test.ts`) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations (**this app owns schema**) |
| `npm run db:studio` | Drizzle Studio |
| `npm run email` | React Email preview |

---

## Project structure

```
apps/gateway-portal/
├── app/
│   ├── workspace/           # Authenticated console routes
│   ├── server-actions/      # Portal mutations & queries
│   ├── sign-in/ · sign-up/
│   └── api/auth/            # Better Auth handler
├── components/
│   ├── analytics/           # Dashboard controls + stacked chart
│   ├── child-keys/ · models/ · llm-providers/
│   └── workspace/           # Sidebar, overview panels
├── lib/
│   ├── analytics/           # Series aggregation over event_log
│   ├── db/                  # Drizzle schema (source of truth)
│   ├── child-key/ · llm-provider/ · model/
│   └── auth*.ts
├── drizzle/migrations/
└── tests/
```

---

## Development notes

- Prefer **Server Actions** for portal workflows that fit Next.js well.  
- Schema changes: edit `lib/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`.  
- Meaningful changes should get a short work log under `tasks/ai/` or `tasks/human/` (see `AGENTS.md`).  
- UI follows the portal design tokens in `app/globals.css` (enterprise dark console).

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

---

## Related packages

| Package | Role |
| ------- | ---- |
| [`gateway-api`](../gateway-api) | Hono proxy that validates child keys and routes upstream |
| [`gateway-ingest`](../gateway-ingest) | Fills `event_log` for analytics |
| [Root README](../../README.MD) | Monorepo overview & quick start |

---

## Contributing

PRs that improve UX clarity, analytics performance, or provider onboarding are especially welcome.

1. Keep changes focused and tested.  
2. Do not invent production metrics — empty states should be honest.  
3. Match existing OpenRouter-inspired console density (compact, mono metrics, quiet borders).

---

## License

Licensed under the [Apache License, Version 2.0](../../LICENSE) — same as the monorepo root.

---

<p align="center">
  Built for teams who want <strong>owned</strong> LLM operations data — not another black-box SaaS bill.<br />
  ★ Star <a href="../../README.MD">Open LLM Gateway</a> if the portal saves you time.
</p>
