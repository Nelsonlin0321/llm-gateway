# 038 - Shrink child key JWT payload

## Summary of changes

- Reduced portal-issued child-key JWTs to the shared minimal claim set: `name`, `key_id`, optional `policy_id`, `issued_at`, and optional `exp`.
- Stopped adding redundant JWT standard claims (`iat`, `sub`) so issued secrets stay smaller.
- Updated child-key create/rotate helpers and unit tests to match the compact payload shape while continuing to keep tags, user email, and creator data in the database.

## Files touched

- `lib/child-key/schema.ts`
- `lib/child-key/jwt.ts`
- `lib/child-key/service.ts`
- `app/server-actions/child-key/create-child-key.ts`
- `app/server-actions/child-key/rotate-child-key.ts`
- `tests/child-key/jwt.test.ts`
- `tests/child-key/service.test.ts`

## How to verify

```bash
node --import tsx --test tests/child-key/*.test.ts
npm run build
```

`npm run build` still stops on the pre-existing `/sign-in` `useSearchParams()` Suspense error.
