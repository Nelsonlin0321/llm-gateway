# 021 - Fix child-key test hang

## Summary

- Restored the child-key authorization cache bypass whenever Prisma lookups are mocked, so unit tests do not open Redis connections while stubbing the database layer.
- Changed the Redis helper to create the `ioredis` client lazily instead of at import time, which prevents idle test processes from hanging on an eagerly opened socket.

## Files touched

- `src/child-keys/authorize.ts`
- `src/lib/redis.ts`

## Verification

```bash
node --import tsx --test tests/child-keys/auth.test.ts
node --import tsx --test tests/child-keys/authorize.test.ts
./node_modules/.bin/tsc --noEmit --pretty false
```
