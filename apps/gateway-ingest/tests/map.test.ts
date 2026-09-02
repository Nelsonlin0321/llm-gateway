import assert from "node:assert/strict";
import test from "node:test";

import { transformStreamFields } from "../src/transform/map.js";

function baseFields(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    schema_version: "1",
    event_type: "request_log",
    event_id: "evt-1",
    request_id: "req-1",
    logged_at: "2026-03-17T12:00:00.000Z",
    started_at: "2026-03-17T11:59:59.000Z",
    completed_at: "2026-03-17T12:00:00.000Z",
    gateway_path: "/v1/chat/completions",
    http_method: "POST",
    api_family: "openai",
    provider_id: "prov-1",
    provider: "azure",
    requested_model: "gpt-5.4-mini",
    requested_model_alias: "gpt-5.4-mini",
    upstream_model: "gpt-5.4-mini-2026-03-17",
    upstream_url: "https://example.openai.azure.com/...",
    input_price: "1.5",
    output_price: "6",
    input_cache_price: "0.15",
    is_stream: "false",
    response_mode: "json",
    child_key_id: "ck-1",
    child_key_name: "dev",
    child_key_creator_id: "user-1",
    child_key_issued_at: "1700000000",
    child_key_tags_json: '{"env":"test"}',
    user_email: "dev@example.com",
    organization_id: "org-1",
    request_headers_json: '{"content-type":"application/json"}',
    request_payload_json: '{"messages":[]}',
    metadata_json: '{"trace":"t1"}',
    capture_level: "full",
    status_code: "200",
    response_content_type: "application/json",
    response_headers_json: "{}",
    response_payload_json: JSON.stringify({
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        prompt_tokens_details: { cached_tokens: 40 },
      },
    }),
    duration_ms: "500",
    ...overrides,
  };
}

test("transformStreamFields maps request_log and event_log", () => {
  const result = transformStreamFields(baseFields());
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.requestLog.eventId, "evt-1");
  assert.equal(result.requestLog.requestId, "req-1");
  assert.equal(result.requestLog.isStream, false);
  assert.equal(result.requestLog.gatewayPath, "/v1/chat/completions");
  assert.equal(result.requestLog.statusCode, 200);
  assert.equal(result.requestLog.logDate, "2026-03-17");
  // non-stream → response_payload_json
  assert.ok(result.requestLog.responseText?.includes("prompt_tokens"));

  assert.equal(result.eventLog.apiFamily, "openai");
  assert.equal(result.eventLog.provider, "azure");
  assert.equal(result.eventLog.organizationId, "org-1");
  assert.equal(result.requestLog.organizationId, "org-1");
  assert.equal(result.eventLog.inputToken, 60); // 100 - 40
  assert.equal(result.eventLog.outputToken, 20);
  assert.equal(result.eventLog.cachedInputToken, 40);
  assert.equal(result.eventLog.totalToken, 120);
  // cost = 40/1e6*0.15 + 60/1e6*1.5 + 20/1e6*6
  const expectedCost =
    (40 / 1_000_000) * 0.15 + (60 / 1_000_000) * 1.5 + (20 / 1_000_000) * 6;
  assert.ok(Math.abs((result.eventLog.cost ?? 0) - expectedCost) < 1e-12);
  assert.deepEqual(result.eventLog.childKeyTagsJson, { env: "test" });
  assert.deepEqual(result.eventLog.metadataJson, { trace: "t1" });
});

test("transformStreamFields uses response_stream_text when is_stream", () => {
  const streamText = [
    'data: {"choices":[{"delta":{"content":"x"}}],"usage":null}',
    'data: {"usage":{"prompt_tokens":10,"completion_tokens":3,"prompt_tokens_details":{"cached_tokens":0}}}',
    "data: [DONE]",
  ].join("\n");

  const fields = baseFields({
    is_stream: "true",
    response_mode: "sse",
    response_stream_text: streamText,
  });
  delete fields.response_payload_json;

  const mapped = transformStreamFields(fields);
  assert.equal(mapped.ok, true);
  if (!mapped.ok) {
    return;
  }
  assert.equal(mapped.requestLog.isStream, true);
  assert.equal(mapped.requestLog.responseText, streamText);
  assert.equal(mapped.eventLog.inputToken, 10);
  assert.equal(mapped.eventLog.outputToken, 3);
  assert.equal(mapped.eventLog.totalToken, 13);
});

test("transformStreamFields fails on missing required fields", () => {
  const result = transformStreamFields({ event_id: "e1" });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.reason, /missing/);
});

test("transformStreamFields zeros tokens when body missing", () => {
  const fields = baseFields();
  delete fields.response_payload_json;
  const result = transformStreamFields(fields);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.eventLog.inputToken, 0);
  assert.equal(result.eventLog.outputToken, 0);
  assert.equal(result.eventLog.cost, 0);
});
