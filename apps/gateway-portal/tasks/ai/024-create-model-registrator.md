# 024 — Model registrator under provider

## Summary of changes

Implemented model registration for a specific LLM provider per `tasks/human/004-create-model-registrator.md`.

- Sidebar **Models** nav item (active on `/workspace/[providerId]/models`)
- Page `/workspace/[providerId]/models` to list and create models
- Server actions with creator-only authorization
- Validation: name, alias, input/output/cache prices required; prices must be **positive**
- Model names are **not** unique (duplicates allowed)
- Provider list row includes **Models** deep-link
- Regenerated Prisma client for existing `Model` table

## Files touched

### Domain / backend
- `lib/model/schema.ts`
- `lib/model/service.ts`
- `app/server-actions/model/shared.ts`
- `app/server-actions/model/get-models.ts`
- `app/server-actions/model/create-model.ts`
- `generated/prisma/*` (via `prisma generate`)

### UI / routes
- `app/workspace/[providerId]/models/page.tsx`
- `app/workspace/[providerId]/models/loading.tsx`
- `components/models/model-form-modal.tsx`
- `components/models/model-management-client.tsx`
- `components/models/model-management-section.tsx`
- `components/models/model-management-skeleton.tsx`
- `components/workspace/workspace-sidebar.tsx`
- `components/llm-providers/provider-management-client.tsx`

### Tests / log
- `tests/model/schema.test.ts`
- `tasks/ai/024-create-model-registrator.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npx eslint app/workspace/\[providerId\] components/models lib/model app/server-actions/model
npm run dev
```

Manual:
1. Sign in → Providers → open **Models** on a provider you own
2. Register a model with name, alias, and three positive prices
3. Confirm list updates; duplicate model names are allowed
4. Visiting another user’s provider id should 404 (not found / forbidden)

## Follow-ups / next steps

- Edit / delete model actions
- Optional unique constraint on `(providerId, alias)` if routing requires it
- Surface model counts on the providers list and workspace readiness checklist

## Update — alias input UX

- Downstream alias UI shows a fixed `{providerName}/` prefix + editable model segment only
- Stored alias is composed server-side as `{providerName}/{suffix}` (e.g. `minimax/gpt-4.1`)
- Placeholder is the model segment (`gpt-4.1`), not the full route
