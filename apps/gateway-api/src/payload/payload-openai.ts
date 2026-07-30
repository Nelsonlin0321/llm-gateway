import { parseModel } from "../shared/upstream";
import type { JsonBody, PrepareResult } from "../types/payload";
import { isRecord } from "../utils";

/**
 * When `stream` is true on chat completions endpoints, force
 * `stream_options` to `{ include_usage: true }` so providers always emit a
 * final usage chunk on streamed responses.
 *
 * Overwrites any client-supplied `stream_options`. Leaves the body unchanged
 * when streaming is not enabled or the request is not targeting
 * `/chat/completions`.
 */
function isChatCompletionsPath(requestPath: string): boolean {
  const path = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  return /\/(?:v1\/)?chat\/completions\/?$/.test(path);
}

export function ensureStreamUsageOptions(
  body: JsonBody,
  requestPath: string,
): JsonBody {
  if (body.stream !== true || !isChatCompletionsPath(requestPath)) {
    return body;
  }

  return {
    ...body,
    stream_options: { include_usage: true },
  };
}

/**
 * Validate the client JSON body and prepare it for proxy resolution:
 * - require a non-empty string `model` in `provider/model` form
 * - parse the provider prefix and downstream model alias
 * - keep the original `model` value until the proxy resolves the upstream name
 * - force stream usage options for streamed chat completions requests
 */
export function prepareOpenaiPayload(
  body: unknown,
  requestPath: string,
): PrepareResult {
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
    return {
      ok: false,
      error: {
        status: 400,
        error: {
          message: `Invalid model "${body.model}". Use "provider/model" (for example "openai/gpt-5.4-mini").`,
          type: "invalid_request_error",
          param: "model",
        },
      },
    };
  }

  const upstreamBody = ensureStreamUsageOptions(
    {
      ...body,
    },
    requestPath,
  );

  return {
    ok: true,
    value: { parsed, upstreamBody },
  };
}
