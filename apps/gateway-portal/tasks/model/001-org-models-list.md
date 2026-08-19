# 001 — List all organization models on `/org/[orgId]/models`

## Summary

`/org/[organizationId]/models` now lists every model belonging to that organization, not a single provider.

- The page reads `organizationId` from the route and loads models where `model.organization_id` matches.
- Members of the organization can view, register, edit, test, and deregister models.
- The table shows the provider name on each model. Creating a model requires choosing one of the org’s providers.
- If the org has no providers, the empty state links to `/org/{id}/providers`.
- Create now persists `organizationId` (required by the schema). Mutations revalidate `/org/{id}/models`.

## Files touched

- `app/(workspace)/org/[organizationId]/models/page.tsx`
- `app/(workspace)/org/[organizationId]/models/loading.tsx`
- `components/models/model-management-section.tsx`
- `components/models/model-management-client.tsx`
- `components/models/model-form-modal.tsx`
- `components/llm-providers/provider-management-client.tsx` — Models button → org models page
- `app/server-actions/model/get-models.ts`
- `app/server-actions/model/create-model.ts`
- `app/server-actions/model/update-model.ts`
- `app/server-actions/model/delete-model.ts`
- `app/server-actions/model/test-model.ts`
- `app/server-actions/model/shared.ts`
- `lib/model/schema.ts`
- `lib/model/service.ts`
- `tests/model/schema.test.ts`

## How to verify

1. `npm test -- tests/model/schema.test.ts`
2. `npx eslint 'app/(workspace)/org/[organizationId]/models/' components/models/ app/server-actions/model/ lib/model/schema.ts lib/model/service.ts tests/model/schema.test.ts components/llm-providers/provider-management-client.tsx`
3. `npm run dev`
4. Sign in, open `/workspace` (lands on `/org/{id}`), then Models.
5. Confirm the list includes models from every provider in that org.
6. With no providers, confirm the empty state offers “Add provider”.
7. With at least one provider, register a model (pick provider), then edit and test it.

## Follow-ups / next steps

- Filter the list by provider if the org has many models.
- Point remaining `/workspace/...` in-page links at `/org/{id}/...`.
