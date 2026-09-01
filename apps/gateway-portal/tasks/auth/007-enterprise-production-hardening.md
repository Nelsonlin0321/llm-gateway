# 007 — Enterprise production hardening (control plane)

## Summary of changes

Closed multi-tenant leaks and production auth/ops gaps in the portal:

- Analytics, workspace overview KPIs, and usage panels are scoped to the active organization and require `organization:view`.
- Redis cache keys now match gateway-api; provider/model/child-key mutations invalidate the correct keys.
- Better Auth: trusted origins from env, optional Google OAuth, encrypted OAuth tokens, session cookie cache, tighter rate limits, invitation role checks via `assignableRolesFor`.
- Security headers on all routes. Admin mutations write an `audit_log` row and no longer leak internal error messages.
- Schema: unique membership, unique model alias per org, child-key org index, optional rate-limit/budget columns, `audit_log` table (`0001_enterprise_hardening`).

## Files touched

- `lib/auth.ts`, `lib/analytics/*`, `lib/workspace/overview.ts`, `lib/redis/*`, `lib/audit.ts`, `lib/db/schema.ts`
- `app/server-actions/**`, `app/(workspace)/org/[organizationId]/**`
- `next.config.ts`, `drizzle/migrations/0001_enterprise_hardening.sql`

## How to verify

```bash
cd apps/gateway-portal
./node_modules/.bin/tsc --noEmit
npm test
```

Apply the new migration before deploying:

```bash
npm run migrate
```

## Follow-ups / next steps

- UI for per-key RPM / monthly budget fields.
- Audit log explorer in the portal.
- Re-check Google sign-in button when OAuth env is unset.
