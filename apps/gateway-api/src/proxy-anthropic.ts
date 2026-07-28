import type { Context } from "hono";
import { proxy } from "hono/proxy";
import { prepareAnthropicPayload } from "./payload-anthropic";
import {
  resolveProvider,
  type ResolveProviderResult,
} from "./providers/resolve.js";
import { buildUpstreamHeaders, buildUpstreamUrl } from "./shared/upstream.js";

type ForwardUpstream = (input: string, init: RequestInit) => Promise<Response>;

export type AnthropicProxyDependencies = {
  resolveProvider?: (providerId: string) => Promise<ResolveProviderResult>;
  forwardUpstream?: ForwardUpstream;
};

const defaultForwardUpstream: ForwardUpstream = (input, init) =>
  proxy(input, init);

async function handleAnthropicProxy(
  c: Context,
  deps: AnthropicProxyDependencies,
): Promise<Response> {
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

  const requestPath = new URL(c.req.url).pathname;
  const prepared = prepareAnthropicPayload(body);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, upstreamBody } = prepared.value;
  const resolved = await (
    deps.resolveProvider ??
    ((providerId: string) => resolveProvider(providerId, "anthropic"))
  )(parsed.providerId);
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status);
  }

  const upstreamUrl = buildUpstreamUrl(resolved.value.baseUrl, requestPath);

  try {
    return await (deps.forwardUpstream ?? defaultForwardUpstream)(upstreamUrl, {
      method: c.req.method,
      headers: buildUpstreamHeaders(c.req.raw, resolved.value.apiKey),
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    return c.json(
      {
        error: {
          message: `Failed to reach provider "${parsed.providerId}".`,
          type: "server_error",
        },
      },
      502,
    );
  }
}

export function createAnthropicProxyHandler(
  deps: AnthropicProxyDependencies = {},
): (c: Context) => Promise<Response> {
  return (c) => handleAnthropicProxy(c, deps);
}
