# 046 — Model pricing on proxy context and Redis stream

**Status:** Done  
**App:** `gateway-api`  
**Depends on:** model pricing columns on `model`; proxy redis stream request log

---

## Summary of changes

Provider/model resolution now loads `inputPrice`, `outputPrice`, and `inputCachePrice` from the `model` table and carries them through the proxy path so they can be written to the Redis Stream request-log buffer for later cost attribution (ingest-side).

- Extended `ProviderModelLookupRecord.llmModel` and `ResolvedProviderModel` with the three price fields.
- Default provider-model lookup selects prices from DB (and Redis cache payload).
- `UpstreamProxyContext` includes prices; OpenAI and Anthropic proxy handlers copy them from resolve.
- Request-log schema/build/emit publish `input_price`, `output_price`, `input_cache_price` as decimal strings on the stream entry.

## Files touched

- `src/providers/resolve.ts`
- `src/proxy/upstream-proxy.ts`
- `src/proxy/proxy-openai.ts`
- `src/proxy/proxy-anthropic.ts`
- `src/request-log/schema.ts`
- `src/request-log/build.ts`
- `src/request-log/emit.ts`
- `tests/providers/resolve.test.ts`
- `tests/request-log.test.ts`
- `tests/proxy-openai.test.ts`
- `tests/proxy-anthropic.test.ts`

## How to verify

```bash
cd apps/gateway-api
bun test tests/providers/resolve.test.ts tests/request-log.test.ts tests/proxy-openai.test.ts tests/proxy-anthropic.test.ts
```

## Follow-ups / next steps

- Ingest can compute `cost_usd` from stream prices + token usage (task 011).
- Consider cache invalidation when portal updates model prices so resolve Redis cache does not serve stale prices for the full TTL.
