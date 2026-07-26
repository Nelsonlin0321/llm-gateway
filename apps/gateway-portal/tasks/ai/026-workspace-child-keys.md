# 026 — Workspace child API keys

## Summary of changes

Implemented `/workspace/child-keys` so workspace users can create, list, and activate/deactivate child API keys.

- Keys are JWTs signed with `JWT_SIGNING_SECRET`, prefixed `sk_live_`
- JWT payload includes `key_id`, `name`, optional `policy_id`, `tags`, `user_email`, `creator_email`, timestamps
- Create flow reveals the full secret once (copy dialog); list shows masked preview
- Tags: optional project / team / application / owner
- Toggle active/inactive via server action without re-signing
- Sidebar **Child Keys** points at the live page

## Files touched

### Domain
- `lib/child-key/jwt.ts` — sign / verify / decode
- `lib/child-key/schema.ts`
- `lib/child-key/service.ts`

### Server actions
- `app/server-actions/child-key/get-child-keys.ts`
- `app/server-actions/child-key/create-child-key.ts`
- `app/server-actions/child-key/toggle-child-key.ts`
- `app/server-actions/child-key/shared.ts`

### UI
- `app/workspace/child-keys/page.tsx`
- `app/workspace/child-keys/loading.tsx`
- `components/child-keys/*`
- `components/workspace/workspace-sidebar.tsx`

### Other
- `jose` dependency
- `tests/child-key/*`
- Prisma client regenerated for existing `ChildKey` model

## How to verify

```bash
# ensure env
# JWT_SIGNING_SECRET=... in apps/gateway-portal/.env

cd apps/gateway-portal
npm test
npm run dev
```

Manual:
1. Open `/workspace/child-keys`
2. Create a key with name + optional tags
3. Copy revealed `sk_live_…` secret
4. Confirm list shows name, tags, created/updated
5. Toggle active/inactive

## Follow-ups / next steps

- Wire `policy_id` when Policy entity ships
- Rotate / revoke with audit events
- Optional: re-issue JWT on metadata change

## Update — free-form tags

- Tags are no longer limited to project/team/application/owner
- Create form supports dynamic key/value rows (env, custom labels, etc.)
- JWT + DB store arbitrary string→string tag maps after validation
