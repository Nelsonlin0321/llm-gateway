# Parsing Layer + Creator-Scoped Provider/Model Resolution

## Goal

- Decouple request parsing / payload preparation / upstream URL building from the proxy forwarder.
- Ensure provider + model resolution is scoped by the authenticated creator (`childKeyPayload.creator_id`).

## What Changed

### 1) New shared upstream proxy handler

- Added a generic upstream forwarder that only needs a precomputed context (upstream URL, headers, body, provider id, etc.).
- File: [upstream-proxy.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/upstream-proxy.ts)
- Key context shape: `proxyContext` containing:
  - `childKeyPayload`
  - `upstreamModel`
  - `masterApiKey`
  - `upstreamUrl`
  - `upstreamHeaders`
  - `upstreamBody`

### 2) OpenAI + Anthropic “proxy handlers” now act as parsing middleware

- `createOpenaiProxyHandler` and `createAnthropicProxyHandler` now:
  - parse JSON
  - validate + transform payload (`prepareOpenaiPayload` / `prepareAnthropicPayload`)
  - resolve upstream credentials + model mapping
  - build upstream URL and headers
  - set `proxyContext` on the request context
  - call `next()` so the shared upstream proxy handler can forward
- Files:
  - [proxy-openai.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy-openai.ts)
  - [proxy-anthropic.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy-anthropic.ts)

### 3) Route wiring updated to “parse → proxy”

- Routes now chain parsing middleware and the shared upstream forwarder.
- File: [index.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/index.ts#L104-L114)

### 4) Provider/model resolution is creator-scoped

- `creatorId` is now required for:
  - `resolveProvider(...)`
  - `resolveProviderModel(...)`
  - `ProviderLookup.findByName(...)`
  - `ProviderModelLookup.findByNameAndAlias(...)`
  - `defaultProviderModelLookup` now filters by `provider.creatorId`
- Provider-model Redis cache keys now include `creatorId` for isolation.
- Files:
  - [resolve.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/providers/resolve.ts)
  - [redis-keys.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/lib/redis-keys.ts)

## Tests

- Updated unit tests to reflect:
  - parsing middleware + shared upstream proxy handler composition
  - creatorId now required for provider/provider-model resolution
- Files:
  - [proxy-openai.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/proxy-openai.test.ts)
  - [proxy-anthropic.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/proxy-anthropic.test.ts)
  - [resolve.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/providers/resolve.test.ts)

## Notes

- The upstream proxy handler intentionally does not parse/modify payloads; it forwards what parsing middleware computed.
- Provider/model resolution now requires `creator_id` to avoid cross-creator lookup/caching collisions.
