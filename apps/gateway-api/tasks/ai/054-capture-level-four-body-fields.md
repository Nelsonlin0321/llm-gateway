# 054 — Apply REQUEST_LOG_CAPTURE_LEVEL to all four body fields

## Summary of changes

`REQUEST_LOG_CAPTURE_LEVEL` controls these request-log body fields:

- `request_payload_json`
- `upstream_request_payload_json`
- `response_payload_json`
- `response_stream_text`

| Level | Those four fields |
| ----- | ----------------- |
| `metadata` | omitted |
| `redacted` | kept, truncated at 2048 characters |
| `full` (default when unset or invalid) | stored as-is |

Other stream fields, including `metadata_json`, are unchanged.

## Files touched

- `apps/gateway-api/src/request-log/capture.ts`
- `apps/gateway-api/src/request-log/schema.ts`
- `apps/gateway-api/src/request-log/build.ts`
- `apps/gateway-api/src/request-log/emit.ts`
- `apps/gateway-api/src/request-log/index.ts`
- `apps/gateway-api/src/env.ts`
- `apps/gateway-api/tests/request-log.test.ts` — body-field cases; the default stream cap assertion follows `getRequestLogStreamMaxLen()` so a local `REQUEST_LOG_STREAM_MAXLEN` does not fail the suite
- `apps/gateway-api/README.md`

## How to verify

```bash
cd apps/gateway-api
bun test tests/request-log.test.ts
bun run build
bunx tsc --noEmit -p tests/tsconfig.json
```

## Follow-ups / next steps

- `.env.example` sets `metadata`. Deployed Workers keep full bodies until `REQUEST_LOG_CAPTURE_LEVEL` is set on the Worker.
- `redacted` keeps the first 2048 characters. Token usage at the end of a long SSE transcript can be cut off before gateway-ingest reads it.
- In-memory SSE capture in `instrument-response.ts` still caps at 1MB before this policy runs.
