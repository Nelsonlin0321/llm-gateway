# 001 — Show a create-child-key button on the child keys page

## Summary

The child keys page had a "Create key" control in the card, but it was hidden whenever `role` was null. Role was loaded from `session.activeOrganizationId` instead of the `/org/[organizationId]` route, so a missing session org made `canCreate` false even for root/admin members.

The page now takes `organizationId` from the URL, uses that membership for permission checks, and renders **Create key** in the page header, card header, and empty state. Create/list now target that organization instead of only the session's active org.

## Files touched

- `app/(workspace)/org/[organizationId]/child-keys/page.tsx` — pass `organizationId` from route params
- `components/child-keys/child-key-management-section.tsx` — resolve role and list by URL org
- `components/child-keys/child-key-management-client.tsx` — page-header + card **Create key** actions
- `components/child-keys/child-key-management-skeleton.tsx` — header placeholder
- `app/server-actions/child-key/get-child-keys.ts` — optional `organizationId`
- `app/server-actions/child-key/create-child-key.ts` — create into the URL org
- `app/server-actions/child-key/delete-child-key.ts` / `toggle-child-key.ts` / `rotate-child-key.ts` — revalidate `/org/...` paths
- `app/server-actions/child-key/shared.ts` — `revalidateOrganizationChildKeyPaths`

## How to verify

```bash
cd apps/gateway-portal
npx eslint app/\(workspace\)/org/\[organizationId\]/child-keys/page.tsx components/child-keys/child-key-management-client.tsx components/child-keys/child-key-management-section.tsx app/server-actions/child-key/*.ts
```

Manual:

1. Sign in as the organization **root** or **admin**.
2. Open `/org/{id}/child-keys`.
3. Confirm **Create key** is in the page header (and in the card header / empty state).
4. Create a key and confirm the secret dialog appears.

Viewer/member roles should still not see the button (`member` has no `childKey` permissions).

## Follow-ups / next steps

- Persist `activeOrganizationId` on the session when the layout falls back to the first organization, so other session-scoped actions stay in sync.
