# 051 — Model test button (backend proxy smoke test)

## Summary of changes

Added a **Test** action on each registered model row that smoke-tests the model through the gateway proxy. The call runs entirely on the server so decrypted child API keys never reach the browser.

- New server action `testModel(modelId)`:
  - Auth + ownership checks on the model/provider
  - Loads one active, non-expired child key for the session user and decrypts it
  - POSTs a minimal completion payload to the proxy:
    - OpenAI-compatible: `${NEXT_PUBLIC_PROXY_API_URL}/openai/chat/completions`
    - Anthropic-compatible: `${NEXT_PUBLIC_PROXY_API_URL}/anthropic/v1/messages`
  - Default proxy base URL: `http://localhost:8080` when `NEXT_PUBLIC_PROXY_API_URL` is unset
  - Success when HTTP status is **200** or **201**
- UI: **Test** button on each model row with loading state and toast feedback

## Files touched

- `apps/gateway-portal/app/server-actions/model/test-model.ts` (new)
- `apps/gateway-portal/components/models/model-management-client.tsx`
- `apps/gateway-portal/tasks/ai/051-model-test-button.md` (this log)

## How to verify

1. Ensure the gateway proxy is running and at least one **active child key** exists for the signed-in user.
2. Optionally set `NEXT_PUBLIC_PROXY_API_URL` (defaults to `http://localhost:8080`).
3. Open Workspace → Providers → Models for a provider.
4. Click **Test** on a registered model.
5. Expect a success toast on HTTP 200/201, or an error toast with proxy/status details otherwise.

```bash
cd apps/gateway-portal && npx tsc --noEmit
```

## Follow-ups / next steps

- Optionally surface a short snippet of the assistant reply in the success toast.
- Consider requiring `max_tokens` on Anthropic probes if upstream rejects requests without it.
- Unit-test payload builders and status success criteria if this path grows.
