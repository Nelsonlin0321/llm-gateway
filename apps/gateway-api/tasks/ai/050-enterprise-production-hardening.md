# 050 — Enterprise production hardening (data plane)

## Summary of changes

Made the gateway-api data plane tenant-safe and production-ready:

- Route provider/model resolution by `organizationId` (not `creatorId`) so org-shared credentials work and other orgs cannot be reached.
- Stop listing every active model on unauthenticated `GET /`. Authenticated `GET /openai/v1/models` (and Anthropic equivalent) lists only the child key's organization.
- Emit `organization_id` on every Redis Stream request log so ingest can load rows.
- Align Redis cache keys with the portal so child-key / provider mutations actually invalidate the hot path.
- Add `/ready` (Postgres + Redis), env validation, request body limits, upstream timeouts, security headers, optional CORS, and per-child-key RPM rate limits.

## Files touched

- `src/index.ts`, `src/lib/config.ts`, `src/lib/redis-keys.ts`, `src/lib/redis-client.ts`
- `src/providers/resolve.ts`, `src/proxy/*`, `src/request-log/*`
- `src/child-keys/authorize.ts`, `src/child-keys/service.ts`, `src/child-keys/rate-limit.ts`
- `src/db/schema.ts`
- `tests/*`

## How to verify

```bash
cd apps/gateway-api
bun test tests --path-ignore-patterns='**/*.live.test.ts'
bun run build
```

## Follow-ups / next steps

- Enforce optional `monthly_budget_usd` on the hot path after usage is known.
- Publish OpenAPI for `/openai` and `/anthropic`.
