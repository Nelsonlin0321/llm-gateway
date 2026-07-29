# 027 — Provider lookup filtered by compatibility

## Summary of changes

- Updated the Prisma-backed provider lookups to include `compatibilityType` in the database query so a provider name can safely exist in both OpenAI and Anthropic families.
- Updated unit tests to cover the updated lookup contract.

## Files touched

- `apps/gateway-api/src/providers/resolve.ts`
- `apps/gateway-api/tests/providers/resolve.test.ts`

## How to verify

```bash
cd apps/gateway-api
npm test
```

## Follow-ups / next steps

- Consider adding a composite DB index / unique constraint on `LLMProvider (name, compatibilityType)` if not already enforced at the database level.
