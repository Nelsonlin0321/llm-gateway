import { parseModel } from "./shared/upstream.js";
import type { JsonBody, PrepareResult } from "./types/payload.js";
import { openaiCompatibleProviders } from "./providers.js";
import { isRecord } from "./utils.js";

/**
 * When `stream` is true, force `stream_options` to `{ include_usage: true }`
 * so providers always emit a final usage chunk on streamed responses.
 *
 * Overwrites any client-supplied `stream_options`. Leaves the body unchanged
 * when streaming is not enabled.
 */
export function ensureStreamUsageOptions(body: JsonBody): JsonBody {
  if (body.stream !== true) {
    return body;
  }

  return {
    ...body,
    stream_options: { include_usage: true },
  };
}

/**
 * Validate the client JSON body and transform it for the upstream provider:
 * - require a non-empty string `model` in `provider/model` form
 * - resolve the provider from the model prefix
 * - strip the provider prefix from `model`
 * - force stream usage options when streaming
 */
export function prepareOpenaiPayload(body: unknown): PrepareResult {
  if (!isRecord(body) || typeof body.model !== "string" || !body.model) {
    return {
      ok: false,
      error: {
        status: 400,
        error: {
          message:
            'Request body must include a string "model" field in the form "provider/model" (e.g. "openai/gpt-4o-mini")',
          type: "invalid_request_error",
        },
      },
    };
  }

  const parsed = parseModel(body.model, "openai");
  if (!parsed) {
    const known = Object.keys(openaiCompatibleProviders).join(", ");
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

  const upstreamBody = ensureStreamUsageOptions({
    ...body,
    model: parsed.model,
  });

  return {
    ok: true,
    value: { parsed, upstreamBody },
  };
}
