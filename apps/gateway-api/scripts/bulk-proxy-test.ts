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
 *   PROXY_BASE_URL     default http://localhost:8080
 *   CHILD_API_KEY      required for Authorization
 *   DATABASE_URL       required for model list
 *   FORMAT_RESPONSES   true|false — format saved bodies (default false = raw)
 *
 * CLI:
 *   --format / --no-format  override FORMAT_RESPONSES
 *
 * Payload files live next to this script, named from the path with "/" → "-":
 *   /anthropic/v1/messages → -anthropic-v1-messages.json
 *
 * Responses under scripts/response/:
 *   {url-path}-{provider-name}-{model-name}.json   (non-stream)
 *   {url-path}-{provider-name}-{model-name}.jsonl  (stream)
 * e.g. anthropic-v1-messages-minimax-MiniMax-M3.json
 *
 * Body content: raw by default; with FORMAT_RESPONSES / --format, pretty-print
 * JSON and convert SSE streams to JSONL.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { db, llmProviders, models } from "../src/lib/db";

const SUB_URLS = [
  "/anthropic/v1/messages",
  "/openai/chat/completions",
] as const;
const STREAMS = [true, false] as const;

/** Parse true/false from env or CLI; CLI wins when present. */
function resolveFormatResponses(): boolean {
  if (process.argv.includes("--format")) return true;
  if (process.argv.includes("--no-format")) return false;
  const env = process.env.FORMAT_RESPONSES?.trim().toLowerCase();
  if (env === "1" || env === "true" || env === "yes") return true;
  if (env === "0" || env === "false" || env === "no") return false;
  return false;
}

/** When true, pretty-print JSON and convert SSE → JSONL when saving. */
const FORMAT_RESPONSES = resolveFormatResponses();

const childApiKey = process.env.CHILD_API_KEY?.trim() ?? "";
const __dirname = dirname(fileURLToPath(import.meta.url));
const responseDir = join(__dirname, "response");
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
  savedPath?: string;
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

/** "/anthropic/v1/messages" → "-anthropic-v1-messages" (payload file stem) */
function payloadStemFromUrl(url: string): string {
  return url.replaceAll("/", "-");
}

/** "/anthropic/v1/messages" → "anthropic-v1-messages" (response file prefix) */
function urlPathFromUrl(url: string): string {
  return url.replace(/^\//, "").replaceAll("/", "-");
}

/** Keep filesystem-safe path segments (preserve dots and common model chars). */
function sanitizeFileSegment(value: string): string {
  return value
    .replaceAll("/", "-")
    .replaceAll("\\", "-")
    .replace(/[^\w.\-@+]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "") || "unknown";
}

/**
 * Alias is `provider/model` (e.g. minimax/MiniMax-M3).
 * Split on the first `/` only so model names can contain slashes if ever needed.
 */
function splitAlias(alias: string): { providerName: string; modelName: string } {
  const slash = alias.indexOf("/");
  if (slash === -1) {
    return { providerName: "unknown", modelName: alias || "unknown" };
  }
  return {
    providerName: alias.slice(0, slash) || "unknown",
    modelName: alias.slice(slash + 1) || "unknown",
  };
}

/**
 * {url-path}-{provider-name}-{model-name}.json|.jsonl
 * e.g. anthropic-v1-messages-minimax-MiniMax-M3.json
 */
function responseFileName(opts: {
  url: string;
  modelAlias: string;
  stream: boolean;
}): string {
  const urlPath = sanitizeFileSegment(urlPathFromUrl(opts.url));
  const { providerName, modelName } = splitAlias(opts.modelAlias);
  const ext = opts.stream ? "jsonl" : "json";
  return `${urlPath}-${sanitizeFileSegment(providerName)}-${sanitizeFileSegment(modelName)}.${ext}`;
}

/** Non-stream: pretty JSON when parseable; otherwise raw body. */
function formatJsonResponse(text: string): string {
  try {
    return `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
  } catch {
    return text.endsWith("\n") ? text : `${text}\n`;
  }
}

/**
 * Stream: SSE (`data: {...}`) → JSONL (one JSON object per line).
 * Non-JSON data lines (e.g. [DONE]) skipped; non-SSE bodies fall back to raw lines.
 */
function formatJsonlResponse(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let sawSseData = false;

  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }
    sawSseData = true;
    const payload = line.slice("data:".length).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    try {
      out.push(JSON.stringify(JSON.parse(payload)));
    } catch {
      out.push(JSON.stringify({ raw: payload }));
    }
  }

  if (sawSseData) {
    return out.length > 0 ? `${out.join("\n")}\n` : "";
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.stringify(JSON.parse(trimmed)));
    } catch {
      out.push(JSON.stringify({ raw: trimmed }));
    }
  }
  return out.length > 0 ? `${out.join("\n")}\n` : "";
}

/**
 * Save response body under scripts/response/.
 * Extension depends on stream; content is raw unless FORMAT_RESPONSES is true.
 */
async function saveResponse(opts: {
  url: string;
  modelAlias: string;
  stream: boolean;
  body: string;
  format: boolean;
}): Promise<string> {
  await mkdir(responseDir, { recursive: true });
  const fileName = responseFileName(opts);
  const filePath = join(responseDir, fileName);
  const content = opts.format
    ? opts.stream
      ? formatJsonlResponse(opts.body)
      : formatJsonResponse(opts.body)
    : opts.body;
  await writeFile(filePath, content, "utf8");
  return filePath;
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

  let savedPath: string | undefined;
  try {
    savedPath = await saveResponse({
      url,
      modelAlias,
      stream,
      body: text,
      format: FORMAT_RESPONSES,
    });
    console.log(
      `Saved:  ${savedPath}${FORMAT_RESPONSES ? " (formatted)" : " (raw)"}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to save response: ${message}`);
  }

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
    savedPath,
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
  console.log(`Responses: ${responseDir}`);
  console.log(
    `Format:    ${FORMAT_RESPONSES ? "on (pretty JSON / SSE→JSONL)" : "off (raw body)"}`,
  );
  console.log("---");

  const results: TestResult[] = [];

  for (const url of SUB_URLS) {
    const compatibleType = compatibilityTypeFromUrl(url);
    const payloadPath = join(__dirname, `${payloadStemFromUrl(url)}.json`);

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
    const saved = result.savedPath ? ` → ${result.savedPath}` : "";
    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.url} stream=${result.stream} ${result.model} - ${status}${latency}${saved}`,
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
