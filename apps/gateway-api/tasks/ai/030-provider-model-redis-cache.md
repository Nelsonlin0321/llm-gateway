## Summary
- Adds Redis caching for the provider+model resolution Prisma query used by the default provider model lookup.
- Introduces a dedicated Redis key builder for provider-model lookups.

## Files Touched
- apps/gateway-api/src/providers/resolve.ts
- apps/gateway-api/src/lib/redis-keys.ts
- apps/gateway-api/tests/redis-keys.test.ts

## How To Verify
- cd apps/gateway-api
- npm test

## Follow-ups / Next Steps
- Consider whether negative lookups (missing models) should use a shorter TTL to avoid long-lived “unknown model” caching.

