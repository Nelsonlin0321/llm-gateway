# Fix Anthropic MiniMax Host

## Summary

Fixed the Anthropic-compatible MiniMax provider URL in `src/providers.ts`. The configured Anthropic upstream URL was incorrect, which caused the gateway to return `502 fetch failed`.

## Files Touched

- `apps/gateway-api/src/providers.ts`

## What Changed

- Corrected the Anthropic MiniMax `baseUrl` entry under `anthropicCompatibleProviders.minimax`
- This restored the gateway's ability to reach the Anthropic-compatible upstream endpoint

## How To Verify

From `apps/gateway-api`:

```bash
npm test
npm run test:anthropic-messages
```

## Notes

- `test:openai-chat` was unaffected because the OpenAI-compatible MiniMax route uses a different configured host.
