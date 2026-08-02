## Summary
- Added optional upstream request logging as a reproducible curl command (behind `UPSTREAM_CURL_LOG=1`).
- Ensured curl output strips sensitive headers and respects request-log capture levels for request bodies.

## Files Touched
- [upstream-proxy.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/upstream-proxy.ts)
- [curl.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/proxy/curl.ts)
- [proxy-curl.test.ts](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/tests/proxy-curl.test.ts)

## How To Verify
- `cd apps/gateway-api && bun test`
- Run the API with curl logging enabled:
  - `UPSTREAM_CURL_LOG=1 bun run dev`
  - Send any proxied request and observe a printed `curl ...` command in stdout.

## Notes
- The curl command omits `authorization`, `x-api-key`, `api-key`, `proxy-authorization`, `cookie`, and `set-cookie` headers.
- Request body logging is omitted when `REQUEST_LOG_CAPTURE_LEVEL=metadata`.
