# 003 — Scope workspace sidebar navigation to `/org/[orgId]`

## Summary

Updated the workspace sidebar so console destinations use the org-scoped routes:

- Overview → `/org/{id}`
- Providers → `/org/{id}/providers`
- Models → `/org/{id}/models`
- Child Keys → `/org/{id}/child-keys`
- Analytics → `/org/{id}/analytics`

Active-state matching is exact for Overview and prefix-based for the other sections. Organization in the Account section now points at `/organization` (the real route) instead of `/workspace/organization`.

## Files touched

- `components/workspace/workspace-sidebar.tsx`

## How to verify

1. `npx eslint components/workspace/workspace-sidebar.tsx`
2. `npm run dev`
3. Sign in and open `/workspace` (redirects to `/org/{id}`).
4. Click Overview, Providers, Models, Child Keys, and Analytics. Confirm each URL is under `/org/{id}/...` and the matching sidebar item is highlighted.
5. With two organizations, switch orgs on Providers and confirm the URL becomes `/org/{newId}/providers`.

## Follow-ups / next steps

- Update in-page back links and feature cards that still point at `/workspace/...`.
