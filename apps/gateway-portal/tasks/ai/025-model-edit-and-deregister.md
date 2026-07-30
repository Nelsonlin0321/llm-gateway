# 025 — Model edit and deregister

## Summary of changes

Added end-to-end **Edit** and **Deregister** for models on the provider models page.

- Server actions: `updateModel`, `deleteModel` (creator-only via provider ownership)
- Shared update schema/service builders; full alias still composed as `{providerName}/{suffix}`
- UI: Edit opens the model form in edit mode; Deregister confirms then hard-deletes
- List refreshes after success via `router.refresh()` + path revalidation

## Files touched

- `lib/model/schema.ts` — `updateModelInputSchema`, `parseModelAliasSuffix`
- `lib/model/service.ts` — `buildModelUpdateData`, `validateUpdateModelInput`
- `app/server-actions/model/update-model.ts`
- `app/server-actions/model/delete-model.ts`
- `components/models/model-form-modal.tsx` — create/edit modes
- `components/models/model-management-client.tsx` — Edit / Deregister + confirm dialog
- `tests/model/schema.test.ts`
- `tasks/ai/025-model-edit-and-deregister.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npm run dev
```

Manual:
1. Open `/workspace/{providerId}/models`
2. Edit a model (name, alias segment, prices) → Save → list updates
3. Deregister a model → confirm → row removed
4. Non-owner / missing model ids return action errors

## Follow-ups / next steps

- Soft-delete / audit trail for deregister events
- Bulk deregister
