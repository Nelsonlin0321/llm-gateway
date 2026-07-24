import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { proxyToOpenai } from "./proxy-openai.js";
import {
  anthropicCompatibleProviders,
  openaiCompatibleProviders,
} from "./providers.js";
import { proxyToAnthropic } from "./proxy-anthropic.js";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    name: "llm-gateway",
    status: "ok",
    docs: "POST /openai/* or /anthropic/* with model set to provider/model",
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
app.post("/openai/*", proxyToOpenai);
app.post("/anthropic/*", proxyToAnthropic);

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
