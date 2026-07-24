import assert from "node:assert/strict";
import test from "node:test";
import { prepareAnthropicPayload } from "../src/payload-anthropic.js";

test("prepareAnthropicPayload strips provider prefix from the upstream model", () => {
  const result = prepareAnthropicPayload({
    model: "minimax/MiniMax-M3",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.equal(result.value.parsed.providerId, "minimax");
  assert.equal(result.value.upstreamBody.model, "MiniMax-M3");
  assert.equal(result.value.upstreamBody.max_tokens, 500);
});

test("prepareAnthropicPayload rejects unknown providers", () => {
  const result = prepareAnthropicPayload({
    model: "unknown/MiniMax-M3",
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected payload preparation to fail");
  }

  assert.equal(result.error.status, 400);
  assert.match(result.error.error.message, /provider is one of: minimax/);
  assert.equal(result.error.error.param, "model");
});
