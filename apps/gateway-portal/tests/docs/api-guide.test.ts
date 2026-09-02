import test from "node:test";
import assert from "node:assert/strict";

import {
  ANTHROPIC_MESSAGES_PATH,
  ANTHROPIC_PREFIX,
  EXAMPLE_MODEL,
  OPENAI_CHAT_PATH,
  OPENAI_EMBEDDINGS_PATH,
  OPENAI_PREFIX,
  PROXY_API_URL_ENV,
  anthropicMessagesCurl,
  anthropicMessagesPayload,
  anthropicMessagesStreamCurl,
  anthropicPythonSdk,
  exampleAnthropicPaths,
  exampleOpenaiPaths,
  getProxyApiUrl,
  openaiChatCurl,
  openaiChatPayload,
  openaiChatStreamCurl,
  openaiEmbeddingsCurl,
  openaiPythonSdk,
  proxyApiUrlForExamples,
  proxyRoutes,
} from "@/lib/docs/api-guide";

const SAMPLE_ORIGIN = "https://gateway.example.test";

function withProxyUrl<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.NEXT_PUBLIC_PROXY_API_URL;
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_PROXY_API_URL;
  } else {
    process.env.NEXT_PUBLIC_PROXY_API_URL = value;
  }
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_PROXY_API_URL;
    } else {
      process.env.NEXT_PUBLIC_PROXY_API_URL = previous;
    }
  }
}

test("proxy origin comes from NEXT_PUBLIC_PROXY_API_URL, not localhost", () => {
  withProxyUrl(`${SAMPLE_ORIGIN}/`, () => {
    assert.equal(getProxyApiUrl(), SAMPLE_ORIGIN);
    assert.equal(proxyApiUrlForExamples(), SAMPLE_ORIGIN);
    assert.match(openaiChatCurl(), new RegExp(SAMPLE_ORIGIN));
    assert.doesNotMatch(openaiChatCurl(), /localhost/);
  });

  withProxyUrl(undefined, () => {
    assert.equal(getProxyApiUrl(), "");
    assert.equal(proxyApiUrlForExamples(), `$${PROXY_API_URL_ENV}`);
    assert.doesNotMatch(openaiChatCurl(), /localhost/);
  });
});

test("catch-all proxy prefixes are documented", () => {
  const paths = proxyRoutes.map((route) => `${route.method} ${route.path}`);
  assert.ok(paths.includes(`POST ${OPENAI_PREFIX}/*`));
  assert.ok(paths.includes(`POST ${ANTHROPIC_PREFIX}/*`));
  assert.ok(exampleOpenaiPaths.includes(OPENAI_CHAT_PATH));
  assert.ok(exampleOpenaiPaths.includes(OPENAI_EMBEDDINGS_PATH));
  assert.ok(exampleAnthropicPaths.includes(ANTHROPIC_MESSAGES_PATH));
});

test("example model is provider/alias", () => {
  assert.match(EXAMPLE_MODEL, /^[a-z0-9-]+\/.+/);
});

test("OpenAI chat payload matches the bulk-proxy fixture shape", () => {
  const payload = openaiChatPayload(false);
  assert.equal(payload.model, EXAMPLE_MODEL);
  assert.equal(payload.stream, false);
  assert.deepEqual(payload.metadata, { user_email: "user@example.com" });
  const messages = payload.messages as Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
  }>;
  assert.equal(messages[0]?.role, "system");
  assert.equal(messages[0]?.content[0]?.type, "text");
  assert.equal(
    messages[0]?.content[0]?.text,
    "You are a helpful assistant. Keep answers brief.",
  );
  assert.equal(messages[1]?.role, "user");
  assert.equal(messages[1]?.content[0]?.text, "Hi there!");
});

test("Anthropic payload includes max_tokens like the bulk-proxy fixture", () => {
  const payload = anthropicMessagesPayload(true);
  assert.equal(payload.max_tokens, 256);
  assert.equal(payload.stream, true);
  assert.equal(payload.model, EXAMPLE_MODEL);
});

test("curl examples use the env origin and Bearer auth", () => {
  withProxyUrl(SAMPLE_ORIGIN, () => {
    assert.match(openaiChatCurl(), /\/openai\/chat\/completions/);
    assert.match(openaiEmbeddingsCurl(), /\/openai\/v1\/embeddings/);
    assert.match(anthropicMessagesCurl(), /\/anthropic\/v1\/messages/);
    assert.match(openaiChatCurl(), /Authorization: Bearer sk_/);
    assert.match(openaiChatStreamCurl(), /curl -N /);
    assert.match(anthropicMessagesStreamCurl(), /"stream":true/);
    assert.match(openaiChatCurl(), new RegExp(SAMPLE_ORIGIN));
  });
});

test("SDK examples point vendor clients at gateway prefixes from env", () => {
  withProxyUrl(SAMPLE_ORIGIN, () => {
    assert.match(
      openaiPythonSdk(),
      new RegExp(`base_url="${SAMPLE_ORIGIN}/openai"`),
    );
    assert.match(
      anthropicPythonSdk(),
      new RegExp(`base_url="${SAMPLE_ORIGIN}/anthropic"`),
    );
  });
});
