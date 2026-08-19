# 001 — Associate providers with the active organization

## Summary

Provider creation now writes `organizationId` from the session's active organization (after membership check). Duplicate name + compatibility is scoped per organization, and provider listing uses the same org filter.

## Files touched

- `app/server-actions/llm-provider/create-provider.ts` — persist `organizationId`, org-scoped uniqueness
- `app/server-actions/llm-provider/get-providers.ts` — list providers for the active organization
- `app/server-actions/llm-provider/update-provider.ts` — uniqueness check scoped to the provider's organization
- `lib/llm-provider/service.ts` — `buildProviderCreateData` / `buildProvidersWhereClause` take `organizationId`
- `lib/organization/service.ts` — `getOrganizationMembership`, `resolveActiveOrganizationId`
- `lib/db/schema.ts` — unique index is `(organization_id, name, compatibility_type)`
- `drizzle/migrations/0008_provider_org_unique.sql` — drop/recreate unique index, add org index
- `tests/llm-provider/service.test.ts`

## How to verify

1. Apply the migration: `npm run db:migrate`
2. `node --import tsx --test tests/llm-provider/**/*.test.ts`
3. Sign in, select an organization, create a provider on `/{organizationId}/providers`
4. Confirm the new row in `llm_provider` has the active `organization_id`
5. Switch organizations and confirm the provider is not listed there

## Follow-ups / next steps

- `createModel` and `createChildKey` still omit `organizationId` (`tsc` fails on those inserts).
- Scope update/delete ownership and workspace overview counts to the active organization, not only `creatorId`.
- Enforce organization role checks on provider mutations.
