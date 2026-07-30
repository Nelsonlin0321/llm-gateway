import type { MiddlewareHandler } from "hono";
import { prepareOpenaiPayload } from "../payload/payload-openai";
import {
  resolveProviderModel,
  type ResolveProviderModelResult,
} from "../providers/resolve.js";
import { buildUpstreamHeaders, buildUpstreamUrl } from "../shared/upstream.js";
import type { ChildKeyAuthVariables } from "../child-keys/index.js";
import type {
  UpstreamProxyContext,
  UpstreamProxyVariables,
} from "./upstream-proxy.js";

export type OpenaiProxyDependencies = {
  resolveProviderModel?: (
    providerId: string,
    modelAlias: string,
    creatorId: string,
  ) => Promise<ResolveProviderModelResult>;
};

async function handleOpenaiProxy(
  c: Parameters<
    MiddlewareHandler<{
      Variables: ChildKeyAuthVariables & UpstreamProxyVariables;
    }>
  >[0],
  deps: OpenaiProxyDependencies,
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

  const childKeyPayload = c.get("childKeyPayload");
  const rawTags = c.get("childKeyTags");
  const childKeyTags =
    rawTags && typeof rawTags === "object" && !Array.isArray(rawTags)
      ? (rawTags as Record<string, unknown>)
      : {};
  const requestPath = new URL(c.req.url).pathname;
  const prepared = prepareOpenaiPayload(body, requestPath);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, upstreamBody, metadata } = prepared.value;
  const resolved = await (
    deps.resolveProviderModel ??
    ((providerName: string, modelAlias: string, creatorId: string) =>
      resolveProviderModel(providerName, modelAlias, "openai", creatorId))
  )(parsed.providerName, parsed.model, childKeyPayload.creator_id);
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  const upstreamUrl = buildUpstreamUrl(resolved.value.baseUrl, requestPath);

  const proxyContext: UpstreamProxyContext = {
    childKeyPayload,
    childKeyTags,
    providerName: parsed.providerName,
    upstreamModel: resolved.value.model,
    upstreamUrl,
    masterApiKey: resolved.value.apiKey,
    upstreamHeaders: buildUpstreamHeaders(c.req.raw, resolved.value.apiKey),
    upstreamBody: JSON.stringify({
      ...upstreamBody,
      model: resolved.value.model,
    }),
    metadata,
  };

  c.set("proxyContext", proxyContext);
}

export function createOpenaiProxyHandler(
  deps: OpenaiProxyDependencies = {},
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
