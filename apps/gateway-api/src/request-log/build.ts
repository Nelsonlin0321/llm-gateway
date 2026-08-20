import { randomUUID } from "node:crypto";

import {
  // sanitizeHeaders,
  stringifyChildKeyTags,
} from "./capture.js";
import {
  REQUEST_LOG_EVENT_TYPE,
  REQUEST_LOG_SCHEMA_VERSION,
  type BuildRequestLogInput,
  type RequestLogV1Fields,
} from "./schema.js";

/**
 * Build a v1 request-log entry as flat string field/value pairs for Redis Streams.
 */
export function buildRequestLogFields(
  input: BuildRequestLogInput,
): RequestLogV1Fields {
  const response = input.response;

  const fields: RequestLogV1Fields = {
    schema_version: REQUEST_LOG_SCHEMA_VERSION,
    event_type: REQUEST_LOG_EVENT_TYPE,
    event_id: input.eventId ?? randomUUID(),
    request_id: response.requestId,
    logged_at: (input.loggedAt ?? new Date()).toISOString(),
    started_at: response.startedAt.toISOString(),
    completed_at: response.completedAt.toISOString(),

    gateway_path: input.gatewayPath,
    http_method: input.httpMethod,
    api_family: input.apiFamily,
    provider_id: input.providerId,
    provider: input.provider,
    requested_model: input.requestedModel,
    requested_model_alias: input.requestedModelAlias,
    upstream_model: input.upstreamModel,
    upstream_url: input.upstreamUrl,
    input_price: String(input.inputPrice),
    output_price: String(input.outputPrice),
    input_cache_price: String(input.inputCachePrice),
    is_stream: input.isStream ? "true" : "false",
    response_mode: response.responseMode,

    child_key_id: input.childKeyId,
    child_key_name: input.childKeyName,
    child_key_creator_id: input.childKeyCreatorId,
    child_key_issued_at: String(input.childKeyIssuedAt),
    child_key_tags_json: stringifyChildKeyTags(input.childKeyTags),
    user_email: input.userEmail,

    // request_headers_json: JSON.stringify(sanitizeHeaders(input.requestHeaders)),
    metadata_json: input.metadataJson || "{}",

    status_code: String(response.statusCode),
    response_content_type: response.responseContentType || "",
    // response_headers_json: JSON.stringify(
    //   sanitizeHeaders(response.responseHeaders),
    // ),
    duration_ms: String(response.durationMs),
  };

  if (input.requestPayloadJson !== undefined) {
    fields.request_payload_json = input.requestPayloadJson;
  }
  if (input.upstreamRequestPayloadJson !== undefined) {
    fields.upstream_request_payload_json = input.upstreamRequestPayloadJson;
  }
  if (response.responsePayloadJson !== undefined) {
    fields.response_payload_json = response.responsePayloadJson;
  }
  if (response.responseStreamText !== undefined) {
    fields.response_stream_text = response.responseStreamText;
  }
  if (response.responseId) {
    fields.response_id = response.responseId;
  }
  if (response.errorType) {
    fields.error_type = response.errorType;
  }
  if (response.errorMessage) {
    fields.error_message = response.errorMessage;
  }
  if (response.firstTokenMs !== undefined && response.responseMode === "sse") {
    fields.first_token_ms = String(response.firstTokenMs);
  }
  if (response.streamChunkCount !== undefined) {
    fields.stream_chunk_count = String(response.streamChunkCount);
  }

  // console.log(`providerId:${fields.provider_id}`);

  return fields;
}

/**
 * Flatten a typed field map into the alternating key/value list expected by `XADD`.
 * Skips `undefined` values so conditional payload fields stay off the entry.
 */
export function requestLogFieldsToXaddArgs(
  fields: RequestLogV1Fields,
): string[] {
  const args: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }
    args.push(key, value);
  }
  return args;
}
