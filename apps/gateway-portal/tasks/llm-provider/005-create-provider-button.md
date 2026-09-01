# 005 — Show a create-provider button on the providers page

## Summary

The providers page had an "Add provider" control in the card, but it was hidden whenever `role` was null. Role was loaded from `session.activeOrganizationId` instead of the `/org/[organizationId]` route, so a missing session org made `canCreate` false even for root/admin members.

The page now takes `organizationId` from the URL (same pattern as models), uses that membership for permission checks, and renders **Add provider** in the page header, card header, and empty state. Create/list now target that organization instead of only the session's active org.

## Files touched

- `app/(workspace)/org/[organizationId]/providers/page.tsx` — pass `organizationId` from route params
- `components/llm-providers/providers-management-section.tsx` — resolve role and list by URL org
- `components/llm-providers/provider-management-client.tsx` — page-header + card **Add provider** actions
- `components/llm-providers/provider-management-skeleton.tsx` — header placeholder
- `app/server-actions/llm-provider/get-providers.ts` — optional `organizationId`
- `app/server-actions/llm-provider/create-provider.ts` — create into the URL org
- `app/server-actions/llm-provider/update-provider.ts` / `delete-provider.ts` — revalidate `/org/...` paths
- `app/server-actions/llm-provider/shared.ts` — `revalidateOrganizationProviderPaths`
- `lib/llm-provider/schema.ts` — `organizationId` on get-providers options
- `tests/llm-provider/schema.test.ts`

## How to verify

```bash
cd apps/gateway-portal
./node_modules/.bin/tsc --noEmit
npm test -- tests/llm-provider/schema.test.ts tests/organization/permissions.test.ts
```

Manual:

1. Sign in as the organization **root** or **admin**.
2. Open `/org/{id}/providers`.
3. Confirm **Add provider** is in the page header (and in the card header / empty state).
4. Create a provider and confirm it appears in the list.

Viewer/member roles should still not see the button.

## Follow-ups / next steps

- Child Keys still resolves role from `session.activeOrganizationId`; apply the same URL-org pattern there.
- Persist `activeOrganizationId` on the session when the layout falls back to the first organization, so other session-scoped actions stay in sync.
