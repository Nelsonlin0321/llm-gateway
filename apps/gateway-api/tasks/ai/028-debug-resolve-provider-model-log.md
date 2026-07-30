# 028 — Debug logging for provider+model resolution

## Summary of changes

- Added an env-gated debug log in the OpenAI proxy to print the resolved provider/model mapping without leaking API keys.
- The log is enabled only when `GATEWAY_DEBUG_RESOLVE=1` is set.

## Files touched

- `apps/gateway-api/src/proxy-openai.ts`

## How to verify

```bash
cd apps/gateway-api
GATEWAY_DEBUG_RESOLVE=1 npm run dev
```

- Send an OpenAI-compatible request and confirm `resolveProviderModel` logs appear in stdout.
