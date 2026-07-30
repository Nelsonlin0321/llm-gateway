# 024 — Load provider credentials from database

## Summary of changes

- Added a Prisma-backed provider resolver that loads `LLMProvider` rows by `name`, enforces `isActive` and compatibility checks, decrypts `encryptedApiKey`, and returns typed failure results without leaking secrets.
- Reworked the OpenAI and Anthropic proxy handlers to resolve upstream `baseUrl` and API keys from the database instead of env vars.
- Relaxed payload parsing so `provider/model` syntax is validated before provider existence is resolved asynchronously in the proxy layer.
- Added focused unit tests for provider resolution, proxy wiring, and the updated payload behavior.
- Added `src/prisma.ts` as the shared Prisma entrypoint expected by the gateway task docs and tests.

## Files touched

- `apps/gateway-api/src/prisma.ts`
- `apps/gateway-api/src/child-keys/authorize.ts`
- `apps/gateway-api/src/providers/resolve.ts`
- `apps/gateway-api/src/proxy-openai.ts`
- `apps/gateway-api/src/proxy-anthropic.ts`
- `apps/gateway-api/src/shared/upstream.ts`
- `apps/gateway-api/src/payload-openai.ts`
- `apps/gateway-api/src/payload-anthropic.ts`
- `apps/gateway-api/src/providers.ts`
- `apps/gateway-api/tests/providers/resolve.test.ts`
- `apps/gateway-api/tests/proxy-openai.test.ts`
- `apps/gateway-api/tests/proxy-anthropic.test.ts`
- `apps/gateway-api/tests/payload-openai.test.ts`
- `apps/gateway-api/tests/payload-anthropic.test.ts`

## How to verify

- `node --import tsx --test tests/payload-*.test.ts tests/proxy-*.test.ts tests/providers/**/*.test.ts tests/child-keys/**/*.test.ts`
- `npm run build`

## Follow-ups / next steps

- Consider moving the root `/` docs response off the static provider registry so it reflects database-backed routing.
- Add a live smoke test against a seeded `LLMProvider` row once a shared local or CI fixture exists.
