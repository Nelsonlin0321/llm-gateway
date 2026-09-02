/**
 * Public Gateway API guide content.
 *
 * Origin comes from NEXT_PUBLIC_PROXY_API_URL (same env the portal uses
 * to call the gateway). POST /openai/* and POST /anthropic/* are catch-all
 * proxies: any path the upstream LLM provider supports can be called.
 */

export const PROXY_API_URL_ENV = "NEXT_PUBLIC_PROXY_API_URL";
export const EXAMPLE_CHILD_KEY = "sk_YOUR_CHILD_KEY";
export const EXAMPLE_MODEL = "deepseek/deepseek-v4-flash";

export const OPENAI_PREFIX = "/openai";
export const ANTHROPIC_PREFIX = "/anthropic";

/** Common examples — not an allowlist. Any POST under the prefix is proxied. */
export const OPENAI_CHAT_PATH = "/openai/chat/completions";
export const OPENAI_CHAT_V1_PATH = "/openai/v1/chat/completions";
export const OPENAI_EMBEDDINGS_PATH = "/openai/v1/embeddings";
export const ANTHROPIC_MESSAGES_PATH = "/anthropic/v1/messages";
export const OPENAI_MODELS_PATH = "/openai/v1/models";
export const ANTHROPIC_MODELS_PATH = "/anthropic/v1/models";

export function getProxyApiUrl(): string {
  return (process.env.NEXT_PUBLIC_PROXY_API_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
}

/** Origin used in copy-paste examples. Does not fall back to localhost. */
export function proxyApiUrlForExamples(): string {
  return getProxyApiUrl() || `$${PROXY_API_URL_ENV}`;
}

export const proxyRoutes = [
  {
    method: "GET",
    path: "/health",
    auth: false,
    description: "Liveness. No child key required.",
  },
  {
    method: "GET",
    path: "/ready",
    auth: false,
    description: "Postgres (and Redis, if configured) readiness.",
  },
  {
    method: "GET",
    path: OPENAI_MODELS_PATH,
    auth: true,
    description: "OpenAI-compatible models visible to this child key’s org.",
  },
  {
    method: "GET",
    path: ANTHROPIC_MODELS_PATH,
    auth: true,
    description: "Anthropic-compatible models visible to this child key’s org.",
  },
  {
    method: "POST",
    path: "/openai/*",
    auth: true,
    description:
      "Proxy any OpenAI-compatible path the upstream provider supports.",
  },
  {
    method: "POST",
    path: "/anthropic/*",
    auth: true,
    description:
      "Proxy any Anthropic-compatible path the upstream provider supports.",
  },
] as const;

export const exampleOpenaiPaths = [
  "/openai/chat/completions",
  "/openai/v1/chat/completions",
  "/openai/v1/embeddings",
  "/openai/v1/responses",
  "/openai/v1/images/generations",
] as const;

export const exampleAnthropicPaths = [
  "/anthropic/v1/messages",
  "/anthropic/v1/messages/count_tokens",
] as const;

const exampleMessages = [
  {
    role: "system",
    content: [
      {
        type: "text",
        text: "You are a helpful assistant. Keep answers brief.",
      },
    ],
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "Hi there!",
      },
    ],
  },
] as const;

const exampleMetadata = {
  user_email: "user@example.com",
} as const;

export function openaiChatPayload(stream = false): Record<string, unknown> {
  return {
    model: EXAMPLE_MODEL,
    messages: exampleMessages,
    stream,
    metadata: exampleMetadata,
  };
}

export function openaiEmbeddingsPayload(): Record<string, unknown> {
  return {
    model: EXAMPLE_MODEL,
    input: "Hello from the gateway",
    metadata: exampleMetadata,
  };
}

export function anthropicMessagesPayload(
  stream = false,
): Record<string, unknown> {
  return {
    model: EXAMPLE_MODEL,
    messages: exampleMessages,
    max_tokens: 256,
    stream,
    metadata: exampleMetadata,
  };
}

function prettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function curlHeaders(): string {
  return `-H "Authorization: Bearer ${EXAMPLE_CHILD_KEY}" \\
  -H "Content-Type: application/json"`;
}

export function curlGetExample(path: string): string {
  const base = proxyApiUrlForExamples();
  return `curl -s ${base}${path} \\
  -H "Authorization: Bearer ${EXAMPLE_CHILD_KEY}"`;
}

