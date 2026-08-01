import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";
import type { ChildKeyDbRecord } from "../src/child-keys/types.js";
import { createOpenaiProxyHandler } from "../src/proxy/proxy-openai.js";
import {
  createUpstreamProxyHandler,
  type UpstreamProxyContext,
} from "../src/proxy/upstream-proxy.js";
import type { EmitRequestLogInput } from "../src/request-log/index.js";
import { requestIdMiddleware } from "../src/request-log/index.js";

function buildChildKeyRecord(): ChildKeyDbRecord {
  return {
    id: "key_1",
    name: "test-key",
    key: "encrypted-key",
    creatorId: "creator_1",
    userEmail: "user@example.com",
    isActive: true,
    tags: { env: "test" },
    expiresAt: null,
    issuedAt: 123,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

test("proxyToOpenai forwards requests and emits response log fields", async () => {
  const app = new Hono<{ Variables: Record<string, unknown> }>();
  let forwardedUrl = "";
  let forwardedInit: RequestInit | undefined;
  let emitted: EmitRequestLogInput | undefined;
  let captureResolve: () => void;
  const emitDone = new Promise<void>((resolve) => {
    captureResolve = resolve;
  });
  let capturedContext: UpstreamProxyContext | undefined;

  app.use("*", requestIdMiddleware);
  app.use("*", async (c, next) => {
    c.set("childKeyRecord", buildChildKeyRecord());
    await next();
  });

  app.post(
    "/openai/v1/chat/completions",
    createOpenaiProxyHandler({
      resolveProviderModel: async (_providerId, _modelAlias, creatorId) => {
        assert.equal(creatorId, "creator_1");
        return {
          ok: true,
          value: {
            providerId: "db-openai",
            providerName: "db-openai",
            baseUrl: "https://example.com/v1",
            apiKey: "sk-db-provider-key",
            compatibilityType: "openai",
            modelAlias: "gateway-alias",
            model: "gpt-5.4-mini",
            inputPrice: 0.15,
            outputPrice: 0.6,
            inputCachePrice: 0.075,
          },
        };
      },
    }),
    async (c, next) => {
      capturedContext = c.get("proxyContext") as UpstreamProxyContext;
      await next();
    },
    createUpstreamProxyHandler({
      forwardUpstream: async (url, init) => {
        forwardedUrl = url;
        forwardedInit = init;
        return new Response(
          JSON.stringify({ id: "chatcmpl-1", choices: [] }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
      emitRequestLog: async (input) => {
        emitted = input;
        captureResolve();
        return {
          ok: true,
          streamId: "1-0",
          fields: {
            schema_version: "1",
            event_type: "request_log",
            event_id: "evt",
            request_id: input.response.requestId,
            logged_at: new Date().toISOString(),
            started_at: input.response.startedAt.toISOString(),
            completed_at: input.response.completedAt.toISOString(),
            gateway_path: input.proxyContext.gatewayPath,
            http_method: input.proxyContext.httpMethod,
            api_family: input.proxyContext.apiFamily,
            provider_id: input.proxyContext.providerId,
            provider: input.proxyContext.provider,
            requested_model: input.proxyContext.requestedModel,
            requested_model_alias: input.proxyContext.requestedModelAlias,
            upstream_model: input.proxyContext.upstreamModel,
            upstream_url: input.proxyContext.upstreamUrl,
            input_price: String(input.proxyContext.inputPrice),
            output_price: String(input.proxyContext.outputPrice),
            input_cache_price: String(input.proxyContext.inputCachePrice),
            is_stream: input.proxyContext.isStream ? "true" : "false",
            response_mode: input.response.responseMode,
            child_key_id: input.proxyContext.childKeyRecord.id,
            child_key_name: input.proxyContext.childKeyRecord.name,
            child_key_creator_id: input.proxyContext.childKeyRecord.creatorId,
            child_key_issued_at: String(
              input.proxyContext.childKeyRecord.issuedAt,
            ),
            child_key_tags_json: JSON.stringify(
              input.proxyContext.childKeyRecord.tags,
            ),
            user_email: input.proxyContext.childKeyRecord.userEmail,
            request_headers_json: "{}",
            metadata_json: input.proxyContext.metadataJson,
            capture_level: "metadata",
            status_code: String(input.response.statusCode),
            response_content_type: input.response.responseContentType,
            response_headers_json: "{}",
            duration_ms: String(input.response.durationMs),
            response_id: input.response.responseId,
          },
        };
      },
    }),
  );

  const response = await app.request(
    "http://localhost/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-client-1",
        authorization: "Bearer sk_test",
      },
      body: JSON.stringify({
        model: "db-openai/gateway-alias",
        stream: false,
        metadata: { session: "abc" },
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "req-client-1");
  assert.deepEqual(await response.json(), {
    id: "chatcmpl-1",
    choices: [],
  });
  assert.equal(forwardedUrl, "https://example.com/v1/chat/completions");
  assert.ok(forwardedInit);
  assert.equal(forwardedInit.method, "POST");

  const headers = forwardedInit.headers as Headers;
  assert.equal(headers.get("authorization"), "Bearer sk-db-provider-key");
  assert.equal(headers.get("x-request-id"), "req-client-1");

  const body = JSON.parse(String(forwardedInit.body));
  assert.equal(body.model, "gpt-5.4-mini");
  assert.equal("metadata" in body, false);

  assert.ok(capturedContext);
  assert.equal(capturedContext.gatewayPath, "/openai/v1/chat/completions");
  assert.equal(capturedContext.isStream, false);
  assert.equal(capturedContext.provider, "db-openai");
  assert.equal(capturedContext.upstreamModel, "gpt-5.4-mini");
  assert.equal(capturedContext.inputPrice, 0.15);
  assert.equal(capturedContext.outputPrice, 0.6);
  assert.equal(capturedContext.inputCachePrice, 0.075);

  await emitDone;
  assert.ok(emitted);
  assert.equal(emitted.response.requestId, "req-client-1");
  assert.equal(emitted.response.statusCode, 200);
  assert.equal(emitted.response.responseMode, "json");
  assert.equal(emitted.response.responseId, "chatcmpl-1");
  assert.equal(emitted.response.responseContentType, "application/json");
  assert.ok(emitted.response.durationMs >= 0);
  assert.ok(emitted.response.startedAt instanceof Date);
  assert.ok(emitted.response.completedAt instanceof Date);
  assert.ok(emitted.response.responsePayloadJson?.includes("chatcmpl-1"));
});

test("proxyToOpenai instruments SSE and emits first_token_ms", async () => {
  const app = new Hono<{ Variables: Record<string, unknown> }>();
  let emitted: EmitRequestLogInput | undefined;
  let captureResolve: () => void;
  const emitDone = new Promise<void>((resolve) => {
    captureResolve = resolve;
  });

  app.use("*", requestIdMiddleware);
  app.use("*", async (c, next) => {
    c.set("childKeyRecord", buildChildKeyRecord());
    await next();
  });

  app.post(
    "/openai/v1/chat/completions",
    createOpenaiProxyHandler({
      resolveProviderModel: async () => ({
        ok: true,
        value: {
          providerId: "db-openai",
          providerName: "db-openai",
          baseUrl: "https://example.com/v1",
          apiKey: "sk-db-provider-key",
          compatibilityType: "openai",
          modelAlias: "gateway-alias",
          model: "gpt-5.4-mini",
          inputPrice: 0.15,
          outputPrice: 0.6,
          inputCachePrice: 0.075,
        },
      }),
    }),
    createUpstreamProxyHandler({
      forwardUpstream: async () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const enc = new TextEncoder();
            controller.enqueue(
              enc.encode('data: {"id":"chatcmpl-sse","choices":[]}\n\n'),
            );
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        });
      },
      emitRequestLog: async (input) => {
        emitted = input;
        captureResolve();
        return { ok: false, reason: "no_client" };
      },
    }),
  );

  const response = await app.request(
    "http://localhost/openai/v1/chat/completions",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "db-openai/gateway-alias",
        stream: true,
      }),
    },
  );

  assert.equal(response.status, 200);
  const text = await response.text();
  assert.match(text, /chatcmpl-sse/);

  await emitDone;
  assert.ok(emitted);
  assert.equal(emitted.response.responseMode, "sse");
  assert.equal(emitted.response.responseId, "chatcmpl-sse");
  assert.ok(emitted.response.firstTokenMs !== undefined);
  assert.ok((emitted.response.streamChunkCount ?? 0) >= 1);
  assert.ok(emitted.response.responseStreamText?.includes("chatcmpl-sse"));
});

