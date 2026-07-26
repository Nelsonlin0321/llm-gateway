# 005 — Child key authentication for gateway proxy

## Summary of changes

Protected `POST /openai/*` and `POST /anthropic/*` with Bearer child API key auth.

### Key model (important)

| Context | Form |
|--------|------|
| **Authorization Bearer** | **Plain** API key: `sk_<jwt>` (shown once on create / reveal in the portal) |
| **Database `ChildKey.key`** | **Encrypted** ciphertext (`v1.…`) via `API_ENCRYPT_KEY` |

Clients must never send the encrypted DB value as the Bearer secret.

### Auth flow (proxy)

1. Require `Authorization: Bearer sk_<jwt>`
2. Reject values that do not start with `sk_`
3. Verify JWT with `JWT_SIGNING_SECRET` → typed payload (`key_id`, `name`, `tags`, emails, `issued_at`, optional `exp`)
4. Reject expired tokens when JWT includes standard `exp`

### Storage helpers (not used on the Bearer path)

- `encryptApiKey` / `decryptApiKeyForProxy` / `decryptChildKey` — for reading **DB-stored** ciphertext only (same AES-256-GCM as portal)

Public routes (`/`, `/health`) remain unauthenticated.

### Files

- `src/child-keys/crypto.ts` — encrypt/decrypt for DB secrets
- `src/child-keys/jwt.ts` — verify/decode plain `sk_` JWT
- `src/child-keys/sign.ts` — sign (tests/tooling)
- `src/child-keys/service.ts` — auth orchestration
- `src/child-keys/middleware.ts` — Hono middleware
- `src/index.ts` — wire middleware
- `tests/child-keys/auth.test.ts`
- Live tests send `Authorization: Bearer sk_…`

### Portal alignment

- Portal embeds JWT `exp` when a child key has `expiresAt`

## Env

```bash
JWT_SIGNING_SECRET=...    # required on gateway to verify plain sk_ JWTs
API_ENCRYPT_KEY=...       # only if decrypting DB-stored keys (not Bearer auth)
# Live tests:
CHILD_API_KEY=sk_...      # optional; otherwise minted from JWT_SIGNING_SECRET
```

## How to verify

```bash
cd apps/gateway-api
npm test
npm run build
```

```bash
# Use the plain sk_ key from the portal (create/reveal), not DB ciphertext
curl -s -X POST http://localhost:8080/openai/v1/chat/completions \
  -H "authorization: Bearer $CHILD_API_KEY" \
  -H 'content-type: application/json' \
  -d '...'
```

## Follow-ups

- Optional DB lookup for `isActive` / revoke (decrypt stored key to compare or match `key_id`)
- Rate limits / policies keyed by `key_id` from JWT claims
