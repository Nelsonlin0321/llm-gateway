## Summary
- Added Redis cache invalidation helper that deletes all keys matching a Redis glob pattern (e.g. `prefix:*`) via SCAN + DEL batching.
- Extended the Redis client surface to support `SCAN` and multi-key `DEL` (ioredis-compatible).

## Files Touched
- [invalidate.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/lib/redis/invalidate.ts)
- [redis-client.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/lib/redis/redis-client.ts)
- [invalidate-pattern.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/tests/redis/invalidate-pattern.test.ts)

## How To Verify
```bash
cd apps/gateway-portal
npm test
```

## Follow-ups / Next Steps
- If we need to invalidate by namespace frequently, consider standardizing key prefixes and adding a small set of app-level pattern helpers.

