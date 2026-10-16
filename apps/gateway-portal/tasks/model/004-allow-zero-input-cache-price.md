# 004 — Allow a zero input cache price

## Summary

Input cache price per 1M tokens can be `0` when a model has no cached-input charge. Create and update validation still require input and output prices to be greater than zero, and still reject a blank or negative cache price.

## Files touched

- `lib/model/schema.ts` — `inputCachePrice` uses a non-negative price schema
- `tests/model/schema.test.ts` — zero, blank, and negative cache price cases

## How to verify

```bash
cd apps/gateway-portal && node --import tsx --test tests/model/schema.test.ts
```

On `/org/{organizationId}/models`, register or edit a model with input cache price `0`. The form accepts it. A blank cache price or a negative value still shows a field error. Input and output prices of `0` are still rejected.

## Follow-ups / next steps

- None
