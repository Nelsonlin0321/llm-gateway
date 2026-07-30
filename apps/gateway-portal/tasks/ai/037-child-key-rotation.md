# 037 — Child API key rotation (implements 029)

## Summary of changes

Implemented **Rotate** for workspace child keys:

1. Confirm dialog warns that the old secret stops working immediately.
2. Server action `rotateChildKey(id)` (creator-only):
   - Keeps stable `id` (`key_id`) for analytics
   - Preserves name, tags, userEmail, expiresAt
   - Preserves `policy_id` from the previous JWT when decryptable
   - Issues new `sk_…` JWT with advanced `issuedAt` (strictly greater than previous)
   - Encrypts and overwrites DB `key` ciphertext
3. Shows the new plaintext secret once (secret dialog mode `rotated`).
4. List continues to show the same name/tags; key preview updates after refresh.

### Gateway note

JWT signature alone can still verify old tokens until `exp`. Full invalidation of the previous secret requires gateway DB checks on `issuedAt` / ciphertext (gateway **006** / **016**).

## Files touched

- `lib/child-key/service.ts` — `buildChildKeyRotateData`
- `lib/child-key/schema.ts` — comment for apiKey return surface
- `app/server-actions/child-key/rotate-child-key.ts` — new server action
- `app/server-actions/child-key/shared.ts` — apiKey comment
- `components/child-keys/child-key-management-client.tsx` — Rotate button + confirm
- `components/child-keys/child-key-secret-dialog.tsx` — `rotated` mode copy
- `tests/child-key/service.test.ts` — unit tests for rotate builder
- `tasks/ai/029-child-key-rotation.md` — marked Done

## How to verify

```bash
cd apps/gateway-portal
npm test
# or focused:
node --import tsx --test tests/child-key/*.test.ts
```

Manual:

1. Open `/workspace/child-keys`
2. Create a key, copy secret
3. Click **Rotate** → confirm
4. New secret differs; reveal shows only the new secret
5. Name/tags unchanged

## Follow-ups

- Portal **028** — attach policy in DB (today `policy_id` only lives in JWT)
- Gateway **016** — DB `issuedAt` check so old JWTs fail immediately after rotate
- Audit log (**031**) for rotate events
