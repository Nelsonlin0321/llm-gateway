# 031 - Fix child-key JWT tests and Redis assertions

## Summary

- Restored the compact child-key JWT claim set in `gateway-api` by removing the unused `creator_id` requirement from `ChildKeyJwtPayload` parsing.
- Updated child-key auth tests and test key minting helpers to align with the compact claim set.
- Fixed Redis-related unit tests to match the current Redis key format and the ioredis `SET key value EX seconds` calling convention.
- Ensured provider-model cache keys include the `gateway-api` application segment when used by provider resolution.

## Files touched

- `src/child-keys/types.ts`
- `src/child-keys/jwt.ts`
- `src/providers/resolve.ts`
- `tests/child-keys/auth.test.ts`
- `tests/child-keys/mint-test-key.ts`
- `tests/redis-keys.test.ts`
- `tests/redis.test.ts`

## Verification

```bash
node --import tsx --test tests/child-keys/auth.test.ts
LIVE_PROXY_TEST=0 node --import tsx --test tests/**/*.test.ts
```

