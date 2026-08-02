# 022 — Proxy Redis stream log schema before database ingest

**Status:** Done (minimum request-side schema shipped; response fields deferred)
**App:** `gateway-api`
**Depends on:** `010-usage-event-emission.md`, `012-request-log-capture-and-redaction.md`, `tasks/human/05-redis-stream-as-buffer.md`

---

## Goal

Define what the proxy should publish into a Redis Stream as the request/response buffer before any database writer consumes it.

This is based on the current code paths in:

- `src/proxy/proxy-openai.ts`
- `src/proxy/proxy-anthropic.ts`
- `src/proxy/upstream-proxy.ts`
- `src/payload/payload-openai.ts`
- `src/payload/payload-anthropic.ts`
- `src/shared/upstream.ts`
- `src/child-keys/middleware.ts`
- `src/child-keys/authorize.ts`
- `src/child-keys/types.ts`

The schema below is meant to be realistic for the current codebase, not an abstract wishlist.

---

## Key observations from the current code

1. The proxy already knows:
   - gateway request path (`new URL(c.req.url).pathname`)
   - the parsed provider name + downstream model alias (via `prepare*Payload(...)` → `parseModel(...)`)
   - the downstream request context object currently assembled in proxy handlers:
     - `provider`
     - `requestedModel` (downstream model alias)
     - `requestedModelAlias` (`${provider}/${requestedModel}`)
     - `apiFamily` (from `resolveProviderModel(...).compatibilityType`)
     - `metadataJson`
   - the resolved upstream model and upstream base URL (via `resolveProviderModel(...)`)
   - the upstream URL (via `buildUpstreamUrl(...)`)
   - the rewritten upstream request body JSON (`proxyContext.upstreamBody`)
   - the computed upstream request headers (`proxyContext.upstreamHeaders`, includes provider `Authorization` and must be redacted before logging)
   - request `metadata` extracted from the client body (separate from upstream body)
   - whether the client requested streaming (`stream === true` on OpenAI; inferred by clients on Anthropic)
2. `requireChildKeyAuth` middleware currently puts `childKeyRecord` (Prisma `ChildKey`) on Hono context.
3. `childKeyRecord` includes fields that are useful for attribution and joins (`id`, `name`, `creatorId`, `issuedAt`, `expiresAt`, `tags`, `userEmail`), but also includes `key` and must be handled carefully.
4. There is no request-id middleware yet, so `request_id` should be added explicitly.
5. The current proxy implementation returns the upstream `Response` as-is; status code, response headers/body, and stream timings require explicit response interception/instrumentation.
6. `012-request-log-capture-and-redaction.md` already says full payload capture must be gated by capture level.

---

## Recommendation

Use one Redis Stream entry per proxied request, with:

- small scalar fields flattened at top level
- large or nested data stored as JSON strings
- payload capture controlled by a log level (`metadata`, `redacted`, `full`)

Suggested stream name:

- `llm-gateway-request-logs`

Suggested top-level discriminator fields:

- `schema_version=1`
- `event_type=request_log`

---

## Recommended fields

### 1. Event envelope

These should be present on every entry. Fields marked as `v2` require extra middleware/instrumentation beyond the current pass-through proxy implementation.

| Field            | Required | Notes                                                                             |
| ---------------- | -------- | --------------------------------------------------------------------------------- |
| `schema_version` | yes      | Start with `1` for forward compatibility.                                         |
| `event_type`     | yes      | `request_log`.                                                                    |
| `event_id`       | yes      | Unique event id for the Redis entry payload.                                      |
| `request_id`     | v2       | Gateway-generated correlation id; not present yet, should be added in middleware. |
| `logged_at`      | yes      | ISO timestamp when the log event is emitted.                                      |
| `started_at`     | v2       | ISO timestamp when proxy handling begins.                                         |
| `completed_at`   | v2       | ISO timestamp when response finishes or errors.                                   |

### 2. Routing and protocol

These are directly implied by the current proxy code.

| Field                   | Required    | Notes                                                                                            |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `gateway_path`          | yes         | Example: `/openai/v1/chat/completions`, `/anthropic/v1/messages`.                                |
| `http_method`           | yes         | Currently `POST`, but keep generic.                                                              |
| `api_family`            | yes         | `proxyContext.apiFamily` (compatibility type from model resolution, e.g. `openai`, `anthropic`). |
| `provider`              | yes         | Parsed provider id such as `minimax`, `openai`, `deepseek`, `azure`.                             |
| `requested_model`       | yes         | `proxyContext.requestedModel` (parsed downstream model alias), e.g. `minimax-m3`.                |
| `requested_model_alias` | recommended | `proxyContext.requestedModelAlias` (provider-qualified alias), e.g. `minimax/minimax-m3`.        |
| `upstream_model`        | yes         | `proxyContext.upstreamModel`.                                                                    |
| `upstream_url`          | yes         | Final URL from `buildUpstreamUrl(...)`.                                                          |
| `is_stream`             | yes         | OpenAI: boolean from request body `stream === true`.                                             |
| `response_mode`         | yes         | `json` or `sse`. Helps downstream consumers avoid guessing from payload shape.                   |

