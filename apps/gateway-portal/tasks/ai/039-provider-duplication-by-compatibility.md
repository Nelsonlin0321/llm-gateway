# 039 - Provider duplication by compatibility

## Summary of changes

- Updated provider create/update validation to treat providers as duplicates when both `name` and `compatibilityType` match, regardless of `isActive`.
- Adjusted error messaging to reflect the new uniqueness condition.

## Files touched

- `app/server-actions/llm-provider/create-provider.ts`
- `app/server-actions/llm-provider/update-provider.ts`

## How to verify

```bash
npm run lint
npm test
npm run build
```

