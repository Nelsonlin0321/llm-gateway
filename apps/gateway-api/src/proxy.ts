import type { Context } from "hono";
import { prepareUpstreamPayload } from "./payload.js";
import { buildTargetUrl, getProviderApiKey } from "./providers.js";

/** Request headers that should not be forwarded to the target provider. */
const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "authorization",
]);

/** Response headers that must be recalculated by the local server. */
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "content-encoding",
]);

function buildTargetHeaders(req: Request, apiKey: string): Headers {
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    headers.set(key, value);
  }
  headers.set("authorization", `Bearer ${apiKey}`);
  headers.set("content-type", "application/json");
  return headers;
}

function buildDownstreamHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    headers.set(key, value);
  }
  return headers;
}

export async function proxyToProvider(c: Context): Promise<Response> {
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

  const prepared = prepareUpstreamPayload(body);
  if (!prepared.ok) {
    return c.json({ error: prepared.error.error }, prepared.error.status);
  }

  const { parsed, upstreamBody } = prepared.value;
  const apiKey = getProviderApiKey(parsed.provider);
  if (!apiKey) {
    return c.json(
      {
        error: {
          message: `Provider "${parsed.providerId}" is not configured. Set ${parsed.provider.apiKeyEnv}.`,
          type: "server_error",
        },
      },
      500,
    );
  }

  const requestPath = new URL(c.req.url).pathname;
  const upstreamUrl = buildTargetUrl(parsed.provider.baseUrl, requestPath);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: c.req.method,
      headers: buildTargetHeaders(c.req.raw, apiKey),
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upstream fetch failed";
    return c.json(
      {
        error: {
          message: `Failed to reach provider "${parsed.providerId}": ${message}`,
          type: "server_error",
        },
      },
      502,
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildDownstreamHeaders(upstream),
  });
}
