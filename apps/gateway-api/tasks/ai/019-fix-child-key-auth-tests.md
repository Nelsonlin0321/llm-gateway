# 019 - Fix child key auth tests

## Summary

- Removed Redis-backed caching from `authorizeChildKey` so child-key authorization always reads the current Prisma row.
- Added an explicit Prisma `select` for the child-key fields used during authorization.
- Restored deterministic unit-test behavior for both `authorizeChildKey` and `authenticateChildApiKey`, even when Redis contains stale child-key rows.

## Files touched

- `src/child-keys/authorize.ts`

## Verification

```bash
npm test
```
