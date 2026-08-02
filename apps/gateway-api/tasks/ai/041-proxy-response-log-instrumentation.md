# 041 — Proxy response log instrumentation for Redis Stream

## Summary

Extended the request-log Redis Stream path so each entry is emitted **after** the upstream response completes (or errors), including the response/timing fields from `022-proxy-redis-stream-log-schema.md`.

- Added `requestId` middleware (`x-request-id`)
- Instrumented JSON and SSE upstream responses in the proxy path
- Emit now includes: `request_id`, `response_mode`, `started_at`, `completed_at`, `status_code`, `response_content_type`, `response_headers_json`, `response_payload_json` / `response_stream_text`, `duration_ms`, `first_token_ms`, `error_type`, `error_message`, `response_id`
- Capture level still gates bodies (`metadata` omits payloads; `redacted`/`full` include them)
- SSE is tee’d via a pump so clients still receive the stream while we capture transcript + first-token latency
- Upstream network failures emit a 502 log with `error_type=server_error`

## Files Touched

- `src/request-log/schema.ts`
- `src/request-log/build.ts`
- `src/request-log/emit.ts`
- `src/request-log/parse-response.ts` (new)
- `src/request-log/instrument-response.ts` (new)
- `src/request-log/request-id.ts` (new)
- `src/request-log/index.ts`
- `src/proxy/upstream-proxy.ts`
- `src/index.ts`
- `tests/request-log.test.ts`
- `tests/proxy-openai.test.ts`
- `tests/proxy-anthropic.test.ts`

## How To Verify

```bash
cd apps/gateway-api
npx tsc --noEmit
node --import tsx --test tests/request-log.test.ts tests/proxy-openai.test.ts tests/proxy-anthropic.test.ts
```

## Follow-ups / Next Steps

- Token usage / cost fields (separate enricher or later instrumentation)
- Cap / sample high-volume SSE capture in production if stream sizes grow large
- Optionally hash/redact error messages that may contain user content
