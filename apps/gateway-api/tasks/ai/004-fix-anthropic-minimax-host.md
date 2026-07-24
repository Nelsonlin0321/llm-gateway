# Fix Anthropic MiniMax Host

## Summary

Fixed the Anthropic-compatible MiniMax provider host. The configured host was `api.minimax.com`, which Node could not resolve, causing the gateway to return `502 fetch failed`.

## Files Touched

- `apps/gateway-api/src/providers.ts`

## What Changed

- Updated the Anthropic MiniMax base URL from:
  - `https://api.minimax.com/anthropic`
- To:
  - `https://api.minimax.io/anthropic`

## How To Verify

From `apps/gateway-api`:

```bash
npm test
npm run test:anthropic-messages
```

## Notes

- `test:openai-chat` was unaffected because the OpenAI-compatible MiniMax route uses a different configured host.
