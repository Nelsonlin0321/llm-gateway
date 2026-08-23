import type { NewEventLog, NewRequestLog } from "../db/schema";
import {
  parseApiFamily,
  parseBool,
  parseFloatField,
  parseIntField,
  parseJsonObject,
  parseNullableString,
  parseOptionalString,
  parseTimestamp,
  toLogDate,
} from "./parse";
import { calculateCost, extractTokenUsage } from "./tokens";

export type TransformResult =
  | {
      ok: true;
      requestLog: NewRequestLog;
      eventLog: NewEventLog;
    }
  | { ok: false; reason: string };

/**
 * Map flat Redis stream fields (all strings) into `request_log` + `event_log` rows.
 */
export function transformStreamFields(
  fields: Record<string, string>,
): TransformResult {
  const eventId = parseOptionalString(fields.event_id);
  const requestId = parseOptionalString(fields.request_id);
  const organizationId = parseOptionalString(fields.organization_id);
  if (!eventId) {
    return { ok: false, reason: "missing event_id" };
  }
  if (!requestId) {
    return { ok: false, reason: "missing request_id" };
  }

  const gatewayPath = parseOptionalString(fields.gateway_path);
  if (!gatewayPath) {
    return { ok: false, reason: "missing gateway_path" };
  }

  if (!organizationId) {
    return { ok: false, reason: "missing organization_id" };
  }

  const loggedAt = parseTimestamp(fields.logged_at) ?? new Date();
  const logDate = toLogDate(loggedAt);
  const isStream = parseBool(fields.is_stream, false);

  const responseText = isStream
    ? (parseOptionalString(fields.response_stream_text) ?? null)
    : (parseOptionalString(fields.response_payload_json) ?? null);

  const now = new Date();

  const requestLog: NewRequestLog = {
    eventId,
    requestId,
    requestPayloadJson: parseNullableString(fields.request_payload_json),
    organizationId: fields.organization_id,
    responseText,
    statusCode: parseIntField(fields.status_code),
    isStream,
    gatewayPath,
    loggedAt,
    logDate,
    createdAt: now,
    updatedAt: now,
  };

  const httpMethod = parseOptionalString(fields.http_method);
  if (!httpMethod) {
    return { ok: false, reason: "missing http_method" };
  }

  const apiFamily = parseApiFamily(fields.api_family);
  if (!apiFamily) {
    return {
      ok: false,
      reason: `invalid api_family: ${fields.api_family ?? "(missing)"}`,
    };
  }

  const provider = parseOptionalString(fields.provider);
  const requestedModel = parseOptionalString(fields.requested_model);
  const requestedModelAlias = parseOptionalString(fields.requested_model_alias);
  const upstreamModel = parseOptionalString(fields.upstream_model);
  const upstreamUrl = parseOptionalString(fields.upstream_url);
  const childKeyName = parseOptionalString(fields.child_key_name);
  const userEmail = parseOptionalString(fields.user_email);
  const responseMode = parseOptionalString(fields.response_mode);
  const eventType = parseOptionalString(fields.event_type) ?? "request_log";
  const schemaVersion = parseIntField(fields.schema_version) ?? 1;

  if (
    !provider ||
    !requestedModel ||
    !requestedModelAlias ||
    !upstreamModel ||
    !upstreamUrl ||
    !childKeyName ||
    !userEmail ||
    !responseMode
  ) {
    return { ok: false, reason: "missing required event_log field" };
  }

  const startedAt = parseTimestamp(fields.started_at);
  if (!startedAt) {
    return { ok: false, reason: "missing or invalid started_at" };
  }

  const inputPrice = parseFloatField(fields.input_price, 0);
  const outputPrice = parseFloatField(fields.output_price, 0);
  const inputCachePrice = parseFloatField(fields.input_cache_price, 0);

  const tokens = extractTokenUsage({
    isStream,
    responseStreamText: fields.response_stream_text,
    responsePayloadJson: fields.response_payload_json,
  });
  const cost = calculateCost(tokens, {
    inputPrice,
    outputPrice,
    inputCachePrice,
  });

  const eventLog: NewEventLog = {
    eventId,
    requestId,
    organizationId: fields.organization_id,
    schemaVersion,
    eventType,
    startedAt,
    completedAt: parseTimestamp(fields.completed_at),
    gatewayPath,
    httpMethod,
    apiFamily,
    providerId: parseNullableString(fields.provider_id),
    provider,
    requestedModel,
    requestedModelAlias,
    upstreamModel,
    upstreamUrl,
    isStream,
    responseMode,
    childKeyId: parseNullableString(fields.child_key_id),
    childKeyName,
    childKeyCreatorId: parseNullableString(fields.child_key_creator_id),
    childKeyIssuedAt: parseIntField(fields.child_key_issued_at),
    childKeyTagsJson: parseJsonObject<Record<string, string>>(
      fields.child_key_tags_json,
    ),
    userEmail,
    metadataJson: parseJsonObject<Record<string, unknown>>(
      fields.metadata_json,
    ),
    statusCode: parseIntField(fields.status_code),
    responseContentType: parseNullableString(fields.response_content_type),
    durationMs: parseIntField(fields.duration_ms),
    firstTokenMs: parseIntField(fields.first_token_ms),
    responseId: parseNullableString(fields.response_id),
    inputToken: tokens.inputToken,
    outputToken: tokens.outputToken,
    cachedInputToken: tokens.cachedInputToken,
    totalToken: tokens.totalToken,
    cost,
    loggedAt,
    logDate,
    inputPrice,
    outputPrice,
    inputCachePrice,
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, requestLog, eventLog };
}
