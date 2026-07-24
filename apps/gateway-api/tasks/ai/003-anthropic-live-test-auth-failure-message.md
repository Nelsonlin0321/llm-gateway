# Improve Anthropic Live Test Error Output

## Summary

Improved the Anthropic `/anthropic/v1/messages` live tests to surface upstream auth/config errors directly, instead of failing first on stream content-type assertions.

## Files Touched

- `apps/gateway-api/tests/anthropic-messages-live.ts`

## What Changed

- When streaming requests fail (non-2xx), the test now fails immediately with a message that includes:
  - status + response body
  - a hint to check the provider API key env var (e.g. `MINIMAX_API_KEY`)
- For non-streaming JSON requests, the failure message now also includes the same env var hint.

## How To Verify

Unit tests:

```bash
cd apps/gateway-api
npm test
```

Live tests:

```bash
cd apps/gateway-api
npm run test:anthropic-messages
```

## Follow-ups

- If you still see `invalid api key`, rotate/update `MINIMAX_API_KEY` and re-run `npm run test:anthropic-messages`.
