# 004 — Implement Redis function wrapper

## Summary of changes

- Added `redis_cache()` to the shared Redis helper in `lib/redis.ts`.
- Added JSON cache hydration that revives ISO datetime strings back into `Date` objects.
- Made the Redis helper import-safe when `REDIS_URL` is unset, and treated Redis read/write failures as cache misses so the source function still returns fresh data.
- Added focused unit coverage for cache hits, cache misses, TTL handling, date revival, and Redis failure fallback behavior.

## Files touched

- `apps/gateway-api/lib/redis.ts`
- `apps/gateway-api/tests/redis.test.ts`

## How to verify

- `cd apps/gateway-api && node --import tsx --test tests/redis.test.ts`
- `cd apps/gateway-api && npm test`

## Follow-ups / next steps

- Wire `redis_cache()` into the child-key auth and routing hot paths once those call sites are ready to consume shared cached lookups.
