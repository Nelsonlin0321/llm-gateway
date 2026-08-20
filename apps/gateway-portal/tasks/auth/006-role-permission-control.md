# 006 — Custom organization role permission control

## Summary

Replaced Better Auth access-control roles with a centralized permission check driven by `rolePermission` in `lib/organization/permissions.ts`.

- `hasPermission(role, entity, operation)` is the source of truth.
- Server actions for providers, models, and child keys now require membership plus the matching operation.
- Management UIs hide create/edit/delete actions the current role cannot perform.
- Sidebar hides console items the role cannot view (for example child keys for `member`).
- Better Auth organization endpoints (invite, update org, delete member) still run through the plugin, but they authorize against the same `rolePermission` table instead of `createAccessControl`.

## Files touched

- `lib/organization/permissions.ts` — `hasPermission`, labels, assignable roles, plugin-role adapter
- `lib/organization/access.ts` — `requireOrganizationPermission` / `getOrganizationRole`
- `lib/auth.ts`, `lib/auth-client.ts`, `lib/email.ts`
- `app/server-actions/llm-provider/*`, `app/server-actions/model/*`, `app/server-actions/child-key/*`
- `components/llm-providers/*`, `components/models/*`, `components/child-keys/*`
- `components/organization/organization-management-client.tsx`
- `components/workspace/workspace-sidebar.tsx`
- `tests/organization/permissions.test.ts`

## How to verify

```bash
cd apps/gateway-portal
./node_modules/.bin/tsc --noEmit
npm test
```

Permission tests in `tests/organization/permissions.test.ts` cover each role against `rolePermission`.

Manual:

1. Sign in as **root** — create/update/delete providers, models, keys, and the organization.
2. Sign in as **admin** — same except organization delete is hidden/rejected.
3. Sign in as **viewer** — lists are visible; mutation buttons are hidden and server actions reject writes.
4. Sign in as **member** — providers and models are visible; Child Keys is hidden in the sidebar and key APIs return empty / forbidden.

## Follow-ups / next steps

- Scope analytics reads to `organization:view` (or a dedicated analytics entity).
- Re-check assigned invitation roles server-side against `assignableRolesFor` in addition to Better Auth's creator-role guard.
- Pre-existing `tsc` errors in `tests/child-key/jwt.test.ts` and `tests/child-key/service.test.ts` are unrelated.
