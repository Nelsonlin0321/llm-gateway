# Anthropic Messages Live Tests

## Summary

Added live integration tests for the Anthropic-compatible proxy endpoint `/anthropic/v1/messages`, covering both non-streaming and streaming responses, modeled after the existing OpenAI chat completion live tests.

## Files Touched

- `apps/gateway-api/tests/fixtures/sample-anthropic-payload.json`
- `apps/gateway-api/tests/anthropic-messages-live.ts`
- `apps/gateway-api/tests/anthropic-messages-json.live.test.ts`
- `apps/gateway-api/tests/anthropic-messages-stream.live.test.ts`
- `apps/gateway-api/package.json`
- `apps/gateway-api/README.md`

## What Changed

- Added an Anthropic messages payload fixture (`sample-anthropic-payload.json`) and helper utilities (`anthropic-messages-live.ts`) similar to `openai-chat-completions-live.ts`.
- Added two live tests:
  - `anthropic-messages-json.live.test.ts` (expects JSON response and valid assistant text)
  - `anthropic-messages-stream.live.test.ts` (expects SSE stream and non-empty body)
- Added a single npm script to run both tests:
  - `npm run test:anthropic-messages`

## How To Verify

Ensure the gateway is running (defaults to `http://localhost:8080` or set `PROXY_BASE_URL`), then run:

```bash
cd apps/gateway-api
npm run test:anthropic-messages
```

Optional narrowing:

```bash
PROXY_TEST_PROVIDERS=minimax npm run test:anthropic-messages
```

## Notes

- The live tests are skipped unless `LIVE_PROXY_TEST=1` is set.
