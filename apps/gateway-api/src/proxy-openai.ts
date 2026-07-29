import type { Context } from "hono";
import { proxy } from "hono/proxy";
import { prepareOpenaiPayload } from "./payload-openai";
import {
  resolveProviderModel,
  type ResolveProviderModelResult,
} from "./providers/resolve.js";
import { buildUpstreamHeaders, buildUpstreamUrl } from "./shared/upstream.js";

type ForwardUpstream = (input: string, init: RequestInit) => Promise<Response>;

export type OpenaiProxyDependencies = {
  resolveProviderModel?: (
    providerId: string,
    modelAlias: string,
  ) => Promise<ResolveProviderModelResult>;
  forwardUpstream?: ForwardUpstream;
};

const defaultForwardUpstream: ForwardUpstream = (input, init) =>
  proxy(input, init);

async function handleOpenaiProxy(
  c: Context,
  deps: OpenaiProxyDependencies,
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
  const prepared = prepareOpenaiPayload(body, requestPath);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }
  const { parsed, upstreamBody } = prepared.value;
  const resolved = await (
    deps.resolveProviderModel ??
    ((providerId: string, modelAlias: string) =>
      resolveProviderModel(providerId, modelAlias, "openai"))
  )(parsed.providerId, parsed.model);
  if (process.env.GATEWAY_DEBUG_RESOLVE === "1") {
    console.log("resolveProviderModel", {
      ok: resolved.ok,
      status: resolved.ok ? undefined : resolved.status,
      providerId: parsed.providerId,
      modelAlias: parsed.model,
      baseUrl: resolved.ok ? resolved.value.baseUrl : undefined,
      upstreamModel: resolved.ok ? resolved.value.model : undefined,
    });
  }
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status);
  }
  console.log(JSON.stringify(resolved));
  const upstreamUrl = buildUpstreamUrl(resolved.value.baseUrl, requestPath);

  try {
    return await (deps.forwardUpstream ?? defaultForwardUpstream)(upstreamUrl, {
      method: c.req.method,
      headers: buildUpstreamHeaders(c.req.raw, resolved.value.apiKey),
      body: JSON.stringify({
        ...upstreamBody,
        model: resolved.value.model,
      }),
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

export function createOpenaiProxyHandler(
  deps: OpenaiProxyDependencies = {},
): (c: Context) => Promise<Response> {
  return (c) => handleOpenaiProxy(c, deps);
}
