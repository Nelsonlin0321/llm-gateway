# 048 — Remove applyPayloadCapture; store full request-log bodies

## Summary of changes

Request-log payload capture is always full (no omit/truncate policy). Removed `applyPayloadCapture` and wired `buildRequestLogFields` to store request, upstream, and response bodies as-is. Stream entries now set `capture_level` to `"full"`.

## Files touched

- `apps/gateway-api/src/request-log/capture.ts` — deleted `applyPayloadCapture` and the redacted-body char cap
- `apps/gateway-api/src/request-log/build.ts` — write payload fields without capture-level truncation
- `apps/gateway-api/src/request-log/index.ts` — dropped `applyPayloadCapture` export
- `apps/gateway-api/src/request-log/emit.ts` — unused capture-level imports
- `apps/gateway-api/src/proxy/upstream-proxy.ts` — stop passing unused `captureLevel` into `emitRequestLog`
- `apps/gateway-api/tests/request-log.test.ts` — removed `applyPayloadCapture` unit test

## How to verify

```bash
cd apps/gateway-api
bun test tests/request-log.test.ts
bun run build
```

## Follow-ups / next steps

- `getCaptureLevel` / `parseCaptureLevel` and `InstrumentResponseOptions.captureLevel` still exist for env/config and SSE instrumentation; they no longer change stored payload size.
- SSE capture in `instrument-response.ts` still has a 1MB in-memory buffer cap (`STREAM_BUFFER_MAX_CHARS`).
