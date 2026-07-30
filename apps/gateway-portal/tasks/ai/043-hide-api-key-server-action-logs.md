## Summary
- Disables terminal logging of Server Function (Server Action) invocations in development so sensitive fields like provider API keys are not printed.

## Files Touched
- [next.config.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/next.config.ts)

## How To Verify
1. Start the portal in dev mode:
   - `cd apps/gateway-portal && npm run dev`
2. Go to the Providers page and create/update a provider with an API key.
3. Confirm the terminal no longer prints lines like:
   - `└─ ƒ updateProvider({ "apiKey": "..." }) ...`

## Notes / Follow-ups
- This only affects development logging. It does not change how API keys are stored or transmitted.
