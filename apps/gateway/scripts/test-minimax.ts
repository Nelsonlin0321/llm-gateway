/**
 * Smoke-test the local LLM proxy against MiniMax.
 *
 * Prerequisites:
 *   1. Proxy is running (npm run dev) with MINIMAX_API_KEY set
 *   2. From apps/proxy: npm run test:minimax
 *
 * Env:
 *   PROXY_BASE_URL  default http://localhost:3000
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const payloadPath = join(__dirname, "sample-payload.json");

async function main(): Promise<void> {
  const payloadRaw = await readFile(payloadPath, "utf8");
  const payload = JSON.parse(payloadRaw) as {
    model: string;
    messages: unknown[];
    max_tokens?: number;
    temperature?: number;
  };

  console.log("=== LLM Proxy MiniMax smoke test ===");
  console.log(`URL:   ${baseUrl}/openai/v1/chat/completions`);
  console.log(`Model: ${payload.model}`);
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("---");

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/openai/v1/chat/completions`, {
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
    process.exitCode = 1;
    return;
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

  if (!response.ok) {
    process.exitCode = 1;
    return;
  }

  // Best-effort content extract for a quick human-readable summary.
  if (
    body &&
    typeof body === "object" &&
    "choices" in body &&
    Array.isArray((body as { choices: unknown }).choices)
  ) {
    const choice = (
      body as { choices: Array<{ message?: { content?: string } }> }
    ).choices[0];
    const content = choice?.message?.content;
    if (content) {
      console.log("---");
      console.log("Assistant:");
      console.log(content);
    }
  }

  console.log("---");
  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