### 3. Child key / caller identity

These are important for attribution and later joins.

| Field                  | Required    | Notes                                                 |
| ---------------------- | ----------- | ----------------------------------------------------- |
| `child_key_id`         | yes         | `childKeyRecord.id`.                                  |
| `child_key_name`       | yes         | `childKeyRecord.name`.                                |
| `child_key_creator_id` | yes         | `childKeyRecord.creatorId`.                           |
| `child_key_issued_at`  | yes         | `childKeyRecord.issuedAt` (unix seconds).             |
| `child_key_expires_at` | optional    | `childKeyRecord.expiresAt` (ISO timestamp or null).   |
| `child_key_tags_json`  | recommended | `childKeyRecord.tags` as JSON string.                 |
| `child_key_user_email` | optional    | `childKeyRecord.userEmail`; consider treating as PII. |

Do **not** log:

- the presented plain child API key
- `childKeyRecord.key` (encrypted child key from the database)
- any JWT secret or provider API key

### 4. Request capture

| Field                           | Required    | Notes                                                                                                                                             |
| ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request_content_type`          | yes         | Usually `application/json`.                                                                                                                       |
| `request_headers_json`          | yes         | Sanitized headers only; omit `authorization`.                                                                                                     |
| `request_payload_json`          | conditional | Original client JSON body after capture-level policy is applied.                                                                                  |
| `upstream_request_payload_json` | conditional | Rewritten body actually sent upstream. Important because model is rewritten and OpenAI streaming may force `stream_options.include_usage = true`. |
| `upstream_request_headers_json` | recommended | Sanitized upstream headers. Note: current in-memory `upstreamHeaders` includes provider `Authorization` and must be redacted before logging.      |
| `metadata_json`                 | optional    | Request `metadata` extracted from the client body. Stored separately from the upstream payload in current code.                                   |
| `capture_level`                 | yes         | `metadata`, `redacted`, or `full`.                                                                                                                |

Recommendation:

- store **both** `request_payload_json` and `upstream_request_payload_json`
- this matters because the gateway mutates the outgoing payload

### 5. Response capture

These fields are useful, but require explicit response interception/instrumentation; the current proxy returns upstream responses as-is.

| Field                   | Required    | Notes                                                                                                      |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `status_code`           | yes         | Final status returned to the client.                                                                       |
| `response_content_type` | yes         | Useful to distinguish JSON vs SSE.                                                                         |
| `response_headers_json` | recommended | Sanitized response headers.                                                                                |
| `response_payload_json` | conditional | For non-stream JSON responses.                                                                             |
| `response_stream_text`  | conditional | For streaming responses, store raw or truncated SSE transcript depending on capture level.                 |
| `response_id`           | recommended | Upstream response id when present in body/chunks. Not guaranteed today.                                    |
| `error_type`            | optional    | `invalid_request_error`, `authentication_error`, `server_error`, or upstream/provider-specific error type. |
| `error_message`         | optional    | Redacted as needed.                                                                                        |

Recommendation:

- for JSON responses, populate `response_payload_json`
- for SSE responses, populate `response_stream_text`
- keep `response_id` separate because it is highly useful for debugging and joins

### 6. Timing and streaming performance

| Field                 | Required    | Notes                                                   |
| --------------------- | ----------- | ------------------------------------------------------- |
| `duration_ms`         | yes         | Total request duration.                                 |
| `first_token_ms`      | conditional | Only for streaming responses; null for JSON/non-stream. |
| `stream_chunk_count`  | optional    | Helpful for diagnosing interrupted or partial streams.  |
| `upstream_started_at` | optional    | If instrumented separately from overall request start.  |

`first_token_ms` is worth keeping even if it requires extra streaming instrumentation, because it measures user-visible latency better than total duration.

### 7. Usage and cost metadata

These align with `010` and `011`.

| Field                   | Required | Notes                                      |
| ----------------------- | -------- | ------------------------------------------ |
| `input_tokens`          | optional | From provider usage object when available. |
| `output_tokens`         | optional | From provider usage object when available. |
| `cache_creation_tokens` | optional | If provider exposes cache usage later.     |
| `cache_read_tokens`     | optional | If provider exposes cache usage later.     |
| `cost_usd`              | optional | For later enrichment from model pricing.   |
| `finish_reason`         | optional | Good for analytics and debugging.          |

---

## Minimum schema I would ship first

If we want a practical first version that matches the current codebase without adding response interception, I would ship these fields first:

- `schema_version`
- `event_type`
- `event_id`
- `logged_at`
- `gateway_path`\*
- `http_method`
- `api_family`\*
- `provider`
- `requested_model`
- `requested_model_alias`
- `upstream_model`
- `upstream_url`
- `is_stream`
- `child_key_id`
- `child_key_name`
- `child_key_creator_id`
- `child_key_issued_at`
- `child_key_tags_json`
- `request_headers_json`
- `request_payload_json`
- `metadata_json`
- `upstream_request_payload_json`
- `capture_level`

Then add (requires new instrumentation beyond the current pass-through proxy):

- `request_id`
- `response_mode`
- `started_at`
- `completed_at`
- `status_code`
- `response_content_type`
- `response_headers_json`
- `response_payload_json` or `response_stream_text`
- `duration_ms`
- `first_token_ms`
- `error_type`
- `error_message`
- `response_id`

---

These fields will be calculated later at another service before the redis log is written into database:

- token usage fields
- `cost_usd`

## Fields I would not rely on yet

These are useful, but not naturally available in the current implementation without extra work:

| Field                            | Why not first                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `request_id`                     | No request-id middleware exists yet.                                                          |
| `status_code`                    | Requires response interception; current proxy returns upstream responses as-is.               |
| `response_content_type`          | Requires response interception; current proxy returns upstream responses as-is.               |
| `response_payload_json`          | Requires response interception and buffering; current proxy returns upstream responses as-is. |
| `response_stream_text`           | Requires stream interception; current proxy returns upstream responses as-is.                 |
| `duration_ms`                    | Requires timing instrumentation.                                                              |
| `response_id`                    | Needs response parsing for both JSON and SSE.                                                 |
| `first_token_ms`                 | Needs stream interception instead of plain pass-through proxy only.                           |
| `child_key_user_email`           | Available today, but it is PII; consider excluding or hashing at lower capture levels.        |
| `input_tokens` / `output_tokens` | Needs usage extraction from JSON or final SSE chunk.                                          |

---

## Redaction rules

This should follow `012-request-log-capture-and-redaction.md`.

### Always redact / never store

- request `Authorization` header
- provider upstream `Authorization` header
- plain child API key
- encrypted DB child key
- raw provider API key values

### Capture-level behavior

| Level      | What to store                                                            |
| ---------- | ------------------------------------------------------------------------ |
| `metadata` | headers metadata, model/provider/path/status/timings, but no full bodies |
| `redacted` | metadata + redacted/truncated request and response payloads              |
| `full`     | full request and response bodies, dev-only                               |

My recommendation is:

- default production setting: `metadata`
- allow `redacted` for enterprise debugging
- keep `full` only for local/dev or explicitly controlled environments

---

## Suggested Redis Stream payload shape

Because Redis Stream entries are flat key/value pairs, nested values should be stringified JSON:

| Field                           | Suggested encoding |
| ------------------------------- | ------------------ |
| `request_headers_json`          | JSON string        |
| `request_payload_json`          | JSON string        |
| `upstream_request_payload_json` | JSON string        |
| `response_headers_json`         | JSON string        |
| `response_payload_json`         | JSON string        |
| `response_stream_text`          | UTF-8 string       |
| `child_key_tags_json`           | JSON string        |

---

## Small implementation notes from the current codebase

1. Add a request-id middleware before auth/proxy routes.
2. Extend auth middleware context so the proxy can access selected DB fields from `authorizeChildKey(...)`, not only the JWT payload.
3. Wrap the proxied response path so we can:
   - measure `duration_ms`
   - measure `first_token_ms`
   - optionally capture response body / stream transcript
   - extract usage and response id
4. Keep emit best-effort only, consistent with `010`.

---

## Final recommendation

Yes, the proxy should log the attributes you listed, but I would make the contract slightly more explicit:

- log both the client request payload and the rewritten upstream payload
- log both gateway path and final upstream URL
- log child-key identity fields for attribution
- log status, content type, and error fields
- log `duration_ms` and `first_token_ms`
- log whether the response is JSON or SSE
- log payloads only under the configured capture level

If we follow this shape, the Redis Stream entry will be useful for:

- request debugging
- support audits
- analytics enrichment
- later database ingestion without losing gateway-specific context
