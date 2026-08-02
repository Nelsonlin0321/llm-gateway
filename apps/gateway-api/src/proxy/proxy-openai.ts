import type { Context, MiddlewareHandler } from "hono";
import { prepareOpenaiPayload } from "../payload/payload-openai";
import { resolveProviderModel } from "../providers/resolve.js";
import {
  buildUpstreamBody,
  buildUpstreamHeaders,
  buildUpstreamUrl,
} from "../shared/upstream.js";
import { isRecord } from "../utils.js";
import type { UpstreamProxyContext } from "./upstream-proxy.js";
import type { proxyDependencies } from "./dependencies";

async function handleOpenaiProxy(
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
  const prepared = prepareOpenaiPayload(body, requestPath);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, downstreamBody, metadata } = prepared.value;
  const resolved = await (
    deps.resolveProviderModel ??
    ((providerName: string, modelAlias: string, creatorId: string) =>
      resolveProviderModel(providerName, modelAlias, "openai", creatorId))
  )(parsed.providerName, parsed.model, childKeyRecord.creatorId);
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
    provider: parsed.providerName,
    requestedModel: parsed.model,
    requestedModelAlias: `${parsed.providerName}/${parsed.model}`,
    apiFamily: resolved.value.compatibilityType,
    metadataJson: JSON.stringify(metadata ?? {}),

    // upstream context
    upstreamModel: resolved.value.model,
    upstreamUrl: upstreamUrl,
    masterApiKey: resolved.value.apiKey,
    upstreamHeaders: buildUpstreamHeaders(c.req.raw, resolved.value.apiKey),
    upstreamBody: upstreamBody,

    // child key context
    childKeyRecord,
  };

  c.set("proxyContext", proxyContext);
}

export function createOpenaiProxyHandler(
  deps: proxyDependencies = {},
): MiddlewareHandler {
  return async (c, next) => {
    const started = performance.now();
    const failureResponse = await handleOpenaiProxy(c, deps);
    const elapsedMs = performance.now() - started;
    console.log(`Parse OpenAI request took ${elapsedMs.toFixed(2)} ms`);
    if (failureResponse) {
      return failureResponse;
    }
    await next();
  };
}