test("proxyToOpenai emits error log when upstream is unreachable", async () => {
  const app = new Hono<{ Variables: Record<string, unknown> }>();
  let emitted: EmitRequestLogInput | undefined;
  let captureResolve: () => void;
  const emitDone = new Promise<void>((resolve) => {
    captureResolve = resolve;
  });

  app.use("*", requestIdMiddleware);
  app.use("*", async (c, next) => {
    c.set("childKeyRecord", buildChildKeyRecord());
    await next();
  });

  app.post(
    "/openai/v1/chat/completions",
    createOpenaiProxyHandler({
      resolveProviderModel: async () => ({
        ok: true,
        value: {
          providerId: "db-openai",
          providerName: "db-openai",
          baseUrl: "https://example.com/v1",
          apiKey: "sk-db",
          compatibilityType: "openai",
          modelAlias: "gateway-alias",
          model: "gpt-5.4-mini",
          inputPrice: 0.15,
          outputPrice: 0.6,
          inputCachePrice: 0.075,
        },
      }),
    }),
    createUpstreamProxyHandler({
      forwardUpstream: async () => {
        throw new Error("network down");
      },
      emitRequestLog: async (input) => {
        emitted = input;
        captureResolve();
        return { ok: false, reason: "no_client" };
      },
    }),
  );

  const response = await app.request(
    "http://localhost/openai/v1/chat/completions",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "db-openai/gateway-alias",
      }),
    },
  );

  assert.equal(response.status, 502);
  const json = await response.json();
  assert.equal(json.error.type, "server_error");

  await emitDone;
  assert.ok(emitted);
  assert.equal(emitted.response.statusCode, 502);
  assert.equal(emitted.response.errorType, "server_error");
  assert.match(emitted.response.errorMessage ?? "", /Failed to reach provider/);
  assert.equal(emitted.response.responseMode, "json");
});
