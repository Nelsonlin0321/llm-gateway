import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { proxyToOpenai } from "./proxy.js";
import { providers } from "./providers.js";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    name: "llm-gateway",
    status: "ok",
    docs: "POST /openai/* or /anthropic/* with model set to provider/model",
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
app.post("/openai/*", proxyToOpenai);
// app.post("/anthropic/*", proxyToProvider);

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
