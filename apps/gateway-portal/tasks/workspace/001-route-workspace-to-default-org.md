# 001 — Route `/workspace` to the default organization page

## Summary

Visiting `/workspace` now redirects to the user's default organization overview at `/org/[organizationId]`.

The default organization is the session's active organization when the user is still a member of it; otherwise the first organization (created on demand if the user has none). If no organization can be resolved, the user is sent to `/organization`.

The workspace sidebar Overview item now points at `/org/{id}` so the landed page stays highlighted, and switching organizations while on an `/org/...` route keeps the same page under the new organization.

## Files touched

- `app/workspace/page.tsx` — server redirect from `/workspace` to `/org/{defaultOrganizationId}`
- `lib/organization/service.ts` — shared `selectWorkspaceOrganizationId` helper
- `app/(workspace)/layout.tsx` — use the shared helper
- `app/server-actions/organization/get-organization-workspace.ts` — use the shared helper
- `components/workspace/workspace-sidebar.tsx` — Overview href/active state + org-switch URL update
- `tests/organization/select-workspace-organization-id.test.ts`

## How to verify

1. `npx tsc --noEmit`
2. `npm test -- tests/organization/select-workspace-organization-id.test.ts`
3. `npx eslint app/workspace/page.tsx lib/organization/service.ts 'app/(workspace)/layout.tsx' app/server-actions/organization/get-organization-workspace.ts components/workspace/workspace-sidebar.tsx tests/organization/select-workspace-organization-id.test.ts`
4. `npm run dev`
5. Sign in and open `/workspace`. Confirm the URL becomes `/org/{organizationId}` and the Overview page renders.
6. Click Overview in the sidebar and confirm it stays on `/org/{organizationId}` and remains highlighted.
7. With two organizations, switch orgs on the overview page and confirm the URL updates to the new `/org/{id}`.

## Follow-ups / next steps

- Point remaining workspace links (`/workspace/providers`, `/workspace/child-keys`, `/workspace/analytics`) at the org-scoped routes.
- Scope sidebar Models/Providers/Child Keys/Analytics hrefs to `/org/{id}/...`.
