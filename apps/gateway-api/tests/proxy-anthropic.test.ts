import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";
import { createAnthropicProxyHandler } from "../src/proxy-anthropic.js";

test("proxyToAnthropic returns resolver failures without forwarding", async () => {
  const app = new Hono();
  let forwardCalled = false;

  app.post(
    "/anthropic/v1/messages",
    createAnthropicProxyHandler({
      resolveProvider: async () => ({
        ok: false,
        status: 403,
        error: {
          message: 'Provider "minimax" is inactive.',
          type: "invalid_request_error",
        },
      }),
      forwardUpstream: async () => {
        forwardCalled = true;
        throw new Error("Forwarder should not run");
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
  assert.deepEqual(await response.json(), {
    error: {
      message: 'Provider "minimax" is inactive.',
      type: "invalid_request_error",
    },
  });
});
