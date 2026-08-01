/// <reference types="node" />

/**
 * Live smoke test: hit gateway endpoints for every model in the DB that
 * matches each URL's API family (compatibility type), stream and non-stream.
 *
 * Prerequisites:
 *   1. Proxy running (bun run dev)
 *   2. DATABASE_URL set (loads models via Drizzle)
 *   3. CHILD_API_KEY set (plain sk_… child key)
 *
 * Env:
 *   PROXY_BASE_URL  default http://localhost:8080
 *   CHILD_API_KEY   required for Authorization
 *   DATABASE_URL    required for model list
 *
 * Payload files live next to this script, named from the path with "/" → "-":
 *   /anthropic/v1/messages → -anthropic-v1-messages.json
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { db, llmProviders, models } from "../src/lib/db";

const SUB_URLS = [
  "/anthropic/v1/messages",
  "/openai/chat/completions",
] as const;
const STREAMS = [true, false] as const;

const childApiKey = process.env.CHILD_API_KEY?.trim() ?? "";
const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.PROXY_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

type CompatibilityType = "openai" | "anthropic";

type TestResult = {
  url: string;
  stream: boolean;
  model: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  error?: string;
};

function compatibilityTypeFromUrl(url: string): CompatibilityType {
  // "/anthropic/v1/messages" → "anthropic"
  const segment = url.split("/").filter(Boolean)[0];
  if (segment === "openai" || segment === "anthropic") {
    return segment;
  }
  throw new Error(
    `Cannot derive compatibility type from url "${url}" (got "${segment}")`,
  );
}

/** "/anthropic/v1/messages" → "-anthropic-v1-messages" */
function urlIdFromUrl(url: string): string {
  return url.replaceAll("/", "-");
}

async function loadModelsForCompatibility(
  compatibilityType: CompatibilityType,
): Promise<Array<{ alias: string }>> {
  const rows = await db
    .select({
      alias: models.alias,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(eq(llmProviders.compatibilityType, compatibilityType));

  return rows;
}

async function runOne(opts: {
  url: string;
  stream: boolean;
  modelAlias: string;
  payloadTemplate: Record<string, unknown>;
}): Promise<TestResult> {
  const { url, stream, modelAlias, payloadTemplate } = opts;
  const endpoint = `${baseUrl}${url}`;
  const payload = {
    ...payloadTemplate,
    model: modelAlias,
    stream,
  };

  console.log(`=== ${url} | stream=${stream} | model=${modelAlias} ===`);
  console.log(`URL:   ${endpoint}`);
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("---");

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${childApiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Request failed: ${message}`);
    console.error("Is the proxy running? Try: bun run dev");
    return {
      url,
      stream,
      model: modelAlias,
      ok: false,
      error: message,
    };
  }

  const latencyMs = Date.now() - started;
  const text = await response.text();

  console.log(text);
  console.log(response.status);
  console.log(response.ok);
  console.log(`Latency: ${latencyMs}ms`);
  console.log("---");

  return {
    url,
    stream,
    model: modelAlias,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    latencyMs,
  };
}

async function main(): Promise<void> {
  if (!childApiKey) {
    throw new Error("CHILD_API_KEY is required (plain sk_… child key)");
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required to load models");
  }

  console.log("=== Gateway live model matrix ===");
  console.log(`Base URL:  ${baseUrl}`);
  console.log(`Sub URLs:  ${SUB_URLS.join(", ")}`);
  console.log(`Streams:   ${STREAMS.join(", ")}`);
  console.log("---");

  const results: TestResult[] = [];

  for (const url of SUB_URLS) {
    const compatibleType = compatibilityTypeFromUrl(url);
    const urlId = urlIdFromUrl(url);
    const payloadPath = join(__dirname, `${urlId}.json`);

    let payloadTemplate: Record<string, unknown>;
    try {
      const raw = await readFile(payloadPath, "utf8");
      payloadTemplate = JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to load payload for ${url} from ${payloadPath}: ${message}`,
      );
    }

    const modelRows = await loadModelsForCompatibility(compatibleType);
    console.log(
      `URL ${url} (compatible_type=${compatibleType}): ${modelRows.length} model(s)`,
    );

    if (modelRows.length === 0) {
      console.warn(
        `  No models found for compatibility type "${compatibleType}"`,
      );
      continue;
    }

    for (const stream of STREAMS) {
      for (const model of modelRows) {
        const result = await runOne({
          url,
          stream,
          modelAlias: model.alias,
          payloadTemplate,
        });
        results.push(result);
        console.log("");
      }
    }
  }

  console.log("=== Summary ===");
  for (const result of results) {
    const status = result.status
      ? `${result.status} ${result.statusText ?? ""}`.trim()
      : (result.error ?? "request failed");
    const latency =
      typeof result.latencyMs === "number" ? ` (${result.latencyMs}ms)` : "";
    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.url} stream=${result.stream} ${result.model} - ${status}${latency}`,
    );
  }

  if (results.length === 0) {
    console.error("No tests ran (no models found).");
    process.exitCode = 1;
    return;
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
