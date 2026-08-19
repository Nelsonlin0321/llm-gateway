# 004 — User organization features

## Summary

Implemented Better Auth organization features on top of the existing organization schema:

- Users can create additional organizations. The creator is assigned the **root** role.
- New sign-up users (email/password and Google) automatically get a default personal workspace.
- Existing users without an organization get one on the next workspace visit.
- Root and admin members can invite people by email. Invitees land on `/accept-invitation` and can accept or decline after signing in with the invited email.
- Static roles:
  - **root** — all permissions, including delete
  - **admin** — create/update/invite, cannot delete organizations or members
  - **viewer** — read-only

## Files touched

- `lib/auth.ts` — organization plugin roles, invitation email, default-org hooks
- `lib/auth-client.ts` — shared access control on the organization client
- `lib/auth-redirect.ts` — shared post-auth return-path helper
- `lib/email.ts`, `emails/invitation-email.tsx` — invitation email via SES
- `lib/db/schema.ts` — `session.activeOrganizationId`
- `lib/organization/*` — roles, slugs, default org creation, types
- `app/workspace/organization/page.tsx` — organization management
- `app/accept-invitation/page.tsx` — accept/decline invitation
- `app/workspace/layout.tsx`, `components/workspace/workspace-sidebar.tsx` — active org switcher
- `components/organization/*` — create, invite, manage, accept UI
- `drizzle/migrations/0006_session_active_organization.sql`
- `tests/organization/permissions.test.ts`, `tests/organization/slug.test.ts`

## How to verify

1. Apply the new migration: `npm run db:migrate`
2. `npm test`
3. `npx tsc --noEmit`
4. `npm run dev`
5. Sign up a new user and confirm a default workspace appears in the sidebar.
6. Open `/workspace/organization`, create a second organization, and switch between them.
7. Invite another email as admin or viewer. Confirm the SES invitation email and accept it at `/accept-invitation?id=...`.
8. Confirm viewers cannot invite/edit/delete, admins can edit/invite but not delete, and root can delete.

## Follow-ups / next steps

- Scope providers, models, and child keys to the active organization.
- Enforce organization role checks on those resource mutations, not only org-management actions.
