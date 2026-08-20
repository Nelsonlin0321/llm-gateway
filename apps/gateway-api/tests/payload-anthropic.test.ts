import assert from "node:assert/strict";
import test from "node:test";
import { parseAnthropicPayload } from "../src/payload/payload-anthropic.js";

test("parseAnthropicPayload strips provider prefix from the upstream model", () => {
  const result = parseAnthropicPayload({
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

  assert.equal(result.value.parsed.providerName, "minimax");
  assert.equal(result.value.downstreamBody.model, "MiniMax-M3");
  assert.equal(result.value.downstreamBody.max_tokens, 500);
});

test("parseAnthropicPayload accepts provider prefixes that will resolve later", () => {
  const result = parseAnthropicPayload({
    model: "db-provider/MiniMax-M3",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.equal(result.value.parsed.providerName, "db-provider");
  assert.equal(result.value.downstreamBody.model, "MiniMax-M3");
});

test("parseAnthropicPayload captures metadata but does not forward it upstream", () => {
  const result = parseAnthropicPayload({
    model: "minimax/MiniMax-M3",
    metadata: { user_email: "user@example.com" },
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.deepEqual(result.value.metadata, { user_email: "user@example.com" });
  assert.equal("metadata" in result.value.downstreamBody, false);
});

test("parseAnthropicPayload rejects non-object metadata", () => {
  const result = parseAnthropicPayload({
    model: "minimax/MiniMax-M3",
    metadata: "user@example.com",
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected payload preparation to fail");
  }

  assert.equal(result.error.error.param, "metadata");
});
