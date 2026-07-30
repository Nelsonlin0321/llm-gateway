import { parseModel } from "../shared/upstream";
import type { JsonBody, PrepareResult } from "../types/payload";

function isRecord(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate the client JSON body and transform it for the upstream provider:
 * - require a non-empty string `model` in `provider/model` form
 * - parse the provider prefix from the model
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
    return {
      ok: false,
      error: {
        status: 400,
        error: {
          message: `Invalid model "${body.model}". Use "provider/model" (for example "anthropic/claude-opus-4.8").`,
          type: "invalid_request_error",
          param: "model",
        },
      },
    };
  }

  let metadata: Record<string, unknown> | undefined;
  if ("metadata" in body && body.metadata !== undefined) {
    if (!isRecord(body.metadata)) {
      return {
        ok: false,
        error: {
          status: 400,
          error: {
            message: 'Request body "metadata" must be an object when provided.',
            type: "invalid_request_error",
            param: "metadata",
          },
        },
      };
    }
    metadata = body.metadata;
  }

  const downstreamBody: JsonBody = {
    ...body,
    model: parsed.model,
  };

  delete downstreamBody.metadata;

  return {
    ok: true,
    value: {
      parsed,
      downstreamBody,
      metadata,
    },
  };
}
