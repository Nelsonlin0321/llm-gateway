# 014 — Redis cache for auth

**Status:** Done  
**App:** `gateway-api`  
**Priority:** P1  
**Depends on:** 006 DB auth; Redis availability  
**Implemented in:** [019-redis-cache-auth.md](./019-redis-cache-auth.md)

---

## Context

DB lookup on every request adds latency. System design calls for Redis cache of hot keys and mappings.

## Goal

Cache:

1. **Child key authz record**

`apps/gateway-api/src/child-keys/authorize.ts` loads via Prisma:

```ts
record = await prisma.childKey.findUnique({
  where: { id: payload.key_id },
  select: { id, key, isActive, expiresAt, issuedAt },
});
```

This lookup is wrapped with `redis_cache` from `apps/gateway-api/lib/redis.ts`.

2. Cache key helper in `apps/gateway-api/lib/redis-keys.ts`:

- Input: `key_id`
- Output: Redis key string (`child-key:authz:{keyId}`)

## Acceptance criteria

- [x] Cache hit avoids DB for repeated requests with same key.
- [x] Stale deactivate delay ≤ TTL (documented: **60s** via `CHILD_KEY_AUTHZ_CACHE_TTL_SECONDS`).

## Non-goals

- Semantic prompt cache.
- Provider routing cache (separate / later).
