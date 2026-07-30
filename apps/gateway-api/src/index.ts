import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import {
  requireChildKeyAuth,
  type ChildKeyAuthVariables,
} from "./child-keys/index";
import { createOpenaiProxyHandler } from "./proxy/proxy-openai";
import { createAnthropicProxyHandler } from "./proxy/proxy-anthropic";
import {
  createUpstreamProxyHandler,
  type UpstreamProxyVariables,
} from "./proxy/upstream-proxy";
import prisma from "./lib/prisma";

const app = new Hono<{
  Variables: ChildKeyAuthVariables &
    UpstreamProxyVariables &
    Record<string, unknown>;
}>();

app.use("*", logger());

type ProviderWithModels = {
  name: string;
  models: Array<{ alias: string }>;
};

function buildAvailableModelRoutes(providers: ProviderWithModels[]) {
  return Array.from(
    new Set(
      providers.flatMap((provider) =>
        provider.models
          .map((model) => {
            const alias = model.alias.trim().replace(/^\/+/, "");

            if (alias === "") {
              return null;
            }

            return alias.startsWith(`${provider.name}/`)
              ? alias
              : `${provider.name}/${alias}`;
          })
          .filter((model): model is string => model !== null),
      ),
    ),
  );
}

app.get("/", async (c) => {
  const [openaiCompatible, anthropicCompatible] = await Promise.all([
    prisma.lLMProvider.findMany({
      where: {
        compatibilityType: "openai",
        isActive: true,
      },
      select: {
        name: true,
        models: {
          select: {
            alias: true,
          },
          orderBy: {
            alias: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.lLMProvider.findMany({
      where: {
        compatibilityType: "anthropic",
        isActive: true,
      },
      select: {
        name: true,
        models: {
          select: {
            alias: true,
          },
          orderBy: {
            alias: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return c.json({
    name: "llm-gateway",
    status: "ok",
    docs: "POST /openai/* or /anthropic/* with Authorization: Bearer sk_<child_api_key> and model set to provider/model",
    auth: "Bearer plain child API key required (sk_… from portal create/reveal; not the encrypted DB value)",
    "openai-compatible": buildAvailableModelRoutes(openaiCompatible),
    "anthropic-compatible": buildAvailableModelRoutes(anthropicCompatible),
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Proxy routes require a valid child API key.
app.use("/openai/*", requireChildKeyAuth);
app.use("/anthropic/*", requireChildKeyAuth);

app.post("/openai/*", createOpenaiProxyHandler(), createUpstreamProxyHandler());
app.post(
  "/anthropic/*",
  createAnthropicProxyHandler(),
  createUpstreamProxyHandler(),
);

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
