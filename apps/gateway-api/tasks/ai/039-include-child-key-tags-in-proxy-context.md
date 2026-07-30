# Include child key tags in proxy context

## Goal

Expose the authenticated child key `tags` on the upstream proxy handoff object (`proxyContext`) so downstream proxy middleware can use them for logging, policy, routing, or attribution.

## Background

- Child key auth resolves the child key record from the database in [service.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/child-keys/service.ts#L169) via `authorizeChildKey(...)`.
- The middleware stores tags on the request context as `childKeyTags` in [middleware.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/child-keys/middleware.ts#L30-L33).
- Proxy handlers construct a typed `proxyContext` object which is later consumed by the upstream forwarding handler.

## Change

- Extended `UpstreamProxyContext` to include `childKeyTags: Record<string, unknown>` in [upstream-proxy.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/upstream-proxy.ts#L6-L15).
- Populated `childKeyTags` when constructing `proxyContext` in:
  - [proxy-openai.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/proxy-openai.ts#L45-L75)
  - [proxy-anthropic.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/proxy-anthropic.ts#L44-L72)

## Notes

- `ChildKey.tags` is a Prisma `Json` column with default `{}`, so it is expected to be an object/dictionary. The proxy layer defensively coerces non-object JSON values to `{}` before storing on `proxyContext`.

