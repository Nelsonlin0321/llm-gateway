## Summary

- Added `redis_invalidate` helper to delete a cached value by Redis key.
- Extended the Redis cache client surface to include `del`.

## Files Touched

- /Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/lib/redis.ts
- /Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/redis.test.ts

## How To Verify

```bash
cd apps/gateway-api
npm test
```

## Follow-ups / Next Steps

- If cache invalidation is needed for key-prefix patterns, add a separate helper that uses `SCAN` + `DEL` (avoid `KEYS` in production).
