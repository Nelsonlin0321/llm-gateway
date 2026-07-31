import { serve } from "@hono/node-server";
import { and, asc, eq } from "drizzle-orm";
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
import {
  requestIdMiddleware,
  type RequestIdVariables,
} from "./request-log/index";
import { db, llmProviders, models } from "./lib/db";

const app = new Hono<{
  Variables: ChildKeyAuthVariables &
    UpstreamProxyVariables &
    RequestIdVariables &
    Record<string, unknown>;
}>();

app.use("*", logger());
app.use("*", requestIdMiddleware);

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

async function loadActiveProvidersWithModels(
  compatibilityType: "openai" | "anthropic",
): Promise<ProviderWithModels[]> {
  const rows = await db
    .select({
      providerName: llmProviders.name,
      modelAlias: models.alias,
    })
    .from(llmProviders)
    .leftJoin(models, eq(models.providerId, llmProviders.id))
    .where(
      and(
        eq(llmProviders.compatibilityType, compatibilityType),
        eq(llmProviders.isActive, true),
      ),
    )
    .orderBy(asc(llmProviders.name), asc(models.alias));

  const byName = new Map<string, ProviderWithModels>();
  for (const row of rows) {
    let provider = byName.get(row.providerName);
    if (!provider) {
      provider = { name: row.providerName, models: [] };
      byName.set(row.providerName, provider);
    }
    if (row.modelAlias) {
      provider.models.push({ alias: row.modelAlias });
    }
  }
  return Array.from(byName.values());
}

app.get("/", async (c) => {
  const [openaiCompatible, anthropicCompatible] = await Promise.all([
    loadActiveProvidersWithModels("openai"),
    loadActiveProvidersWithModels("anthropic"),
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
