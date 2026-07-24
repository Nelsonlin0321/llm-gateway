# Merge OpenAI Chat Live Tests

## Summary

Merged the two live integration scripts for OpenAI-compatible `/openai/v1/chat/completions` into a single npm script so JSON and streaming checks can be run together.

## Files Touched

- `apps/gateway-api/package.json`
- `apps/gateway-api/README.md`

## What Changed

- Replaced:
  - `npm run test:json`
  - `npm run test:stream`
- With:
  - `npm run test:openai-chat`
- The new script runs both live test files in one Node test invocation via the glob:
  - `tests/openai-chat-completions-*.live.test.ts`

## How To Verify

Ensure the gateway is running (defaults to `http://localhost:8080` or set `PROXY_BASE_URL`), then run:

```bash
cd apps/gateway-api
npm run test:openai-chat
```

Optional narrowing:

```bash
PROXY_TEST_PROVIDERS=openai,deepseek npm run test:openai-chat
```

## Follow-ups

- If any external docs or automation still call `test:json` or `test:stream`, update them to use `test:openai-chat`.
