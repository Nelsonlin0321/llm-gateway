# 026 — OpenAI provider and model alias resolution

## Summary of changes

- Updated OpenAI payload preparation to validate and parse the client model identifier without converting the alias to an upstream model name.
- Added a Prisma-backed provider-and-model resolver that validates `LLMProvider.name` plus `Model.alias` and returns the registered upstream `Model.name`.
- Updated the OpenAI proxy to resolve both provider credentials and the upstream model name before forwarding requests.
- Added test coverage for the new payload behavior, provider-model resolution, and proxy forwarding.

## Files touched

- `apps/gateway-api/src/payload-openai.ts`
- `apps/gateway-api/src/types/payload.ts`
- `apps/gateway-api/src/providers/resolve.ts`
- `apps/gateway-api/src/proxy-openai.ts`
- `apps/gateway-api/tests/payload-openai.test.ts`
- `apps/gateway-api/tests/proxy-openai.test.ts`
- `apps/gateway-api/tests/providers/resolve.test.ts`

## How to verify

```bash
cd apps/gateway-api
npm test
```

- Send an OpenAI-compatible request using `model: "{provider}/{alias}"`.
- Confirm the gateway validates the provider and alias registration and forwards `Model.name` upstream.

## Follow-ups / next steps

- Consider applying the same provider+model registration lookup to Anthropic-compatible requests if those routes should also validate aliases against Prisma models.
