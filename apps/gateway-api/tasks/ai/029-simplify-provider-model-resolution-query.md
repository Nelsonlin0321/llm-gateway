# 029 — Simplify provider+model resolution query

## Summary
- Updates provider+model resolution to query `Model` first (nested provider filter) and return `{ llmModel, llmProvider }` from the lookup layer.
- Preserves existing resolver behavior (`ResolvedProviderModel`) by mapping the lookup result into `{ baseUrl, apiKey, model }`.
- Keeps error messaging by falling back to a provider-only lookup when the model lookup misses.

## Files Touched
- [resolve.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/providers/resolve.ts)
- [resolve.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/providers/resolve.test.ts)

## How To Verify
- From `apps/gateway-api`:
  - `npm test`

## Follow-ups
- Consider making the provider fallback lookup injectable in production handlers if a custom resolver is ever wired outside this module.
