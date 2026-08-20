/**
 * Request-log schema v1 — fields published to the Redis Stream buffer.
 *
 * See `tasks/ai/022-proxy-redis-stream-log-schema.md`.
 */

export const REQUEST_LOG_SCHEMA_VERSION = "1" as const;
export const REQUEST_LOG_EVENT_TYPE = "request_log" as const;

export type ResponseMode = "json" | "sse";

/**
 * Flat Redis Stream entry fields. Nested values are JSON-stringified.
 * Optional fields are omitted from the stream entry when absent.
 */
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

  // request_headers_json: string;
  request_payload_json?: string;
  metadata_json: string;
  upstream_request_payload_json?: string;

  status_code: string;
  response_content_type: string;
  // response_headers_json: string;
  /** Non-stream JSON body. */
  response_payload_json?: string;
  /** SSE transcript. */
  response_stream_text?: string;
  response_id?: string;
  error_type?: string;
  error_message?: string;

  duration_ms: string;
  /** Present for streaming responses when first byte is observed. */
  first_token_ms?: string;
  stream_chunk_count?: string;
};

/** Response-side attributes collected after upstream completes. */
export type RequestLogResponseCapture = {
  requestId: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  statusCode: number;
  responseMode: ResponseMode;
  responseContentType: string;
  responseHeaders: Headers | Record<string, string>;
  responsePayloadJson?: string;
  responseStreamText?: string;
  responseId?: string;
  errorType?: string;
  errorMessage?: string;
  firstTokenMs?: number;
  streamChunkCount?: number;
};

/** Inputs for building a complete request-log stream entry. */
export type BuildRequestLogInput = {
  eventId?: string;
  loggedAt?: Date;

  gatewayPath: string;
  httpMethod: string;
  apiFamily: string;
  providerId: string;
  provider: string;
  requestedModel: string;
  requestedModelAlias: string;
  upstreamModel: string;
  upstreamUrl: string;
  /** USD per 1M tokens. */
  inputPrice: number;
  /** USD per 1M tokens. */
  outputPrice: number;
  /** USD per 1M tokens. */
  inputCachePrice: number;
  isStream: boolean;

  childKeyId: string;
  childKeyName: string;
  childKeyCreatorId: string;
  childKeyIssuedAt: number;
  childKeyTags: unknown;
  userEmail: string;

  /** Original client headers (Authorization will be stripped). */
  // requestHeaders: Headers | Record<string, string>;
  /** Original client JSON body (stringified). */
  requestPayloadJson: string;
  /** Request metadata extracted from the client body (already stringified). */
  metadataJson: string;
  /** Rewritten body actually sent upstream (stringified). */
  upstreamRequestPayloadJson: string;

  response: RequestLogResponseCapture;
};
