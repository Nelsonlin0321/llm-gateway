import type { MiddlewareHandler } from "hono";
import { prepareAnthropicPayload } from "../payload/payload-anthropic";
import {
  resolveProvider,
  type ResolveProviderResult,
} from "../providers/resolve.js";
import { buildUpstreamHeaders, buildUpstreamUrl } from "../shared/upstream.js";
import type { ChildKeyAuthVariables } from "../child-keys/index.js";
import type {
  UpstreamProxyContext,
  UpstreamProxyVariables,
} from "./upstream-proxy.js";

export type AnthropicProxyDependencies = {
  resolveProvider?: (
    providerId: string,
    creatorId: string,
  ) => Promise<ResolveProviderResult>;
};

async function handleAnthropicProxy(
  c: Parameters<
    MiddlewareHandler<{
      Variables: ChildKeyAuthVariables & UpstreamProxyVariables;
    }>
  >[0],
  deps: AnthropicProxyDependencies,
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
  const requestPath = new URL(c.req.url).pathname;
  const prepared = prepareAnthropicPayload(body);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, upstreamBody } = prepared.value;
  const resolved = await (
    deps.resolveProvider ??
    ((providerId: string, creatorId: string) =>
      resolveProvider(providerId, "anthropic", creatorId))
  )(parsed.providerName, childKeyPayload.creator_id);
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status);
  }

  const upstreamUrl = buildUpstreamUrl(resolved.value.baseUrl, requestPath);

  const proxyContext: UpstreamProxyContext = {
    childKeyPayload,
    providerName: parsed.providerName,
    upstreamModel: parsed.model,
    upstreamUrl,
    masterApiKey: resolved.value.apiKey,
    upstreamHeaders: buildUpstreamHeaders(c.req.raw, resolved.value.apiKey),
    upstreamBody: JSON.stringify(upstreamBody),
  };

  c.set("proxyContext", proxyContext);
}

export function createAnthropicProxyHandler(
  deps: AnthropicProxyDependencies = {},
): MiddlewareHandler<{
  Variables: ChildKeyAuthVariables & UpstreamProxyVariables;
}> {
  return async (c, next) => {
    const result = await handleAnthropicProxy(c, deps);
    if (result) {
      return result;
    }
    await next();
  };
}
