import type { JsonBody, ParsedModel } from "../types/payload";

export function parseModel(
  model: string,
  _compatibility: "openai" | "anthropic",
): ParsedModel | null {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    return null;
  }

  const providerName = model.slice(0, slash).toLowerCase();
  const bareModel = model.slice(slash + 1);

  return { providerName, model: bareModel };
}

export function buildUpstreamUrl(baseUrl: string, requestPath: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  const normalizedPath =
    path.replace(/^\/(?:openai|anthropic)(?=\/|$)/, "") || "/";

  if (base.endsWith("/v1") && normalizedPath.startsWith("/v1")) {
    return `${base}${normalizedPath.slice(3)}`;
  }

  return `${base}${normalizedPath}`;
}

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

export function buildUpstreamHeaders(req: Request, apiKey: string): Headers {
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

export function buildUpstreamBody(
  body: JsonBody,
  upstreamModel: string,
): string {
  return JSON.stringify({ ...body, model: upstreamModel });
}
