/// <reference types="node" />

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { anthropicCompatibleProviders as providers } from "../../providers";

const childApiKey = process.env.CHILD_API_KEY || "";
const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const payloadPath = join(__dirname, "payload.json");
const endpoint = `${baseUrl}/anthropic/v1/messages`;

type MessagesPayload = {
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

async function runProviderTest(
  providerId: string,
  payloadTemplate: Omit<MessagesPayload, "model">,
): Promise<TestResult> {
  const provider = providers[providerId];
  const model = `${providerId}/${provider.exampleModel}`;
  const payload: MessagesPayload = {
    ...payloadTemplate,
    model,
    max_tokens: payloadTemplate.max_tokens ?? 256,
    stream: false,
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
        authorization: `Bearer ${childApiKey}`,
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

  const assistantText = getAssistantText(body);
  if (assistantText) {
    console.log("---");
    console.log("Assistant:");
    console.log(assistantText);
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
  const payload = JSON.parse(payloadRaw) as MessagesPayload;
  const { model: _sampleModel, ...payloadTemplate } = payload;

  console.log("=== LLM Proxy Anthropic messages smoke test ===");
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
