import "dotenv/config";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { anthropicCompatibleProviders } from "../src/providers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const payloadPath = join(
  __dirname,
  "fixtures",
  "sample-anthropic-payload.json",
);

type MessagesPayload = {
  model: string;
  messages: unknown[];
  max_tokens: number;
  stream?: boolean;
};

export function getLiveTestSkipReason(): string | undefined {
  if (process.env.LIVE_PROXY_TEST === "1") {
    return undefined;
  }

  return "Set LIVE_PROXY_TEST=1 to run live proxy tests against the local gateway";
}

export function getProviderIds(): string[] {
  const requested = process.env.PROXY_TEST_PROVIDERS;
  const providerIds = Object.keys(anthropicCompatibleProviders);

  if (!requested) {
    return providerIds;
  }

  const selected = requested
    .split(",")
    .map((providerId) => providerId.trim())
    .filter(Boolean);
  const unknown = selected.filter(
    (providerId) => !providerIds.includes(providerId),
  );

  assert.deepEqual(
    unknown,
    [],
    `Unknown provider ids in PROXY_TEST_PROVIDERS: ${unknown.join(", ")}`,
  );

  return selected;
}

export async function loadPayloadTemplate(): Promise<
  Omit<MessagesPayload, "model">
> {
  const payloadRaw = await readFile(payloadPath, "utf8");
  const payload = JSON.parse(payloadRaw) as MessagesPayload;
  const { model: _sampleModel, ...payloadTemplate } = payload;
  return payloadTemplate;
}

function buildModel(providerId: string): string {
  const provider = anthropicCompatibleProviders[providerId];
  assert.ok(provider, `Unknown provider "${providerId}"`);
  return `${providerId}/${provider.exampleModel}`;
}

function getAssistantText(body: unknown): string | null {
  if (
    !body ||
    typeof body !== "object" ||
    !("content" in body) ||
    !Array.isArray((body as { content: unknown[] }).content)
  ) {
    return null;
  }

  const content = (
    body as { content: Array<{ type?: unknown; text?: unknown }> }
  ).content;
  const textItem = content.find((item) => item?.type === "text");
  const text = textItem?.text;

  if (typeof text === "string" && text.trim() !== "") {
    return text;
  }

  return null;
}

async function readStreamBody(response: Response): Promise<{
  text: string;
  firstChunkMs?: number;
}> {
  if (!response.body) {
    return { text: "" };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const started = Date.now();
  let firstChunkMs: number | undefined;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    if (firstChunkMs === undefined) {
      firstChunkMs = Date.now() - started;
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return { text, firstChunkMs };
}

export async function runJsonProviderTest(
  providerId: string,
  payloadTemplate: Omit<MessagesPayload, "model">,
): Promise<{
  model: string;
  status: number;
  latencyMs: number;
}> {
  const model = buildModel(providerId);
  const payload: MessagesPayload = {
    ...payloadTemplate,
    model,
    stream: false,
  };
  const endpoint = `${baseUrl}/anthropic/v1/messages`;

  const started = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const latencyMs = Date.now() - started;
  const rawText = await response.text();

  assert.ok(
    response.headers.get("content-type")?.includes("application/json"),
    `Expected JSON response for ${providerId}, got ${response.headers.get("content-type") ?? "(missing)"}`,
  );

  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    assert.fail(`Expected JSON body for ${providerId}, got: ${rawText}`);
  }

  assert.ok(
    response.ok,
    [
      `Expected success for ${providerId}, got ${response.status} ${response.statusText}: ${rawText}`,
      `Check that ${anthropicCompatibleProviders[providerId]?.apiKeyEnv ?? "the provider API key env var"} is set correctly.`,
    ].join("\n"),
  );
  assert.ok(
    getAssistantText(body) !== null,
    `Expected assistant message content for ${providerId}, got: ${rawText}`,
  );

  return {
    model,
    status: response.status,
    latencyMs,
  };
}

export async function runStreamProviderTest(
  providerId: string,
  payloadTemplate: Omit<MessagesPayload, "model">,
): Promise<{
  model: string;
  status: number;
  firstChunkMs?: number;
  totalDurationMs: number;
}> {
  const model = buildModel(providerId);
  const payload: MessagesPayload = {
    ...payloadTemplate,
    model,
    stream: true,
  };
  const endpoint = `${baseUrl}/anthropic/v1/messages`;

  const started = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const { text, firstChunkMs } = await readStreamBody(response);
  const totalDurationMs = Date.now() - started;

  if (!response.ok) {
    assert.fail(
      [
        `Expected success for ${providerId}, got ${response.status} ${response.statusText}: ${text}`,
        `Check that ${anthropicCompatibleProviders[providerId]?.apiKeyEnv ?? "the provider API key env var"} is set correctly.`,
      ].join("\n"),
    );
  }

  assert.ok(
    response.headers.get("content-type")?.includes("text/event-stream"),
    `Expected event stream for ${providerId}, got ${response.headers.get("content-type") ?? "(missing)"}`,
  );
  assert.ok(
    text.trim() !== "",
    `Expected non-empty stream body for ${providerId}`,
  );

  return {
    model,
    status: response.status,
    firstChunkMs,
    totalDurationMs,
  };
}
