import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureStreamUsageOptions,
  prepareOpenaiPayload,
} from "../src/payload-openai.js";

test("ensureStreamUsageOptions adds usage for /chat/completions streams", () => {
  const body = {
    model: "gpt-5.4-mini",
    stream: true,
    stream_options: { include_usage: false, extra: "keep-me" },
  };

  const result = ensureStreamUsageOptions(body, "/chat/completions");

  assert.deepEqual(result, {
    model: "gpt-5.4-mini",
    stream: true,
    stream_options: { include_usage: true },
  });
});

test("ensureStreamUsageOptions adds usage for /v1/chat/completions streams", () => {
  const body = {
    model: "gpt-5.4-mini",
    stream: true,
  };

  const result = ensureStreamUsageOptions(body, "/v1/chat/completions");

  assert.deepEqual(result, {
    model: "gpt-5.4-mini",
    stream: true,
    stream_options: { include_usage: true },
  });
});

test("ensureStreamUsageOptions leaves non-chat endpoints unchanged", () => {
  const body = {
    model: "gpt-5.4-mini",
    stream: true,
  };

  const result = ensureStreamUsageOptions(body, "/v1/responses");

  assert.equal(result, body);
});

test("prepareOpenaiPayload strips provider prefix and adds usage for streamed chat completions", () => {
  const result = prepareOpenaiPayload(
    {
      model: "openai/gpt-5.4-mini",
      stream: true,
    },
    "/v1/chat/completions",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.equal(result.value.parsed.providerId, "openai");
  assert.equal(result.value.upstreamBody.model, "gpt-5.4-mini");
  assert.deepEqual(result.value.upstreamBody.stream_options, {
    include_usage: true,
  });
});

test("prepareOpenaiPayload does not add usage for streamed non-chat endpoints", () => {
  const result = prepareOpenaiPayload(
    {
      model: "openai/gpt-5.4-mini",
      stream: true,
    },
    "/v1/responses",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.equal(result.value.upstreamBody.model, "gpt-5.4-mini");
  assert.equal("stream_options" in result.value.upstreamBody, false);
});
