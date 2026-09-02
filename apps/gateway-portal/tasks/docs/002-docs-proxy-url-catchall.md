# 002 — Docs use NEXT_PUBLIC_PROXY_API_URL and catch-all proxy routes

## Summary of changes

Updated `/docs` so examples call `NEXT_PUBLIC_PROXY_API_URL` (no hardcoded localhost origin). Documented `POST /openai/*` and `POST /anthropic/*` as catch-all proxies for any path the upstream provider supports; chat completions and messages are examples only.

## Files touched

- `lib/docs/api-guide.ts`
- `components/docs/api-docs-content.tsx`
- `app/docs/page.tsx`
- `tests/docs/api-guide.test.ts`
- `.env.example` (root) — added `NEXT_PUBLIC_PROXY_API_URL`
- `tasks/docs/002-docs-proxy-url-catchall.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npx tsc --noEmit
```

Open `/docs`. Confirm the origin is the `NEXT_PUBLIC_PROXY_API_URL` value, the route table lists `POST /openai/*` and `POST /anthropic/*`, and curl snippets are not locked to localhost.

## Follow-ups / next steps

- If the env is unset, the page shows `$NEXT_PUBLIC_PROXY_API_URL` as a placeholder.
