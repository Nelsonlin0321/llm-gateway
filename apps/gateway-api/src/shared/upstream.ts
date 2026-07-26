import "dotenv/config";
import type { ParsedModel, ProviderConfig } from "../providers";

import {
  openaiCompatibleProviders,
  anthropicCompatibleProviders,
} from "../providers";

export function parseModel(
  model: string,
  compatibility: "openai" | "anthropic",
): ParsedModel | null {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    return null;
  }

  const providerId = model.slice(0, slash).toLowerCase();
  const bareModel = model.slice(slash + 1);

  const provider =
    compatibility === "openai"
      ? openaiCompatibleProviders[providerId]
      : anthropicCompatibleProviders[providerId];

  if (!provider) {
    return null;
  }

  return { providerId, model: bareModel, provider };
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

export function getProviderApiKey(provider: ProviderConfig): string | null {
  const key = process.env[provider.apiKeyEnv];
  if (!key || key.trim() === "") {
    return null;
  }
  return key;
}
