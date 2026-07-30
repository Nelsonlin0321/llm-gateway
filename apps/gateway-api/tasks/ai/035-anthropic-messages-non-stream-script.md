## Summary

Added a non-streaming smoke-test script for the gateway `/anthropic/v1/messages` endpoint that reuses the existing Anthropic payload template and exercises all configured Anthropic-compatible providers.

## Files Touched

- /Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/scripts/anthropic/messages/test-non-stream.ts

## How To Verify

From `apps/gateway-api`, with the proxy running and `CHILD_API_KEY` set:

```bash
npm run dev
```

In another shell:

```bash
npx tsx scripts/anthropic/messages/test-non-stream.ts
```

Optional:

```bash
npm test
```

## Follow-ups / Next Steps

- Consider adding this script to the `apps/gateway-api/README.md` testing section if we want it discoverable alongside the OpenAI smoke tests.
