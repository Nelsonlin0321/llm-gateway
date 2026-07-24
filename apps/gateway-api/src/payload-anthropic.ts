import { parseModel } from "./shared/upstream.js";
import type { JsonBody, PrepareResult } from "./types/payload.js";
import { anthropicCompatibleProviders } from "./providers.js";

function isRecord(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate the client JSON body and transform it for the upstream provider:
 * - require a non-empty string `model` in `provider/model` form
 * - resolve the provider from the model prefix
 * - strip the provider prefix from `model`
 * - force stream usage options when streaming
 */
export function prepareAnthropicPayload(body: unknown): PrepareResult {
  if (!isRecord(body) || typeof body.model !== "string" || !body.model) {
    return {
      ok: false,
      error: {
        status: 400,
        error: {
          message:
            'Request body must include a string "model" field in the form "provider/model" (e.g. "anthropic/claude-opus-4.8")',
          type: "invalid_request_error",
        },
      },
    };
  }

  const parsed = parseModel(body.model, "anthropic");
  if (!parsed) {
    const known = Object.keys(anthropicCompatibleProviders).join(", ");
    return {
      ok: false,
      error: {
        status: 400,
        error: {
          message: `Unknown or invalid model "${body.model}". Use "provider/model" where provider is one of: ${known}`,
          type: "invalid_request_error",
          param: "model",
        },
      },
    };
  }

  return {
    ok: true,
    value: {
      parsed,
      upstreamBody: {
        ...body,
        model: parsed.model,
      },
    },
  };
}
