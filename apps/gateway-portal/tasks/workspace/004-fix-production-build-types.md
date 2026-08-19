# 004 — Fix production build type errors

## Summary

`npm run build` failed TypeScript checking. Provider list query types treated Zod-transformed `q` as a required key, so `{}` and spread options did not type-check. Child key create data omitted required `organizationId`.

`ProviderListQuery` / `GetProvidersOptions` are now explicit optional-field types. Child key creation takes the active organization id and persists it.

## Files touched

- `lib/llm-provider/schema.ts`
- `components/llm-providers/provider-management-client.tsx`
- `lib/child-key/service.ts`
- `app/server-actions/child-key/create-child-key.ts`
- `tests/child-key/service.test.ts`

## How to verify

1. `npx tsc --noEmit`
2. `node --import tsx --test tests/child-key/service.test.ts tests/llm-provider/schema.test.ts`
3. `npm run build`

## Follow-ups / next steps

- List child keys by organization instead of only `creatorId`
