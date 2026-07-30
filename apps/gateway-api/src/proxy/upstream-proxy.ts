import type { Context } from "hono";
import { proxy } from "hono/proxy";

import type { ChildKeyJwtPayload } from "../child-keys/types.js";

export type UpstreamProxyContext = {
  childKeyPayload: ChildKeyJwtPayload;
  providerName: string;
  upstreamModel: string;
  upstreamUrl: string;
  masterApiKey: string;
  upstreamHeaders: Headers;
  upstreamBody: string;
  metadata?: Record<string, unknown>;
};

export type UpstreamProxyVariables = {
  proxyContext: UpstreamProxyContext;
};

type ForwardUpstream = (input: string, init: RequestInit) => Promise<Response>;

export type UpstreamProxyDependencies = {
  forwardUpstream?: ForwardUpstream;
};

const defaultForwardUpstream: ForwardUpstream = (input, init) =>
  proxy(input, init);

export async function handleUpstreamProxy(
  c: Context,
  deps: UpstreamProxyDependencies,
): Promise<Response> {
  const ctx = (c as unknown as { get: (key: string) => unknown }).get(
    "proxyContext",
  ) as UpstreamProxyContext | undefined;

  if (!ctx) {
    return c.json(
      {
        error: {
          message: "Missing proxy context.",
          type: "server_error",
        },
      },
      500,
    );
  }

  try {
    return await (deps.forwardUpstream ?? defaultForwardUpstream)(
      ctx.upstreamUrl,
      {
        method: c.req.method,
        headers: ctx.upstreamHeaders,
        body: ctx.upstreamBody,
      },
    );
  } catch {
    return c.json(
      {
        error: {
          message: `Failed to reach provider "${ctx.providerName}".`,
          type: "server_error",
        },
      },
      502,
    );
  }
}

export function createUpstreamProxyHandler(
  deps: UpstreamProxyDependencies = {},
): (c: Context) => Promise<Response> {
  return (c) => handleUpstreamProxy(c, deps);
}
