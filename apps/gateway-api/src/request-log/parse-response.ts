import { isRecord } from "../utils.js";
import type { ResponseMode } from "./schema.js";

/**
 * Prefer content-type; fall back to client stream intent when ambiguous.
 * JSON error bodies on stream requests stay `json` when content-type says so.
 */
export function resolveResponseMode(
  isStream: boolean,
  contentType: string | null | undefined,
): ResponseMode {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("text/event-stream")) {
    return "sse";
  }
  if (ct.includes("application/json")) {
    return "json";
  }
  return isStream ? "sse" : "json";
}

export type ParsedErrorFields = {
  errorType?: string;
  errorMessage?: string;
};

/**
 * Extract provider/gateway error type + message from a JSON response body.
 * Supports OpenAI-style `{ error: { type, message } }` and Anthropic-style
 * `{ type: "error", error: { type, message } }`.
 */
export function parseErrorFieldsFromJsonText(
  text: string,
  statusCode: number,
): ParsedErrorFields {
  if (statusCode < 400 || !text) {
    return {};
  }

  try {
    const body = JSON.parse(text) as unknown;
    if (!isRecord(body)) {
      return {};
    }

    if (isRecord(body.error)) {
      const errorType =
        typeof body.error.type === "string"
          ? body.error.type
          : typeof body.type === "string" && body.type !== "error"
            ? body.type
            : undefined;
      const errorMessage =
        typeof body.error.message === "string"
          ? body.error.message
          : undefined;
      return {
        errorType: errorType ?? (statusCode >= 500 ? "server_error" : undefined),
        errorMessage,
      };
    }

    if (typeof body.type === "string" && typeof body.message === "string") {
      return { errorType: body.type, errorMessage: body.message };
    }
  } catch {
    // Non-JSON error bodies are left unparsed.
  }

  if (statusCode >= 500) {
    return { errorType: "server_error" };
  }
  return {};
}

/**
 * Pull `id` from common OpenAI/Anthropic JSON response shapes.
 */
export function parseResponseIdFromJsonText(text: string): string | undefined {
  if (!text) {
    return undefined;
  }
  try {
    const body = JSON.parse(text) as unknown;
    if (!isRecord(body)) {
      return undefined;
    }
    if (typeof body.id === "string" && body.id.length > 0) {
      return body.id;
    }
    if (isRecord(body.message) && typeof body.message.id === "string") {
      return body.message.id;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Scan an SSE transcript for the first response/message id.
 * Handles OpenAI chat.completion.chunk `id` and Anthropic `message_start`.
 */
export function parseResponseIdFromSseText(text: string): string | undefined {
  if (!text) {
    return undefined;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    try {
      const data = JSON.parse(payload) as unknown;
      if (!isRecord(data)) {
        continue;
      }
      if (typeof data.id === "string" && data.id.length > 0) {
        return data.id;
      }
      if (
        isRecord(data.message) &&
        typeof data.message.id === "string" &&
        data.message.id.length > 0
      ) {
        return data.message.id;
      }
    } catch {
      // keep scanning
    }
  }
  return undefined;
}

export function parseErrorFieldsFromSseText(
  text: string,
  statusCode: number,
): ParsedErrorFields {
  if (statusCode < 400) {
    // Some providers still emit error events on HTTP 200; scan for them.
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }
      try {
        const data = JSON.parse(payload) as unknown;
        if (!isRecord(data)) {
          continue;
        }
        if (data.type === "error" && isRecord(data.error)) {
          return {
            errorType:
              typeof data.error.type === "string"
                ? data.error.type
                : "server_error",
            errorMessage:
              typeof data.error.message === "string"
                ? data.error.message
                : undefined,
          };
        }
        if (isRecord(data.error)) {
          return {
            errorType:
              typeof data.error.type === "string"
                ? data.error.type
                : undefined,
            errorMessage:
              typeof data.error.message === "string"
                ? data.error.message
                : undefined,
          };
        }
      } catch {
        // continue
      }
    }
    return {};
  }
  return parseErrorFieldsFromJsonText(text, statusCode);
}
