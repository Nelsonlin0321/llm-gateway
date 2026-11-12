# 053 — Apply REQUEST_LOG_CAPTURE_LEVEL to request and response bodies

## Summary of changes

`REQUEST_LOG_CAPTURE_LEVEL` again controls three request-log body fields:

- `request_payload_json`
- `response_payload_json`
- `response_stream_text`
- `upstream_request_payload_json`

| Level | Those three fields |
| ----- | ------------------ |
| `metadata` | omitted |
| `redacted` | kept, truncated at 2048 characters |
| `full` (default when unset or invalid) | stored as-is |

`upstream_request_payload_json` is still stored at every level.

## Files touched

- `apps/gateway-api/src/request-log/capture.ts`
- `apps/gateway-api/src/request-log/schema.ts`
- `apps/gateway-api/src/request-log/build.ts`
- `apps/gateway-api/src/request-log/emit.ts`
- `apps/gateway-api/src/request-log/index.ts`
- `apps/gateway-api/src/env.ts`
- `apps/gateway-api/tests/request-log.test.ts`

## How to verify

```bash
cd apps/gateway-api
bun test tests/request-log.test.ts
bun run build
```

## Follow-ups / next steps

- Set `REQUEST_LOG_CAPTURE_LEVEL=metadata` or `redacted` where full bodies should not be kept. Unset still stores full bodies.
- `upstream_request_payload_json` is not gated. Apply the same level there if the upstream body should follow this policy.
