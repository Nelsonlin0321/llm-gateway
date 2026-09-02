# 001 — Align root README with current implementation

## Summary of changes

Reviewed the three-app implementation (portal orgs/RBAC, Cloudflare Workers proxy + ingest, rate limits, capture-level removal) and rewrote `README.MD` so setup, features, env, routing, and roadmap match the code.

## Files touched

- `README.MD`
- `tasks/human/001-align-root-readme.md`

## How to verify

Read `README.MD` against:

- `apps/gateway-api/src/index.ts`, `wrangler.jsonc`, `src/env.ts`
- `apps/gateway-ingest/wrangler.jsonc`, `src/index.ts`
- `apps/gateway-portal/package.json` (`migrate`, not `db:migrate`)
- `apps/gateway-portal/lib/organization/permissions.ts`
- `apps/gateway-portal/app/(workspace)/org/[organizationId]/**`
- `.env.example` (still lists `REQUEST_LOG_CAPTURE_LEVEL`; not used by Workers)

## Follow-ups / next steps

- App READMEs still mention capture levels, creator-scoped routing, and old portal routes (`/workspace/providers`).
- `PROJECT.MD` still lists multi-tenant RBAC as roadmap.
- `SYSTEM_DESIGN.MD` still describes capture levels, creator-scoped models, and orgs as a future extension.
- `.env.example` still has `REQUEST_LOG_CAPTURE_LEVEL` and ingest `REQUEST_LOG_BLOCK_MS=5000` (wrangler default is `0`).
