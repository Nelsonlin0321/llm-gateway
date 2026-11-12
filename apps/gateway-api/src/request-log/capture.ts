import type { WorkerBindings } from "../env.js";
import type { CaptureLevel } from "./schema.js";

const DEFAULT_CAPTURE_LEVEL: CaptureLevel = "metadata";
const REDACTED_PAYLOAD_MAX_CHARS = 2_048;

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "api-key",
  "set-cookie",
  "cookie",
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
 * Capture level for the four request-log body fields.
 * Env: `REQUEST_LOG_CAPTURE_LEVEL` = `metadata` | `redacted` | `full`.
 * Unset or invalid values store full bodies.
 */
export function getCaptureLevel(
  env: WorkerBindings = process.env,
): CaptureLevel {
  return parseCaptureLevel(env.REQUEST_LOG_CAPTURE_LEVEL);
}

/**
 * Apply capture-level policy to one body field.
 * - `metadata`: omit
 * - `redacted`: keep, truncate at 2048 characters
 * - `full`: store as-is
 */
export function applyPayloadCapture(
  payload: string | undefined,
  level: CaptureLevel,
  maxChars: number = REDACTED_PAYLOAD_MAX_CHARS,
): string | undefined {
  if (level === "metadata" || payload === undefined) {
    return undefined;
  }

  if (level === "full") {
    return payload;
  }

  if (payload.length <= maxChars) {
    return payload;
  }

  return `${payload.slice(0, maxChars)}…[truncated]`;
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

export function stringifyChildKeyTags(tags: unknown): string {
  if (tags !== null && typeof tags === "object" && !Array.isArray(tags)) {
    return JSON.stringify(tags);
  }
  return "{}";
}
