# 040 — Proxy Redis stream request-log (schema v1)

## Summary

Implemented the minimum request-side Redis Stream log schema from `022-proxy-redis-stream-log-schema.md` and wired best-effort emission into the upstream proxy path.

- Defined schema v1 types and field builders for flat Redis Stream entries
- Capture levels via `REQUEST_LOG_CAPTURE_LEVEL` (`metadata` | `redacted` | `full`, default `metadata`)
- Sanitizes Authorization / API-key headers; never logs child key secrets or provider keys
- Extended `getRedisClient()` surface with `xadd` and stream name `llm-gateway-request-logs`
- Enriched `UpstreamProxyContext` with gateway path, method, stream flag, and original request payload
- Fire-and-forget `XADD` on every successful proxy context handoff (does not fail client responses)

Response/timing fields (`status_code`, `duration_ms`, `response_payload_json`, etc.) are intentionally deferred — they need response interception beyond the current pass-through proxy.

## Files Touched

- `src/lib/redis-client.ts` — add `xadd` to Redis client interface
- `src/lib/redis-keys.ts` — `REQUEST_LOG_STREAM` constant
- `src/request-log/schema.ts` — v1 field types
- `src/request-log/capture.ts` — capture level + header/payload redaction
- `src/request-log/build.ts` — build flat stream fields
- `src/request-log/emit.ts` — best-effort `XADD`
- `src/request-log/index.ts` — public exports
- `src/proxy/upstream-proxy.ts` — emit hook + context fields
- `src/proxy/proxy-openai.ts` — populate request-log fields on context
- `src/proxy/proxy-anthropic.ts` — same; also fix default compatibility to `anthropic`
- `src/child-keys/index.ts` — fix `ChildKeyDbRecord` re-export
- `tests/request-log.test.ts` — unit tests for schema/build/emit
- `tests/proxy-openai.test.ts` — use `childKeyRecord`; assert emit + context
- `tests/proxy-anthropic.test.ts` — fix deps; assert context + emit
- `tests/redis.test.ts` — FakeRedis supports `xadd`
- `tasks/ai/022-proxy-redis-stream-log-schema.md` — status → Done (min schema)

## How To Verify

```bash
cd apps/gateway-api
npx tsc --noEmit
node --import tsx --test tests/request-log.test.ts tests/proxy-openai.test.ts tests/proxy-anthropic.test.ts tests/redis.test.ts
```

Optional: set `REDIS_URL` and `REQUEST_LOG_CAPTURE_LEVEL=full`, then:

```bash
XREAD COUNT 1 STREAMS llm-gateway-request-logs 0-0
```

after a proxied request.

## Follow-ups / Next Steps

- Request-id middleware + `request_id` field
- Response interception for `status_code`, timings, response body/SSE transcript, usage tokens
- Ingest worker: Redis Stream → database
- Align `npm test` glob so nested + top-level `*.test.ts` both run under zsh
