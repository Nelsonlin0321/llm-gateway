import type { Context, MiddlewareHandler } from "hono";
import { parseOpenaiPayload } from "../payload/payload-openai";
import { resolveProviderModel } from "../providers/resolve";
import { buildUpstreamBody, buildUpstreamUrl } from "../shared/upstream.js";
import { isRecord } from "../utils.js";
import type { UpstreamProxyContext } from "./upstream-proxy";
import type { proxyDependencies } from "./dependencies";

async function injectContext(
  c: Context<any, string, {}>,
  deps: proxyDependencies,
): Promise<Response | void> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: {
          message: "Invalid JSON body",
          type: "invalid_request_error",
        },
      },
      400,
    );
  }

  const childKeyRecord = c.get("childKeyRecord");
  const requestPath = new URL(c.req.url).pathname;
  const prepared = parseOpenaiPayload(body, requestPath);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, downstreamBody, metadata } = prepared.value;
  const resolved = await (
    deps.resolveProviderModel ??
    ((providerName: string, modelAlias: string, organizationId: string) =>
      resolveProviderModel(providerName, modelAlias, "openai", organizationId))
  )(parsed.providerName, parsed.model, childKeyRecord.organizationId);
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const upstreamUrl = buildUpstreamUrl(resolved.value.baseUrl, requestPath);
  const upstreamBody = buildUpstreamBody(downstreamBody, resolved.value.model);
  const isStream = isRecord(body) && body.stream === true;

  const proxyContext: UpstreamProxyContext = {
    // request-log envelope
    gatewayPath: requestPath,
    httpMethod: c.req.method,
    isStream,
    requestPayloadJson: JSON.stringify(body),

    // downstream context
    providerId: resolved.value.providerId,
    provider: parsed.providerName,
    requestedModel: parsed.model,
    requestedModelAlias: `${parsed.providerName}/${parsed.model}`,
    apiFamily: resolved.value.compatibilityType,
    metadataJson: JSON.stringify(metadata ?? {}),

    // model pricing (USD per 1M tokens)
    inputPrice: resolved.value.inputPrice,
    outputPrice: resolved.value.outputPrice,
    inputCachePrice: resolved.value.inputCachePrice,

    // upstream context
    upstreamModel: resolved.value.model,
    upstreamUrl: upstreamUrl,
    masterApiKey: resolved.value.apiKey,
    upstreamBody: upstreamBody,

    // child key context
    childKeyRecord,
  };

  c.set("proxyContext", proxyContext);
}

export function injectOpenAIProxyContext(
  deps: proxyDependencies = {},
): MiddlewareHandler {
  return async (c, next) => {
    const started = performance.now();
    const failureResponse = await injectContext(c, deps);
    const elapsedMs = performance.now() - started;
    console.log(`Parse OpenAI request took ${elapsedMs.toFixed(2)} ms`);
    if (failureResponse) {
      return failureResponse;
    }
    await next();
  };
}
