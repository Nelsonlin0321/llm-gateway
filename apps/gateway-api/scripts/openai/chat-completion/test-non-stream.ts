/// <reference types="node" />

/**
 * Smoke-test the local LLM proxy against all configured providers.
 *
 * Prerequisites:
 *   1. Proxy is running (npm run dev) with provider API keys set
 *   2. From apps/gateway-api: npm run test:minimax
 *
 * Env:
 *   PROXY_BASE_URL  default http://localhost:8080
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openaiCompatibleProviders as providers } from "../../providers";

const childApiKey = process.env.CHILD_API_KEY || "";
const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const payloadPath = join(__dirname, "payload.json");
const endpoint = `${baseUrl}/openai/chat/completions`;

type ChatPayload = {
  model: string;
  messages: unknown[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
};

type TestResult = {
  providerId: string;
  model: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
};

function getAssistantContent(body: unknown): string | null {
  if (
    !body ||
    typeof body !== "object" ||
    !("choices" in body) ||
    !Array.isArray((body as { choices: unknown[] }).choices)
  ) {
    return null;
  }

  const choice = (
    body as { choices: Array<{ message?: { content?: unknown } }> }
  ).choices[0];
  const content = choice?.message?.content;

  if (typeof content === "string" && content.trim() !== "") {
    return content;
  }

  return null;
}

async function runProviderTest(
  providerId: string,
  payloadTemplate: Omit<ChatPayload, "model">,
): Promise<TestResult> {
  const provider = providers[providerId];
  const model = `${providerId}/${provider.exampleModel}`;
  const payload: ChatPayload = {
    ...payloadTemplate,
    model,
  };

  console.log(`=== Provider: ${providerId} ===`);
  console.log(`URL:   ${endpoint}`);
  console.log(`Model: ${payload.model}`);
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("---");

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${childApiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Request failed: ${message}`);
    console.error("Is the proxy running? Try: npm run dev");
    return {
      providerId,
      model,
      ok: false,
    };
  }

  const latencyMs = Date.now() - started;
  const text = await response.text();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log(`Status:  ${response.status} ${response.statusText}`);
  console.log(`Latency: ${latencyMs}ms`);
  console.log("Response body:");
  console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));

  const content = getAssistantContent(body);
  if (content) {
    console.log("---");
    console.log("Assistant:");
    console.log(content);
  }

  console.log("---");
  console.log(response.ok ? "OK" : "FAILED");

  return {
    providerId,
    model,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    latencyMs,
  };
}

async function main(): Promise<void> {
  const payloadRaw = await readFile(payloadPath, "utf8");
  const payload = JSON.parse(payloadRaw) as ChatPayload;
  const { model: _sampleModel, ...payloadTemplate } = payload;

  console.log("=== LLM Proxy provider smoke test ===");
  console.log(`Providers: ${Object.keys(providers).join(", ")}`);
  console.log("---");

  const results: TestResult[] = [];
  for (const providerId of Object.keys(providers)) {
    const result = await runProviderTest(providerId, payloadTemplate);
    results.push(result);
    console.log("");
  }

  console.log("=== Summary ===");
  for (const result of results) {
    const status = result.status
      ? `${result.status} ${result.statusText ?? ""}`.trim()
      : "request failed";
    const latency =
      typeof result.latencyMs === "number" ? ` (${result.latencyMs}ms)` : "";
    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.providerId} ${result.model} - ${status}${latency}`,
    );
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
