import "dotenv/config";
import type { CaptureLevel } from "./schema.js";

const DEFAULT_CAPTURE_LEVEL: CaptureLevel = "full";
const REDACTED_PAYLOAD_MAX_CHARS = 2_048;

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "api-key",
]);

export function parseCaptureLevel(
  raw: string | undefined | null,
): CaptureLevel {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "metadata" || value === "redacted" || value === "full") {
    return value;
  }
  return DEFAULT_CAPTURE_LEVEL;
}

/**
 * Capture level for request-log bodies.
 * Env: `REQUEST_LOG_CAPTURE_LEVEL` = `metadata` | `redacted` | `full`
 * Default production setting: `metadata` (no request/upstream bodies).
 */
export function getCaptureLevel(
  env: NodeJS.ProcessEnv = process.env,
): CaptureLevel {
  return parseCaptureLevel(env.REQUEST_LOG_CAPTURE_LEVEL);
}

export function sanitizeHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};

  if (headers instanceof Headers) {
    for (const [key, value] of headers.entries()) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Apply capture-level policy to a JSON payload string.
 * - `metadata`: omit body
 * - `redacted`: truncate long bodies
 * - `full`: store as-is
 */
export function applyPayloadCapture(
  payloadJson: string | undefined,
  level: CaptureLevel,
  maxChars: number = REDACTED_PAYLOAD_MAX_CHARS,
): string | undefined {
  if (level === "metadata" || payloadJson === undefined) {
    return undefined;
  }

  if (level === "full") {
    return payloadJson;
  }

  if (payloadJson.length <= maxChars) {
    return payloadJson;
  }

  return `${payloadJson.slice(0, maxChars)}…[truncated]`;
}

export function stringifyChildKeyTags(tags: unknown): string {
  if (tags !== null && typeof tags === "object" && !Array.isArray(tags)) {
    return JSON.stringify(tags);
  }
  return "{}";
}
