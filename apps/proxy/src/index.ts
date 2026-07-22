import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { providers } from "./providers.js";
import { proxyToProvider } from "./proxy.js";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    name: "llm-proxy",
    status: "ok",
    docs: "POST /v1/chat/completions with model set to provider/model",
    providers: Object.fromEntries(
      Object.entries(providers).map(([id, p]) => [
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

// OpenAI-compatible surface: route by model prefix (provider/model).
app.post("/v1/chat/completions", proxyToProvider);
app.post("/v1/completions", proxyToProvider);
app.post("/v1/embeddings", proxyToProvider);
app.post("/v1/messages", proxyToProvider);

// Catch-all for other OpenAI-style POST endpoints under /v1.
app.post("/v1/*", proxyToProvider);

const port = Number(process.env.PORT) || 3000;

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
