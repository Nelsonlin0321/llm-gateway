import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import {
  requireChildKeyAuth,
  type ChildKeyAuthVariables,
} from "./child-keys/index.js";
import {
  anthropicCompatibleProviders,
  openaiCompatibleProviders,
} from "./providers";
import { createOpenaiProxyHandler } from "./proxy-openai";
import { createAnthropicProxyHandler } from "./proxy-anthropic";

const app = new Hono<{ Variables: ChildKeyAuthVariables }>();

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    name: "llm-gateway",
    status: "ok",
    docs: "POST /openai/* or /anthropic/* with Authorization: Bearer sk_<child_api_key> and model set to provider/model",
    auth: "Bearer plain child API key required (sk_… from portal create/reveal; not the encrypted DB value)",
    "openai-compatible": Object.fromEntries(
      Object.entries(openaiCompatibleProviders).map(([id, p]) => [
        id,
        {
          baseUrl: p.baseUrl,
          exampleModel: `${id}/${p.exampleModel}`,
          apiKeyEnv: p.apiKeyEnv,
        },
      ]),
    ),
    "anthropic-compatible": Object.fromEntries(
      Object.entries(anthropicCompatibleProviders).map(([id, p]) => [
        id,
        {
          baseUrl: p.baseUrl,
          exampleModel: `${id}/${p.exampleModel}`,
          apiKeyEnv: p.apiKeyEnv,
        },
      ]),
    ),
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Proxy routes require a valid child API key.
app.use("/openai/*", requireChildKeyAuth);
app.use("/anthropic/*", requireChildKeyAuth);
app.post("/openai/*", createOpenaiProxyHandler());
app.post("/anthropic/*", createAnthropicProxyHandler());

const port = Number(process.env.PORT) || 8080;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`LLM proxy listening on http://localhost:${info.port}`);
  },
);

export default app;
