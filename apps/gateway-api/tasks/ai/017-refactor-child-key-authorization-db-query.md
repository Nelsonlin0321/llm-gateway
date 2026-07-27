# 017 — Refactor child key authorization DB query

## Summary of changes

- Removed the injectable `ChildKeyLookup` abstraction from child key authorization.
- Updated `authorizeChildKey` to query Prisma directly with `prisma.childKey.findUnique(...)`.
- Removed the optional lookup path from `authenticateChildApiKey` so DB-backed authorization remains mandatory after JWT verification.
- Reworked child-key tests to stub `prisma.childKey.findUnique` directly and assert the DB lookup behavior.

## Files touched

- `src/child-keys/authorize.ts`
- `src/child-keys/service.ts`
- `src/child-keys/index.ts`
- `tests/child-keys/authorize.test.ts`
- `tests/child-keys/auth.test.ts`

## How to verify

```bash
cd apps/gateway-api
node --import tsx --test tests/child-keys/*.test.ts
npx tsc --noEmit
```

## Follow-ups / next steps

- Update any future child-key auth changes to keep the Prisma lookup explicit in the authorization path.
