# Capture Request Metadata In Proxy Context

## Goal

- Allow clients to optionally include a `metadata` object in request payloads.
- Store this `metadata` on the Hono `proxyContext` so it is available to downstream middleware (logging/attribution).
- Do not forward `metadata` to the upstream provider.

## What Changed

- Added optional `metadata` to the prepared payload shape.
  - [payload.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/types/payload.ts)
- OpenAI payload preparation now:
  - validates `metadata` (must be an object when present)
  - returns it separately as `metadata`
  - removes it from `upstreamBody` before forwarding
  - [payload-openai.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/payload/payload-openai.ts)
- Anthropic payload preparation now does the same.
  - [payload-anthropic.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/payload/payload-anthropic.ts)
- `UpstreamProxyContext` now stores `metadata`, and both OpenAI + Anthropic proxy middleware attach it.
  - [upstream-proxy.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/upstream-proxy.ts)
  - [proxy-openai.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/proxy-openai.ts)
  - [proxy-anthropic.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/proxy-anthropic.ts)

## Tests

- Updated payload unit tests to cover:
  - `providerName` assertions (aligned with `parseModel`)
  - metadata capture + stripping behavior
  - invalid metadata rejection
  - [payload-openai.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/payload-openai.test.ts)
  - [payload-anthropic.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/payload-anthropic.test.ts)

