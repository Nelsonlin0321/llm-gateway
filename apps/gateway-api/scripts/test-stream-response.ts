/// <reference types="node" />

/**
 * Smoke-test the local LLM proxy against all configured providers using
 * streamed chat completions.
 *
 * Prerequisites:
 *   1. Proxy is running (npm run dev) with provider API keys set
 *   2. From apps/gateway-api: npm run test:minimax
 *
 * Env:
 *   PROXY_BASE_URL  default http://localhost:8080
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { providers } from "../src/providers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);
const payloadPath = join(__dirname, "sample-payload.json");
const endpoint = `${baseUrl}/openai/v1/chat/completions`;

type ChatPayload = {
  model: string;
  messages: unknown[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stream_options?: unknown;
};

type TestResult = {
  providerId: string;
  model: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  firstChunkMs?: number;
  totalDurationMs?: number;
};

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

  console.log("Stream response:");

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

    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    process.stdout.write(chunk);
  }

  const trailing = decoder.decode();
  if (trailing) {
    text += trailing;
    process.stdout.write(trailing);
  }

  if (text !== "" && !text.endsWith("\n")) {
    process.stdout.write("\n");
  }

  return { text, firstChunkMs };
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
    stream: true,
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

  console.log(`Status:  ${response.status} ${response.statusText}`);
  console.log(
    `Content-Type: ${response.headers.get("content-type") ?? "(missing)"}`,
  );
  console.log("---");

  const { text, firstChunkMs } = await readStreamBody(response);
  const totalDurationMs = Date.now() - started;

  console.log("---");
  console.log(
    `First chunk: ${
      typeof firstChunkMs === "number" ? `${firstChunkMs}ms` : "no chunks"
    }`,
  );
  console.log(`Total: ${totalDurationMs}ms`);
  console.log(text.trim() !== "" ? "OK" : "FAILED (empty stream body)");

  return {
    providerId,
    model,
    ok: response.ok && text.trim() !== "",
    status: response.status,
    statusText: response.statusText,
    firstChunkMs,
    totalDurationMs,
  };
}

async function main(): Promise<void> {
  const payloadRaw = await readFile(payloadPath, "utf8");
  const payload = JSON.parse(payloadRaw) as ChatPayload;
  const {
    model: _sampleModel,
    stream: _sampleStream,
    ...payloadTemplate
  } = payload;

  console.log("=== LLM Proxy provider stream smoke test ===");
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
    const firstChunk =
      typeof result.firstChunkMs === "number"
        ? ` first-chunk=${result.firstChunkMs}ms`
        : "";
    const total =
      typeof result.totalDurationMs === "number"
        ? ` total=${result.totalDurationMs}ms`
        : "";

    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.providerId} ${result.model} - ${status}${firstChunk}${total}`,
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
