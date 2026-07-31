## Summary

Added an optional request-log stream length cap using Redis Streams trimming. When configured, request-log events are published with `XADD MAXLEN ~ <n>` to keep the stream bounded.

## Configuration

- Env: `REQUEST_LOG_STREAM_MAXLEN`
  - When set to a positive integer, `emitRequestLog` publishes with `MAXLEN ~ <n>`.
  - When unset or invalid, no stream trimming is applied.

## Files Touched

- apps/gateway-api/src/lib/redis-client.ts
- apps/gateway-api/src/request-log/emit.ts
- apps/gateway-api/tests/request-log.test.ts
- apps/gateway-api/tests/redis.test.ts
- README.MD

## How To Verify

```bash
cd apps/gateway-api
bun test tests/request-log.test.ts
```

