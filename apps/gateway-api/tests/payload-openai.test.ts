import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureStreamUsageOptions,
  parseOpenaiPayload,
} from "../src/payload/payload-openai.js";

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

test("parseOpenaiPayload preserves the client model and adds usage for streamed chat completions", () => {
  const result = parseOpenaiPayload(
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

  assert.equal(result.value.parsed.providerName, "openai");
  assert.equal(result.value.parsed.model, "gpt-5.4-mini");
  assert.equal(result.value.downstreamBody.model, "openai/gpt-5.4-mini");
  assert.deepEqual(result.value.downstreamBody.stream_options, {
    include_usage: true,
  });
});

test("parseOpenaiPayload does not add usage for streamed non-chat endpoints", () => {
  const result = parseOpenaiPayload(
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

  assert.equal(result.value.downstreamBody.model, "openai/gpt-5.4-mini");
  assert.equal("stream_options" in result.value.downstreamBody, false);
});

test("parseOpenaiPayload accepts provider prefixes that will resolve later", () => {
  const result = parseOpenaiPayload(
    {
      model: "db-openai/gpt-5.4-mini",
    },
    "/v1/responses",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.equal(result.value.parsed.providerName, "db-openai");
  assert.equal(result.value.parsed.model, "gpt-5.4-mini");
  assert.equal(result.value.downstreamBody.model, "db-openai/gpt-5.4-mini");
});

test("parseOpenaiPayload captures metadata but does not forward it upstream", () => {
  const result = parseOpenaiPayload(
    {
      model: "openai/gpt-5.4-mini",
      metadata: { user_email: "user@example.com" },
    },
    "/v1/chat/completions",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected payload preparation to succeed");
  }

  assert.deepEqual(result.value.metadata, { user_email: "user@example.com" });
  assert.equal("metadata" in result.value.downstreamBody, false);
});

test("parseOpenaiPayload rejects non-object metadata", () => {
  const result = parseOpenaiPayload(
    {
      model: "openai/gpt-5.4-mini",
      metadata: "user@example.com",
    },
    "/v1/chat/completions",
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected payload preparation to fail");
  }

  assert.equal(result.error.error.param, "metadata");
});
