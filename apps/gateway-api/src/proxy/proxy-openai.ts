import type { MiddlewareHandler } from "hono";
import { prepareOpenaiPayload } from "../payload/payload-openai";
import { resolveProviderModel } from "../providers/resolve.js";
import {
  buildUpstreamBody,
  buildUpstreamHeaders,
  buildUpstreamUrl,
} from "../shared/upstream.js";
import type { ChildKeyAuthVariables } from "../child-keys/index.js";
import type {
  UpstreamProxyContext,
  UpstreamProxyVariables,
} from "./upstream-proxy.js";
import type { proxyDependencies } from "./dependencies";

async function handleOpenaiProxy(
  c: Parameters<
    MiddlewareHandler<{
      Variables: ChildKeyAuthVariables & UpstreamProxyVariables;
    }>
  >[0],
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
  const childKeyTags =
    childKeyRecord.tags !== undefined &&
    typeof childKeyRecord.tags === "object" &&
    !Array.isArray(childKeyRecord.tags)
      ? (childKeyRecord.tags as Record<string, unknown>)
      : {};
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

  const proxyContext: UpstreamProxyContext = {
    //  downstream context
    provider: parsed.providerName,
    requestedModel: parsed.model,
    requestedModelAlias: `${parsed.providerName}/${parsed.model}`,
    apiFamily: resolved.value.compatibilityType,
    metadataJson: JSON.stringify(metadata),

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
): MiddlewareHandler<{
  Variables: ChildKeyAuthVariables & UpstreamProxyVariables;
}> {
  return async (c, next) => {
    const result = await handleOpenaiProxy(c, deps);
    if (result) {
      return result;
    }
    await next();
  };
}
