# 049 — Finish capture-level removal and fix tests

## Summary of changes

Capture level is gone from the request-log schema. Remaining `getCaptureLevel` / `captureLevel` call sites were still breaking the test suite. Removed those, and updated tests that imported deleted capture-level APIs.

Also unblocked `npm run test` for unrelated stale imports:

- payload tests now call `parseOpenaiPayload` / `parseAnthropicPayload`
- child-key JWT round-trip asserts `key_id` (name is no longer a returned claim)
- deleted `proxy-curl.test.ts` because `src/proxy/curl.ts` no longer exists
- proxy tests now use `injectOpenAIProxyContext` / `injectAnthropicProxyContext`

## Files touched

- `apps/gateway-api/src/proxy/upstream-proxy.ts` — also forwards provider auth headers on the upstream request
- `apps/gateway-api/src/proxy/proxy-anthropic.ts` — dropped unused `buildUpstreamHeaders` import
- `apps/gateway-api/src/request-log/instrument-response.ts`
- `apps/gateway-api/src/request-log/schema.ts`
- `apps/gateway-api/src/request-log/emit.ts`
- `apps/gateway-api/tests/request-log.test.ts`
- `apps/gateway-api/tests/proxy-openai.test.ts`
- `apps/gateway-api/tests/payload-openai.test.ts`
- `apps/gateway-api/tests/payload-anthropic.test.ts`
- `apps/gateway-api/tests/child-keys/auth.test.ts`
- `apps/gateway-api/tests/proxy-curl.test.ts` (deleted)
- `apps/gateway-api/tests/proxy-anthropic.test.ts`

## How to verify

```bash
cd apps/gateway-api
npm run test
bun run build
```

## Follow-ups / next steps

- SSE capture in `instrument-response.ts` still has a 1MB in-memory buffer cap.
- Ingest still maps a `capture_level` stream field; drop it there if the producer no longer emits it.
