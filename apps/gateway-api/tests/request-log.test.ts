import assert from "node:assert/strict";
import test from "node:test";

import type { RedisCacheClient } from "../src/lib/redis-client.js";
import { REQUEST_LOG_STREAM } from "../src/lib/redis-keys.js";
import { getRequestLogStreamMaxLen } from "../src/request-log/emit.js";
import {
  applyPayloadCapture,
  emitRequestLog,
  getCaptureLevel,
  instrumentUpstreamResponse,
  parseCaptureLevel,
  parseErrorFieldsFromJsonText,
  parseResponseIdFromJsonText,
  parseResponseIdFromSseText,
  resolveResponseMode,
  sanitizeHeaders,
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
    organizationId: "org-1",
    rateLimitRpm: null,
    monthlyBudgetUsd: null,
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
    providerId: "provider_openai",
    provider: "openai",
    requestedModel: "gpt-5.4-mini",
    requestedModelAlias: "openai/gpt-5.4-mini",
    apiFamily: "openai",
    metadataJson: JSON.stringify({ session: "s1" }),
    inputPrice: 0.15,
    outputPrice: 0.6,
    inputCachePrice: 0.075,
    upstreamModel: "gpt-5.4-mini-upstream",
    upstreamUrl: "https://api.openai.com/v1/chat/completions",
    masterApiKey: "sk-provider-secret",
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
    args: (string | Buffer | number)[];
  }> = [];

  constructor(
    private readonly overrides: {
      xadd?: (
        key: string,
        ...args: (string | Buffer | number)[]
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

  async incr(): Promise<number> {
    return 1;
  }

  async expire(): Promise<number> {
    return 1;
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async xadd(
    key: string,
    ...args: (string | Buffer | number)[]
  ): Promise<string> {
    this.xaddCalls.push({ key, args });
    if (this.overrides.xadd) {
      return this.overrides.xadd(key, ...args);
    }
    return "1710000000000-0";
  }
}

function extractFieldValuesFromXaddArgs(
  args: (string | Buffer | number)[],
): (string | Buffer | number)[] {
  const index = args.findIndex((item) => item === "*");
  return index >= 0 ? args.slice(index + 1) : [];
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

const BODY_FIELDS = [
  "request_payload_json",
  "upstream_request_payload_json",
  "response_payload_json",
  "response_stream_text",
] as const;

test("parseCaptureLevel defaults invalid values to full", () => {
  assert.equal(parseCaptureLevel(undefined), "full");
  assert.equal(parseCaptureLevel("  "), "full");
  assert.equal(parseCaptureLevel("nope"), "full");
  assert.equal(parseCaptureLevel(" Metadata "), "metadata");
  assert.equal(parseCaptureLevel("REDACTED"), "redacted");
  assert.equal(getCaptureLevel({}), "full");
  assert.equal(
    getCaptureLevel({ REQUEST_LOG_CAPTURE_LEVEL: "metadata" }),
    "metadata",
  );
});

test("applyPayloadCapture omits, truncates, or keeps a body", () => {
  const long = "x".repeat(2_050);
  assert.equal(applyPayloadCapture(long, "metadata"), undefined);
  assert.equal(applyPayloadCapture(undefined, "full"), undefined);
  assert.equal(applyPayloadCapture("short", "redacted"), "short");
  assert.equal(
    applyPayloadCapture(long, "redacted"),
    `${"x".repeat(2_048)}…[truncated]`,
  );
  assert.equal(applyPayloadCapture(long, "full"), long);
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
  assert.deepEqual(redis.xaddCalls[0]!.args.slice(0, 4), [
    "MAXLEN",
    "~",
    getRequestLogStreamMaxLen(),
    "*",
  ]);

  const flat = fieldsFromXaddArgs(
    extractFieldValuesFromXaddArgs(redis.xaddCalls[0]!.args),
  );
  assert.equal(flat.request_id, "req-1");
  assert.equal(flat.organization_id, "org-1");
  assert.equal(flat.status_code, "200");
  assert.equal(flat.duration_ms, "150");
  assert.equal(flat.response_id, "chatcmpl-1");
  assert.equal(flat.response_mode, "json");
  assert.equal(flat.input_price, "0.15");
  assert.equal(flat.output_price, "0.6");
  assert.equal(flat.input_cache_price, "0.075");
  assert.ok(flat.response_payload_json);

  const joined = JSON.stringify(flat);
  assert.equal(joined.includes("sk-child-plain"), false);
  assert.equal(joined.includes("sk-provider-secret"), false);
  assert.equal(joined.includes("encrypted-must-not-log"), false);
  assert.equal(joined.includes("user@example.com"), true);
});

test("REQUEST_LOG_CAPTURE_LEVEL controls the four body fields", async () => {
  const long = "y".repeat(3_000);
  const streamText = `${long}stream`;
  const redis = new FakeStreamRedis();
  const response = baseResponse({
    responsePayloadJson: `${long}response`,
    responseStreamText: streamText,
  });
  const proxyContext = buildProxyContext({
    requestPayloadJson: `${long}request`,
    upstreamBody: `${long}upstream`,
  });

  const metadata = await emitRequestLog({
    proxyContext,
    response,
    captureLevel: "metadata",
    client: redis,
  });
  assert.equal(metadata.ok, true);
  if (!metadata.ok) {
    return;
  }
  for (const field of BODY_FIELDS) {
    assert.equal(metadata.fields[field], undefined);
  }
  assert.equal(metadata.fields.status_code, "200");
  assert.equal(metadata.fields.metadata_json, JSON.stringify({ session: "s1" }));

  const redacted = await emitRequestLog({
    proxyContext,
    response,
    captureLevel: "redacted",
    streamKey: "redacted",
    client: redis,
  });
  assert.equal(redacted.ok, true);
  if (!redacted.ok) {
    return;
  }
  const truncated = `${"y".repeat(2_048)}…[truncated]`;
  assert.equal(redacted.fields.request_payload_json, truncated);
  assert.equal(redacted.fields.upstream_request_payload_json, truncated);
  assert.equal(redacted.fields.response_payload_json, truncated);
  assert.equal(redacted.fields.response_stream_text, truncated);

  const full = await emitRequestLog({
    proxyContext,
    response,
    captureLevel: "full",
    streamKey: "full",
    client: redis,
  });
  assert.equal(full.ok, true);
  if (!full.ok) {
    return;
  }
  assert.equal(full.fields.request_payload_json, `${long}request`);
  assert.equal(full.fields.upstream_request_payload_json, `${long}upstream`);
  assert.equal(full.fields.response_payload_json, `${long}response`);
  assert.equal(full.fields.response_stream_text, streamText);
});

test("emitRequestLog reads REQUEST_LOG_CAPTURE_LEVEL from the environment", async () => {
  const previous = process.env.REQUEST_LOG_CAPTURE_LEVEL;
  process.env.REQUEST_LOG_CAPTURE_LEVEL = "metadata";
  try {
    const redis = new FakeStreamRedis();
    const result = await emitRequestLog({
      proxyContext: buildProxyContext(),
      response: baseResponse({ responseStreamText: "data: hi\n\n" }),
      client: redis,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    for (const field of BODY_FIELDS) {
      assert.equal(result.fields[field], undefined);
    }
  } finally {
    if (previous === undefined) {
      delete process.env.REQUEST_LOG_CAPTURE_LEVEL;
    } else {
      process.env.REQUEST_LOG_CAPTURE_LEVEL = previous;
    }
  }
});

test("emitRequestLog caps stream length when streamMaxLen is set", async () => {
  const redis = new FakeStreamRedis();

  const result = await emitRequestLog({
    proxyContext: buildProxyContext(),
    requestHeaders: {},
    response: baseResponse(),
    streamMaxLen: 100,
    client: redis,
  });

  assert.equal(result.ok, true);
  assert.equal(redis.xaddCalls.length, 1);
  assert.deepEqual(redis.xaddCalls[0]!.args.slice(0, 4), [
    "MAXLEN",
    "~",
    100,
    "*",
  ]);
});

test("emitRequestLog disables stream length cap when streamMaxLen is 0", async () => {
  const redis = new FakeStreamRedis();

  const result = await emitRequestLog({
    proxyContext: buildProxyContext(),
    requestHeaders: {},
    response: baseResponse(),
    streamMaxLen: 0,
    client: redis,
  });

  assert.equal(result.ok, true);
  assert.equal(redis.xaddCalls.length, 1);
  assert.equal(redis.xaddCalls[0]!.args[0], "*");
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
