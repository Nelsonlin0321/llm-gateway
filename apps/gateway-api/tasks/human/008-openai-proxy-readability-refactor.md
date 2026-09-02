## Summary of Changes

- Refactored the OpenAI proxy model-resolution call site to improve readability.
- Extracted the dependency fallback into `getResolveProviderModel`, so `injectContext` now resolves the function once and calls it with a normal multiline invocation.

## Files Touched

- `apps/gateway-api/src/proxy/proxy-openai.ts`

## How to Verify

- Review the refactor in `apps/gateway-api/src/proxy/proxy-openai.ts`.
- Run:
  - `bun test` (from `apps/gateway-api`)

## Verification Notes

- `bun test` currently fails because of pre-existing suite issues unrelated to this refactor:
  - live provider tests return `401 Unauthorized` for some providers
  - multiple tests fail under Bun with `NotImplementedError: test() inside another test() is not yet implemented`

## Follow-ups / Next Steps

- If needed, split live tests from default local test runs or gate them behind environment checks.
- Migrate remaining `node:test` cases to a Bun-compatible structure if this suite should run cleanly under `bun test`.
