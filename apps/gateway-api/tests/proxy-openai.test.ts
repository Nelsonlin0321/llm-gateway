import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";
import { createOpenaiProxyHandler } from "../src/proxy-openai.js";

test("proxyToOpenai forwards requests with DB-resolved credentials", async () => {
  const app = new Hono();
  let forwardedUrl = "";
  let forwardedInit: RequestInit | undefined;

  app.post(
    "/openai/v1/chat/completions",
    createOpenaiProxyHandler({
      resolveProvider: async () => ({
        ok: true,
        value: {
          providerId: "db-openai",
          baseUrl: "https://example.com/v1",
          apiKey: "sk-db-provider-key",
          compatibilityType: "openai",
        },
      }),
      forwardUpstream: async (url, init) => {
        forwardedUrl = url;
        forwardedInit = init;
        return new Response(JSON.stringify({ id: "chatcmpl-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    }),
  );

  const response = await app.request(
    "http://localhost/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-1",
      },
      body: JSON.stringify({
        model: "db-openai/gpt-5.4-mini",
        stream: true,
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(forwardedUrl, "https://example.com/v1/chat/completions");
  assert.ok(forwardedInit);
  assert.equal(forwardedInit.method, "POST");

  const headers = forwardedInit.headers as Headers;
  assert.equal(headers.get("authorization"), "Bearer sk-db-provider-key");
  assert.equal(headers.get("x-request-id"), "req-1");

  const body = JSON.parse(String(forwardedInit.body));
  assert.equal(body.model, "gpt-5.4-mini");
  assert.deepEqual(body.stream_options, { include_usage: true });
});
