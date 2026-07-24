import type { Context } from "hono";
import { proxy } from "hono/proxy";
import { prepareAnthropicPayload } from "./payload-anthropic.js";
import {
  buildUpstreamHeaders,
  buildUpstreamUrl,
  getProviderApiKey,
} from "./shared/upstream.js";

export async function proxyToAnthropic(c: Context): Promise<Response> {
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

  const upstreamUrl = buildUpstreamUrl(parsed.provider.baseUrl, requestPath);

  try {
    return await proxy(upstreamUrl, {
      method: c.req.method,
      headers: buildUpstreamHeaders(c.req.raw, apiKey),
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
}
