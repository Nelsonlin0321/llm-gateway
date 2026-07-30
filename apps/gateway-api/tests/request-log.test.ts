import assert from "node:assert/strict";
import test from "node:test";

import type { RedisCacheClient } from "../src/lib/redis-client.js";
import { REQUEST_LOG_STREAM } from "../src/lib/redis-keys.js";
import {
  applyPayloadCapture,
  buildRequestLogFields,
  emitRequestLog,
  instrumentUpstreamResponse,
  parseCaptureLevel,
  parseErrorFieldsFromJsonText,
  parseResponseIdFromJsonText,
  parseResponseIdFromSseText,
  requestLogFieldsToXaddArgs,
  resolveResponseMode,
  sanitizeHeaders,
  type CaptureLevel,
  type RequestLogResponseCapture,
} from "../src/request-log/index.js";
import type { UpstreamProxyContext } from "../src/proxy/upstream-proxy.js";
import type { ChildKeyDbRecord } from "../src/child-keys/types.js";

function buildChildKeyRecord(
  overrides: Partial<ChildKeyDbRecord> = {},
): ChildKeyDbRecord {
  return {
    id: "key-1",
    name: "prod-bot",
    key: "encrypted-must-not-log",
    creatorId: "creator-1",
    userEmail: "user@example.com",
    isActive: true,
    tags: { env: "prod", team: "platform" },
    expiresAt: null,
    issuedAt: 1_700_000_000,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildProxyContext(
  overrides: Partial<UpstreamProxyContext> = {},
): UpstreamProxyContext {
  return {
    gatewayPath: "/openai/v1/chat/completions",
    httpMethod: "POST",
    isStream: false,
    requestPayloadJson: JSON.stringify({
      model: "openai/gpt-5.4-mini",
      messages: [{ role: "user", content: "hi" }],
      metadata: { session: "s1" },
    }),
    provider: "openai",
    requestedModel: "gpt-5.4-mini",
    requestedModelAlias: "openai/gpt-5.4-mini",
    apiFamily: "openai",
    metadataJson: JSON.stringify({ session: "s1" }),
    upstreamModel: "gpt-5.4-mini-upstream",
    upstreamUrl: "https://api.openai.com/v1/chat/completions",
    masterApiKey: "sk-provider-secret",
    upstreamHeaders: new Headers({
      authorization: "Bearer sk-provider-secret",
      "content-type": "application/json",
    }),
    upstreamBody: JSON.stringify({
      model: "gpt-5.4-mini-upstream",
      messages: [{ role: "user", content: "hi" }],
    }),
    childKeyRecord: buildChildKeyRecord(),
    ...overrides,
  };
}

function baseResponse(
  overrides: Partial<RequestLogResponseCapture> = {},
): RequestLogResponseCapture {
  return {
    requestId: "req-1",
    startedAt: new Date("2026-03-01T12:00:00.000Z"),
    completedAt: new Date("2026-03-01T12:00:00.150Z"),
    durationMs: 150,
    statusCode: 200,
    responseMode: "json",
    responseContentType: "application/json",
    responseHeaders: {
      "content-type": "application/json",
    },
    responsePayloadJson: JSON.stringify({ id: "chatcmpl-1", choices: [] }),
    responseId: "chatcmpl-1",
    ...overrides,
  };
}

class FakeStreamRedis implements RedisCacheClient {
  public xaddCalls: Array<{
    key: string;
    id: string;
    fieldValues: (string | Buffer | number)[];
  }> = [];

  constructor(
    private readonly overrides: {
      xadd?: (
        key: string,
        id: string,
        ...fieldValues: (string | Buffer | number)[]
      ) => Promise<string>;
    } = {},
  ) {}

  async get(): Promise<string | null> {
    return null;
  }

  async set(): Promise<unknown> {
    return "OK";
  }

  async del(): Promise<number> {
    return 0;
  }

  async xadd(
    key: string,
    id: string,
    ...fieldValues: (string | Buffer | number)[]
  ): Promise<string> {
    this.xaddCalls.push({ key, id, fieldValues });
    if (this.overrides.xadd) {
      return this.overrides.xadd(key, id, ...fieldValues);
    }
    return "1710000000000-0";
  }
}

function fieldsFromXaddArgs(
  fieldValues: (string | Buffer | number)[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < fieldValues.length; i += 2) {
    out[String(fieldValues[i])] = String(fieldValues[i + 1]);
  }
  return out;
}

test("parseCaptureLevel defaults to metadata", () => {
  assert.equal(parseCaptureLevel(undefined), "metadata");
  assert.equal(parseCaptureLevel(""), "metadata");
  assert.equal(parseCaptureLevel("nope"), "metadata");
  assert.equal(parseCaptureLevel("FULL"), "full");
  assert.equal(parseCaptureLevel("redacted"), "redacted");
});

test("sanitizeHeaders strips authorization and api-key headers", () => {
  const sanitized = sanitizeHeaders(
    new Headers({
      authorization: "Bearer sk-secret",
      "x-api-key": "secret",
      "content-type": "application/json",
      "x-request-id": "req-1",
    }),
  );

  assert.deepEqual(sanitized, {
    "content-type": "application/json",
    "x-request-id": "req-1",
  });
});

test("applyPayloadCapture omits bodies at metadata level", () => {
  assert.equal(applyPayloadCapture('{"a":1}', "metadata"), undefined);
  assert.equal(applyPayloadCapture('{"a":1}', "full"), '{"a":1}');
  assert.equal(
    applyPayloadCapture("x".repeat(10), "redacted", 5),
    "xxxxx…[truncated]",
  );
});

test("resolveResponseMode and response parsers", () => {
  // JSON content-type wins even if the client asked for stream (error bodies).
  assert.equal(resolveResponseMode(true, "application/json"), "json");
  assert.equal(
    resolveResponseMode(false, "text/event-stream; charset=utf-8"),
    "sse",
  );
  assert.equal(resolveResponseMode(true, ""), "sse");
  assert.equal(resolveResponseMode(false, "application/json"), "json");

  assert.equal(
    parseResponseIdFromJsonText(JSON.stringify({ id: "chatcmpl-9" })),
    "chatcmpl-9",
  );
  assert.equal(
    parseResponseIdFromSseText(
      'data: {"id":"chatcmpl-sse","choices":[]}\n\ndata: [DONE]\n',
    ),
    "chatcmpl-sse",
  );
  assert.deepEqual(
    parseErrorFieldsFromJsonText(
      JSON.stringify({
        error: { type: "invalid_request_error", message: "bad model" },
      }),
      400,
    ),
    { errorType: "invalid_request_error", errorMessage: "bad model" },
  );
});

test("buildRequestLogFields includes response + timing fields", () => {
  const fields = buildRequestLogFields({
    eventId: "evt-1",
    loggedAt: new Date("2026-03-01T12:00:00.200Z"),
    captureLevel: "metadata",
    gatewayPath: "/openai/v1/chat/completions",
    httpMethod: "POST",
    apiFamily: "openai",
    provider: "openai",
    requestedModel: "gpt-5.4-mini",
    requestedModelAlias: "openai/gpt-5.4-mini",
    upstreamModel: "gpt-5.4-mini-upstream",
    upstreamUrl: "https://api.openai.com/v1/chat/completions",
    isStream: false,
    childKeyId: "key-1",
    childKeyName: "prod-bot",
    childKeyCreatorId: "creator-1",
    childKeyIssuedAt: 1_700_000_000,
    childKeyTags: { env: "prod" },
    requestHeaders: {
      authorization: "Bearer sk-child",
      "content-type": "application/json",
    },
    requestPayloadJson: '{"model":"openai/gpt-5.4-mini"}',
    metadataJson: '{"session":"s1"}',
    upstreamRequestPayloadJson: '{"model":"gpt-5.4-mini-upstream"}',
    response: baseResponse(),
  });

  assert.equal(fields.schema_version, "1");
  assert.equal(fields.event_type, "request_log");
  assert.equal(fields.event_id, "evt-1");
  assert.equal(fields.request_id, "req-1");
  assert.equal(fields.logged_at, "2026-03-01T12:00:00.200Z");
  assert.equal(fields.started_at, "2026-03-01T12:00:00.000Z");
  assert.equal(fields.completed_at, "2026-03-01T12:00:00.150Z");
  assert.equal(fields.response_mode, "json");
  assert.equal(fields.status_code, "200");
  assert.equal(fields.response_content_type, "application/json");
  assert.equal(fields.duration_ms, "150");
  assert.equal(fields.response_id, "chatcmpl-1");
  assert.equal(fields.capture_level, "metadata");
  assert.equal(fields.request_payload_json, undefined);
  assert.equal(fields.response_payload_json, undefined);

  const xaddArgs = requestLogFieldsToXaddArgs(fields);
  assert.equal(xaddArgs.includes("response_payload_json"), false);
  assert.ok(xaddArgs.includes("request_id"));
  assert.ok(xaddArgs.includes("duration_ms"));
});

test("buildRequestLogFields includes payloads and stream fields at full", () => {
  const fields = buildRequestLogFields({
    captureLevel: "full" satisfies CaptureLevel,
    gatewayPath: "/openai/v1/chat/completions",
    httpMethod: "POST",
    apiFamily: "openai",
    provider: "openai",
    requestedModel: "gpt-5.4-mini",
    requestedModelAlias: "openai/gpt-5.4-mini",
    upstreamModel: "gpt-5.4-mini-upstream",
    upstreamUrl: "https://api.openai.com/v1/chat/completions",
    isStream: true,
    childKeyId: "key-1",
    childKeyName: "prod-bot",
    childKeyCreatorId: "creator-1",
    childKeyIssuedAt: 100,
    childKeyTags: {},
    requestHeaders: {},
    requestPayloadJson: '{"stream":true}',
    metadataJson: "{}",
    upstreamRequestPayloadJson: '{"stream":true}',
    response: baseResponse({
      responseMode: "sse",
      responseContentType: "text/event-stream",
      responsePayloadJson: undefined,
      responseStreamText: 'data: {"id":"chatcmpl-sse"}\n\n',
      responseId: "chatcmpl-sse",
      firstTokenMs: 42,
      streamChunkCount: 3,
      durationMs: 200,
    }),
  });

  assert.equal(fields.response_mode, "sse");
  assert.equal(fields.is_stream, "true");
  assert.equal(fields.first_token_ms, "42");
  assert.equal(fields.stream_chunk_count, "3");
  assert.equal(
    fields.response_stream_text,
    'data: {"id":"chatcmpl-sse"}\n\n',
  );
  assert.equal(fields.response_payload_json, undefined);
  assert.equal(fields.capture_level, "full");
});

test("buildRequestLogFields includes error fields", () => {
  const fields = buildRequestLogFields({
    captureLevel: "metadata",
    gatewayPath: "/openai/v1/chat/completions",
    httpMethod: "POST",
    apiFamily: "openai",
    provider: "openai",
    requestedModel: "x",
    requestedModelAlias: "openai/x",
    upstreamModel: "x",
    upstreamUrl: "https://example.com/v1/chat/completions",
    isStream: false,
    childKeyId: "key-1",
    childKeyName: "prod-bot",
    childKeyCreatorId: "creator-1",
    childKeyIssuedAt: 100,
    childKeyTags: {},
    requestHeaders: {},
    requestPayloadJson: "{}",
    metadataJson: "{}",
    upstreamRequestPayloadJson: "{}",
    response: baseResponse({
      statusCode: 400,
      responseId: undefined,
      responsePayloadJson: JSON.stringify({
        error: { type: "invalid_request_error", message: "nope" },
      }),
      errorType: "invalid_request_error",
      errorMessage: "nope",
    }),
  });

  assert.equal(fields.status_code, "400");
  assert.equal(fields.error_type, "invalid_request_error");
  assert.equal(fields.error_message, "nope");
});

test("emitRequestLog XADDs response fields and never logs secrets", async () => {
  const redis = new FakeStreamRedis();
  const ctx = buildProxyContext();

  const result = await emitRequestLog({
    proxyContext: ctx,
    requestHeaders: new Headers({
      authorization: "Bearer sk-child-plain",
      "content-type": "application/json",
    }),
    response: baseResponse(),
    captureLevel: "full",
    client: redis,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(redis.xaddCalls.length, 1);
  assert.equal(redis.xaddCalls[0]?.key, REQUEST_LOG_STREAM);

  const flat = fieldsFromXaddArgs(redis.xaddCalls[0]!.fieldValues);
  assert.equal(flat.request_id, "req-1");
  assert.equal(flat.status_code, "200");
  assert.equal(flat.duration_ms, "150");
  assert.equal(flat.response_id, "chatcmpl-1");
  assert.equal(flat.response_mode, "json");
  assert.ok(flat.response_payload_json);

  const joined = JSON.stringify(flat);
  assert.equal(joined.includes("sk-child-plain"), false);
  assert.equal(joined.includes("sk-provider-secret"), false);
  assert.equal(joined.includes("encrypted-must-not-log"), false);
  assert.equal(joined.includes("user@example.com"), false);
});

test("emitRequestLog returns no_client without Redis and does not throw", async () => {
  const result = await emitRequestLog({
    proxyContext: buildProxyContext(),
    requestHeaders: {},
    response: baseResponse(),
    client: null,
  });

  assert.deepEqual(result, { ok: false, reason: "no_client" });
});

test("emitRequestLog swallows xadd failures", async () => {
  const redis = new FakeStreamRedis({
    async xadd() {
      throw new Error("redis down");
    },
  });

  const result = await emitRequestLog({
    proxyContext: buildProxyContext(),
    requestHeaders: {},
    response: baseResponse(),
    client: redis,
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.equal(result.reason, "xadd_failed");
});

test("instrumentUpstreamResponse captures JSON response attributes", async () => {
  const startedAtMs = Date.now() - 25;
  let capture:
    | import("../src/request-log/index.js").InstrumentedResponseCapture
    | undefined;

  const response = await instrumentUpstreamResponse(
    new Response(JSON.stringify({ id: "chatcmpl-json", choices: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
    {
      isStream: false,
      startedAtMs,
      captureLevel: "full",
      onComplete: (c) => {
        capture = c;
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: "chatcmpl-json",
    choices: [],
  });
  assert.ok(capture);
  assert.equal(capture.responseMode, "json");
  assert.equal(capture.responseId, "chatcmpl-json");
  assert.equal(capture.statusCode, 200);
  assert.ok(capture.durationMs >= 0);
  assert.ok(capture.responsePayloadJson?.includes("chatcmpl-json"));
});

test("instrumentUpstreamResponse captures SSE transcript and first_token_ms", async () => {
  const startedAtMs = Date.now() - 10;
  let capture:
    | import("../src/request-log/index.js").InstrumentedResponseCapture
    | undefined;
  let resolveCapture: () => void;
  const captureDone = new Promise<void>((resolve) => {
    resolveCapture = resolve;
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(
        enc.encode('data: {"id":"chatcmpl-stream","choices":[]}\n\n'),
      );
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  const response = await instrumentUpstreamResponse(
    new Response(stream, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    }),
    {
      isStream: true,
      startedAtMs,
      captureLevel: "full",
      onComplete: (c) => {
        capture = c;
        resolveCapture();
      },
    },
  );

  const clientText = await response.text();
  assert.match(clientText, /chatcmpl-stream/);
  assert.match(clientText, /\[DONE\]/);

  await captureDone;
  assert.ok(capture);
  assert.equal(capture.responseMode, "sse");
  assert.equal(capture.responseId, "chatcmpl-stream");
  assert.ok(capture.firstTokenMs !== undefined);
  assert.ok((capture.streamChunkCount ?? 0) >= 1);
  assert.ok(capture.responseStreamText?.includes("chatcmpl-stream"));
  assert.ok(capture.durationMs >= 0);
});

test("instrumentUpstreamResponse captures JSON error type/message", async () => {
  let capture:
    | import("../src/request-log/index.js").InstrumentedResponseCapture
    | undefined;

  await instrumentUpstreamResponse(
    new Response(
      JSON.stringify({
        error: { type: "authentication_error", message: "bad key" },
      }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    ),
    {
      isStream: false,
      startedAtMs: Date.now(),
      captureLevel: "metadata",
      onComplete: (c) => {
        capture = c;
      },
    },
  );

  assert.ok(capture);
  assert.equal(capture.statusCode, 401);
  assert.equal(capture.errorType, "authentication_error");
  assert.equal(capture.errorMessage, "bad key");
});
