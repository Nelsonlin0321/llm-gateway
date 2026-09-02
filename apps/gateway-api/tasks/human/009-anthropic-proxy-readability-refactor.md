## Summary of Changes

- Refactored the Anthropic proxy model-resolution call site to improve readability.
- Extracted the dependency fallback into `getResolveProviderModel`, so `injectContext` now resolves the function once and calls it with a normal multiline invocation.

## Files Touched

- `apps/gateway-api/src/proxy/proxy-anthropic.ts`

## How to Verify

- Review the refactor in `apps/gateway-api/src/proxy/proxy-anthropic.ts`.
- Run:
  - `bun test tests/proxy-anthropic.test.ts`

## Follow-ups / Next Steps

- Consider keeping the OpenAI and Anthropic proxy handlers structurally aligned when future proxy-resolution changes are made.
