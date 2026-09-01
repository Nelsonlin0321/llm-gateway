import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";
import type { ChildKeyDbRecord } from "../src/child-keys/types.js";
import { injectAnthropicProxyContext } from "../src/proxy/proxy-anthropic.js";
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
    organizationId: "org_1",
    rateLimitRpm: null,
    monthlyBudgetUsd: null,
    userEmail: "user@example.com",
    isActive: true,
    tags: { env: "test" },
    expiresAt: null,
    issuedAt: 123,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

test("proxyToAnthropic returns resolver failures without forwarding", async () => {
  const app = new Hono<{ Variables: Record<string, unknown> }>();
  let forwardCalled = false;
  let emitCalled = false;

  app.use("*", async (c, next) => {
    c.set("childKeyRecord", buildChildKeyRecord());
    await next();
  });

  app.post(
    "/anthropic/v1/messages",
    injectAnthropicProxyContext({
      resolveProviderModel: async (_providerId, _modelAlias, organizationId) => {
        assert.equal(organizationId, "org_1");
        return {
          ok: false,
          status: 403,
          error: {
            message: 'Provider "minimax" is inactive.',
            type: "invalid_request_error",
          },
        };
      },
    }),
    createUpstreamProxyHandler({
      forwardUpstream: async () => {
        forwardCalled = true;
        throw new Error("Forwarder should not run");
      },
      emitRequestLog: async () => {
        emitCalled = true;
        return { ok: false, reason: "no_client" };
      },
    }),
  );

  const response = await app.request("http://localhost/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "minimax/MiniMax-M3",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    }),
  });

  assert.equal(response.status, 403);
  assert.equal(forwardCalled, false);
  assert.equal(emitCalled, false);
  assert.deepEqual(await response.json(), {
    error: {
      message: 'Provider "minimax" is inactive.',
      type: "invalid_request_error",
    },
  });
});

test("proxyToAnthropic builds proxy context and emits response log", async () => {
  const app = new Hono<{ Variables: Record<string, unknown> }>();
  let capturedContext: UpstreamProxyContext | undefined;
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
    "/anthropic/v1/messages",
    injectAnthropicProxyContext({
      resolveProviderModel: async (providerId, modelAlias, organizationId) => {
        assert.equal(providerId, "minimax");
        assert.equal(modelAlias, "MiniMax-M3");
        assert.equal(organizationId, "org_1");
        return {
          ok: true,
          value: {
            providerId: "minimax",
            providerName: "minimax",
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "sk-minimax",
            compatibilityType: "anthropic",
            modelAlias: "MiniMax-M3",
            model: "MiniMax-M3",
            inputPrice: 0.3,
            outputPrice: 1.2,
            inputCachePrice: 0.03,
          },
        };
      },
    }),
    async (c, next) => {
      capturedContext = c.get("proxyContext") as UpstreamProxyContext;
      await next();
    },
    createUpstreamProxyHandler({
      forwardUpstream: async () =>
        new Response(JSON.stringify({ id: "msg_1", type: "message" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      emitRequestLog: async (input) => {
        emitted = input;
        captureResolve();
        return { ok: false, reason: "no_client" };
      },
    }),
  );

  const response = await app.request("http://localhost/anthropic/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: "minimax/MiniMax-M3",
      max_tokens: 64,
      stream: false,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "msg_1", type: "message" });
  assert.ok(capturedContext);
  assert.equal(capturedContext.gatewayPath, "/anthropic/v1/messages");
  assert.equal(capturedContext.httpMethod, "POST");
  assert.equal(capturedContext.isStream, false);
  assert.equal(capturedContext.provider, "minimax");
  assert.equal(capturedContext.apiFamily, "anthropic");
  assert.equal(capturedContext.requestedModel, "MiniMax-M3");
  assert.equal(capturedContext.requestedModelAlias, "minimax/MiniMax-M3");
  assert.equal(capturedContext.upstreamModel, "MiniMax-M3");
  assert.equal(capturedContext.inputPrice, 0.3);
  assert.equal(capturedContext.outputPrice, 1.2);
  assert.equal(capturedContext.inputCachePrice, 0.03);

  await emitDone;
  assert.ok(emitted);
  assert.equal(emitted.response.statusCode, 200);
  assert.equal(emitted.response.responseMode, "json");
  assert.equal(emitted.response.responseId, "msg_1");
  assert.ok(emitted.response.durationMs >= 0);
  assert.ok(emitted.response.requestId);
});
