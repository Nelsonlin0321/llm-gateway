Implement the ingest and transformation layer to ingest the stream event to the database two tables:
request_log, event_log for the project gateway-ingest:

You will receive an event from the stream buffer following below schema:
apps/gateway-api/src/request-log/schema.ts:L17-L76. The operation of how to ingest this request log entry to redis stream is here: apps/gateway-api/src/request-log/emit.ts

```ts
export type RequestLogV1Fields = {
  schema_version: typeof REQUEST_LOG_SCHEMA_VERSION;
  event_type: typeof REQUEST_LOG_EVENT_TYPE;
  event_id: string;
  request_id: string;
  logged_at: string;
  started_at: string;
  completed_at: string;

  gateway_path: string;
  http_method: string;
  api_family: string;
  provider_id: string;
  provider: string;
  requested_model: string;
  requested_model_alias: string;
  upstream_model: string;
  upstream_url: string;
  /** USD per 1M tokens; decimal string for Redis Stream. */
  input_price: string;
  /** USD per 1M tokens; decimal string for Redis Stream. */
  output_price: string;
  /** USD per 1M tokens; decimal string for Redis Stream. */
  input_cache_price: string;
  /** Redis stream values are strings; encode as `"true"` / `"false"`. */
  is_stream: "true" | "false";
  response_mode: ResponseMode;

  child_key_id: string;
  child_key_name: string;
  child_key_creator_id: string;
  /** Unix seconds as decimal string. */
  child_key_issued_at: string;
  child_key_tags_json: string;
  user_email: string;

  request_headers_json: string;
  /** Present when capture_level is `redacted` or `full`. */
  request_payload_json?: string;
  metadata_json: string;
  /** Present when capture_level is `redacted` or `full`. */
  upstream_request_payload_json?: string;
  capture_level: CaptureLevel;

  status_code: string;
  response_content_type: string;
  response_headers_json: string;
  /** Non-stream JSON body when capture_level allows bodies. */
  response_payload_json?: string;
  /** SSE transcript when capture_level allows bodies. */
  response_stream_text?: string;
  response_id?: string;
  error_type?: string;
  error_message?: string;

  duration_ms: string;
  /** Present for streaming responses when first byte is observed. */
  first_token_ms?: string;
  stream_chunk_count?: string;
};
```

Now, you need to ingest this event to the drizzle postgres database into two tables:
The table schema is defined in drizzle: apps/gateway-ingest/src/db/schema.ts

table 1:`request_log`. The table used to store the request and response raw log.

```
const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
};
```

```
    eventId: text().notNull(),
    requestId: text().notNull(),
    requestHeadersJson: text(),
    requestPayloadJson: text(),
    responseHeadersJson: text(),
    responseText: text(),
    statusCode: integer(),
    isStream: boolean().notNull().default(false),
    gatewayPath: text().notNull(),
    loggedAt: timestamp().notNull(),
    logDate: date().notNull(),
    ...timestamps,
```

responseText field in the database is used to store the field value of response_payload_json or response_stream_text of redis stream event. if the is_stream == 'true', then responseText is the response_stream_text, otherwise it is the response_payload_json.

table 2: `event_log` is used to store the event log of the request log entry without heavy payload of request and response, and get the token usage from the response_stream_text or response_payload_json.

The table schema is defined in drizzle: apps/gateway-ingest/src/db/schema.ts

How to get the token usage from the response_stream_text or response_payload_json?
if the is_stream == 'true', then the token usage is from the one of last n stream chunk with the token usage field. In the most case, n = 2
Example:

```jsonl
data: {"choices":[],"created":0,"id":"","model":"","object":"","prompt_filter_results":[{"prompt_index":0,"content_filter_results":{"hate":{"filtered":false,"severity":"safe"},"jailbreak":{"detected":false,"filtered":false},"self_harm":{"filtered":false,"severity":"safe"},"sexual":{"filtered":false,"severity":"safe"},"violence":{"filtered":false,"severity":"safe"}}}]}

data: {"choices":[{"content_filter_results":{},"delta":{"content":"","refusal":null,"role":"assistant"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"zRj","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":"Hi"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"ujF","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":"!"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"TZAX","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":" How"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"V","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":" can"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"g","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":" I"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"TZs","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":" help"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{"protected_material_text":{"detected":false,"filtered":false}},"delta":{"content":"?"},"finish_reason":null,"index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"uDAA","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[{"content_filter_results":{},"delta":{},"finish_reason":"stop","index":0,"logprobs":null}],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","model":"gpt-5.4-mini-2026-03-17","obfuscation":"SemAF9d4G5HwxkF","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":null}

data: {"choices":[],"created":1785610058,"id":"chatcmpl-E892Aoy89ODQ3TyvXXjI5UFYxqwFj","latency_checkpoint":{"engine_tbt_ms":3,"engine_ttft_ms":28,"engine_ttlt_ms":56,"pre_inference_ms":73,"service_tbt_ms":4,"service_ttft_ms":320,"service_ttlt_ms":362,"total_duration_ms":293,"user_visible_ttft_ms":248},"model":"gpt-5.4-mini-2026-03-17","obfuscation":"8EZi5gjGw66","object":"chat.completion.chunk","service_tier":"default","system_fingerprint":null,"usage":{"completion_tokens":11,"completion_tokens_details":{"accepted_prediction_tokens":0,"audio_tokens":0,"reasoning_tokens":0,"rejected_prediction_tokens":0},"prompt_tokens":23,"prompt_tokens_details":{"audio_tokens":0,"cached_tokens":0},"total_tokens":34}}

data: [DONE]


```

For example of the stream response are the jsonl file under this directory:apps/gateway-api/scripts/response/\*.jsonl

The field for the cachedInputToken in the database varies in the different provider's response.
check below fields in the response:

usage.prompt_tokens_details.cached_tokens
usage.cache_creation_input_tokens

The field for inputToken in the database: usage.prompt_tokens or usage.input_tokens - cachedInputToken
The field for outputToken in the database: usage.completion_tokens or usage.output_tokens

The field for total_tokens in the database: cachedInputToken + inputToken + outputToken

For the cost:
The cost is cachedInputToken/1M _ inputCachePrice + inputToken/1M _ inputPrice + outputToken/1M \* outputPrice

If you cannot extract the tokens and calculate the cost for that , all default are zero.

Additional, to make the token field value extract more scalable for other providers that haven't configured yet, Given the fields as variable to lookup, for example. To get the inputToken, the field we defined is
[
"usage.prompt_tokens",
"usage.input_tokens",
]

for output token, we define the field to be
[
"usage.completion_tokens",
"usage.output_tokens",
]

for cachedInputToken, we define the field to be
[
"usage.prompt_tokens_details.cached_tokens",
"usage.cache_creation_input_tokens",
]

Design and implement the ingest and transformation layer to ingest the stream event to the database two tables:
request_log, event_log by refactoring apps/gateway-ingest/src/index.ts to be multiple layers: ingest, transform, load, ack etc and moduleize them.

Keep the implementation straightforward, easy to understand , avoid using complex patterns, over-engineering.
