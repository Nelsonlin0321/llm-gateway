# 023 — Document RedisStreamClient commands

## Summary of changes

- Added JSDoc on each `RedisStreamClient` method explaining the Redis command (`XGROUP`, `XREADGROUP`, `XAUTOCLAIM`, `XACK`, `XPENDING`, `XADD`, `PING`, `QUIT`) and how ingest uses it.
- Each method includes a call example plus a parameter-by-parameter walkthrough.

## Files touched

- `apps/gateway-ingest/src/lib/redis-client.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun run build
```

## Follow-ups / next steps

- None.
