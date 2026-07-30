# 044 - Remove policy_id from child-key JWT

## Summary

- Removed `policy_id` from the portal-issued child API key JWT claim set.
- Updated JWT signing/parsing to require `creator_id` and to omit `policy_id` entirely.
- Updated child-key rotation/create helpers and unit tests to match the new claim shape.

## Files touched

- `lib/child-key/schema.ts`
- `lib/child-key/jwt.ts`
- `lib/child-key/service.ts`
- `tests/child-key/jwt.test.ts`
- `tests/child-key/service.test.ts`

## Verification

```bash
node --import tsx --test tests/**/*.test.ts
```