export function curlPostExample(path: string, payload: unknown): string {
  const base = proxyApiUrlForExamples();
  return `curl -s ${base}${path} \\
  ${curlHeaders()} \\
  -d '${JSON.stringify(payload)}'`;
}

export function curlStreamExample(path: string, payload: unknown): string {
  const base = proxyApiUrlForExamples();
  return `curl -N ${base}${path} \\
  ${curlHeaders()} \\
  -d '${JSON.stringify(payload)}'`;
}

export function openaiChatCurl(): string {
  return curlPostExample(OPENAI_CHAT_PATH, openaiChatPayload(false));
}

export function openaiChatStreamCurl(): string {
  return curlStreamExample(OPENAI_CHAT_PATH, openaiChatPayload(true));
}

export function openaiEmbeddingsCurl(): string {
  return curlPostExample(OPENAI_EMBEDDINGS_PATH, openaiEmbeddingsPayload());
}

export function anthropicMessagesCurl(): string {
  return curlPostExample(ANTHROPIC_MESSAGES_PATH, anthropicMessagesPayload(false));
}

export function anthropicMessagesStreamCurl(): string {
  return curlStreamExample(
    ANTHROPIC_MESSAGES_PATH,
    anthropicMessagesPayload(true),
  );
}

export function listOpenaiModelsCurl(): string {
  return curlGetExample(OPENAI_MODELS_PATH);
}

export function listAnthropicModelsCurl(): string {
  return curlGetExample(ANTHROPIC_MODELS_PATH);
}

export function healthCurl(): string {
  return `curl -s ${proxyApiUrlForExamples()}/health`;
}

export function readyCurl(): string {
  return `curl -s ${proxyApiUrlForExamples()}/ready`;
}

export function openaiPythonSdk(): string {
  const base = proxyApiUrlForExamples();
  return `from openai import OpenAI

client = OpenAI(
    api_key="${EXAMPLE_CHILD_KEY}",
    base_url="${base}/openai",
)

completion = client.chat.completions.create(
    model="${EXAMPLE_MODEL}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant. Keep answers brief."},
        {"role": "user", "content": "Hi there!"},
    ],
    extra_body={"metadata": {"user_email": "user@example.com"}},
)

print(completion.choices[0].message.content)`;
}

export function openaiNodeSdk(): string {
  const base = proxyApiUrlForExamples();
  return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${EXAMPLE_CHILD_KEY}",
  baseURL: "${base}/openai",
});

const completion = await client.chat.completions.create({
  model: "${EXAMPLE_MODEL}",
  messages: [
    { role: "system", content: "You are a helpful assistant. Keep answers brief." },
    { role: "user", content: "Hi there!" },
  ],
});

console.log(completion.choices[0].message.content);`;
}

export function anthropicPythonSdk(): string {
  const base = proxyApiUrlForExamples();
  return `from anthropic import Anthropic

client = Anthropic(
    api_key="${EXAMPLE_CHILD_KEY}",
    base_url="${base}/anthropic",
)

message = client.messages.create(
    model="${EXAMPLE_MODEL}",
    max_tokens=256,
    system="You are a helpful assistant. Keep answers brief.",
    messages=[{"role": "user", "content": "Hi there!"}],
    extra_body={"metadata": {"user_email": "user@example.com"}},
)

print(message.content)`;
}

export function openaiChatPayloadJson(): string {
  return prettyJson(openaiChatPayload(false));
}

export function openaiEmbeddingsPayloadJson(): string {
  return prettyJson(openaiEmbeddingsPayload());
}

export function anthropicMessagesPayloadJson(): string {
  return prettyJson(anthropicMessagesPayload(false));
}

export const docsNav = [
  { id: "quick-start", label: "Quick start" },
  { id: "base-url", label: "Base URL" },
  { id: "auth", label: "Authentication" },
  { id: "models", label: "Model IDs" },
  { id: "proxy", label: "Proxy routes" },
  { id: "openai", label: "OpenAI examples" },
  { id: "anthropic", label: "Anthropic examples" },
  { id: "streaming", label: "Streaming" },
  { id: "metadata", label: "Metadata" },
  { id: "sdks", label: "SDKs" },
  { id: "errors", label: "Errors & limits" },
] as const;
