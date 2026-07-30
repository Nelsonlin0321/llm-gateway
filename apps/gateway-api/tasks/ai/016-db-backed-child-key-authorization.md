# 016 — Implement DB-backed child key authorization (006)

## Summary of changes

Implemented post-JWT authorization against Prisma `ChildKey` via `src/prisma.ts`.

### Auth pipeline (proxy)

1. Bearer plain `sk_…` required  
2. JWT verify (`JWT_SIGNING_SECRET`)  
3. JWT `exp` check  
4. **`authorizeChildKey`** (new):
   - Load `ChildKey` by `payload.key_id`
   - Reject missing / inactive / past `expiresAt`
   - Reject `issuedAt !== payload.issued_at` (rotation)
   - Decrypt DB ciphertext and timing-safe compare to presented plain key
   - DB errors → **503** `server_error` (fail closed)

### Files

- `src/child-keys/authorize.ts` — `authorizeChildKey` + injectable `ChildKeyLookup`
- `src/child-keys/service.ts` — wires authorize after JWT verify
- `src/child-keys/types.ts` — status `503` + `server_error`
- `src/child-keys/index.ts` / middleware status typing
- `tests/child-keys/authorize.test.ts`
- `tests/child-keys/auth.test.ts` — inject mock lookup

### Env

```bash
DATABASE_URL=...
API_ENCRYPT_KEY=...
JWT_SIGNING_SECRET=...
```

## How to verify

```bash
cd apps/gateway-api
node --import tsx --test tests/child-keys/*.test.ts
npm run build
```

## Follow-ups

- Redis cache for authz records (014)
- Portal rotation UI (portal 029) pairs with `issuedAt` check
