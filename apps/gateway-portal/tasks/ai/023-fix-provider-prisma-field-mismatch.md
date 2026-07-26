# 023 - Fix provider Prisma field mismatch

## Summary of changes

Fixed the provider create/update data builders so they no longer send removed pricing fields to Prisma. Also aligned the shared provider input schema and tests with the current `LLMProvider` model, which no longer stores `inputPrice`, `inputCachePrice`, or `outputPrice`.

## Files touched

- `lib/llm-provider/service.ts`
- `lib/llm-provider/schema.ts`
- `tests/llm-provider/service.test.ts`
- `tests/llm-provider/schema.test.ts`
- `tasks/ai/023-fix-provider-prisma-field-mismatch.md`

## How to verify

From `apps/gateway-portal`:

```bash
npx eslint lib/llm-provider/schema.ts lib/llm-provider/service.ts app/server-actions/llm-provider/create-provider.ts app/server-actions/llm-provider/update-provider.ts tests/llm-provider/service.test.ts tests/llm-provider/schema.test.ts
npm test -- --test-name-pattern="provider|llm-provider"
```

Verification notes:

- ESLint passes for the touched provider files.
- Provider-related tests pass.

## Follow-ups / next steps

- If pricing moves to a separate model, reintroduce those fields through a dedicated pricing workflow instead of the provider record itself.
- Consider updating older human task docs that still mention provider pricing columns so they do not drift from the current schema.
