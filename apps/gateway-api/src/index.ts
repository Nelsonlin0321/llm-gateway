import { and, asc, eq, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import {
  createChildKeyRateLimitMiddleware,
  requireInjectChildKeyAuth,
  type ChildKeyAuthVariables,
} from "./child-keys";
import { applyWorkerBindings, mergeWorkerEnv, type WorkerBindings } from "./env";
import { injectOpenAIProxyContext } from "./proxy/proxy-openai";
import { injectAnthropicProxyContext } from "./proxy/proxy-anthropic";
import {
  createUpstreamProxyHandler,
  type UpstreamProxyVariables,
} from "./proxy/upstream-proxy";
import {
  requestIdMiddleware,
  type RequestIdVariables,
} from "./request-log/index";
import { loadGatewayConfig, type GatewayConfig } from "./lib/config";
import { db, llmProviders, models } from "./lib/db";
import { getRedisClient, resolveRedisRest } from "./lib/redis-client";

type AppVariables = RequestIdVariables &
  ChildKeyAuthVariables &
  UpstreamProxyVariables & {
    gatewayConfig: GatewayConfig;
  } & Record<string, unknown>;

const app = new Hono<{
  Bindings: WorkerBindings;
  Variables: AppVariables;
}>();

app.use("*", async (c, next) => {
  const env = mergeWorkerEnv(c.env);
  applyWorkerBindings(env);
  c.set("gatewayConfig", loadGatewayConfig(env));
  await next();
});

app.use("*", logger());
app.use("*", requestIdMiddleware);
app.use("*", secureHeaders());

app.use("*", async (c, next) => {
  const origins = c.get("gatewayConfig").corsOrigins;
  if (origins.length === 0) {
    return next();
  }
  return cors({
    origin: origins,
    allowHeaders: ["Authorization", "Content-Type", "x-api-key", "x-request-id"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86400,
  })(c, next);
});

type ProviderWithModels = {
  name: string;
  models: Array<{ alias: string; name: string }>;
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
  organizationId: string,
): Promise<ProviderWithModels[]> {
  const rows = await db
    .select({
      providerName: llmProviders.name,
      modelAlias: models.alias,
      modelName: models.name,
    })
    .from(llmProviders)
    .leftJoin(models, eq(models.providerId, llmProviders.id))
    .where(
      and(
        eq(llmProviders.compatibilityType, compatibilityType),
        eq(llmProviders.isActive, true),
        eq(llmProviders.organizationId, organizationId),
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
      provider.models.push({
        alias: row.modelAlias,
        name: row.modelName ?? row.modelAlias,
      });
    }
  }
  return Array.from(byName.values());
}

app.get("/", (c) => {
  return c.json({
    name: "llm-gateway",
    status: "ok",
    docs: "POST /openai/* or /anthropic/* with Authorization: Bearer sk_<child_api_key> and model set to provider/alias",
    health: "/health",
    ready: "/ready",
    models: "GET /openai/v1/models or /anthropic/v1/models with a child API key",
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/ready", async (c) => {
  const redisConfigured = Boolean(resolveRedisRest());
  const checks: { postgres: "ok" | "error"; redis: "ok" | "skipped" | "error" } =
    {
      postgres: "error",
      redis: redisConfigured ? "error" : "skipped",
    };

  try {
    await db.execute(sql`select 1`);
    checks.postgres = "ok";
  } catch (error) {
    console.error("[ready] postgres check failed", error);
  }

  if (redisConfigured) {
    const redis = getRedisClient();
    try {
      if (!redis) {
        throw new Error("redis client missing");
      }
      await redis.ping();
      checks.redis = "ok";
    } catch (error) {
      console.error("[ready] redis check failed", error);
    }
  }

  const ready =
    checks.postgres === "ok" &&
    (checks.redis === "ok" || checks.redis === "skipped");

  return c.json({ status: ready ? "ok" : "error", checks }, ready ? 200 : 503);
});

app.use("/openai/*", async (c, next) => {
  return bodyLimit({ maxSize: c.get("gatewayConfig").requestBodyLimitBytes })(
    c,
    next,
  );
});
app.use("/openai/*", requireInjectChildKeyAuth);
app.use("/openai/*", async (c, next) => {
  return createChildKeyRateLimitMiddleware(
    c.get("gatewayConfig").defaultRateLimitRpm,
  )(c, next);
});

app.use("/anthropic/*", async (c, next) => {
  return bodyLimit({ maxSize: c.get("gatewayConfig").requestBodyLimitBytes })(
    c,
    next,
  );
});
app.use("/anthropic/*", requireInjectChildKeyAuth);
app.use("/anthropic/*", async (c, next) => {
  return createChildKeyRateLimitMiddleware(
    c.get("gatewayConfig").defaultRateLimitRpm,
  )(c, next);
});

async function listOrganizationModels(
  c: Context,
  compatibilityType: "openai" | "anthropic",
) {
  const childKeyRecord = c.get("childKeyRecord");
  const providers = await loadActiveProvidersWithModels(
    compatibilityType,
    childKeyRecord.organizationId,
  );
  const ids = buildAvailableModelRoutes(providers);

  return c.json({
    object: "list",
    data: ids.map((id) => ({
      id,
      object: "model",
      owned_by: id.split("/")[0] ?? compatibilityType,
    })),
  });
}

app.get("/openai/v1/models", (c) => listOrganizationModels(c, "openai"));
app.get("/openai/models", (c) => listOrganizationModels(c, "openai"));
app.get("/anthropic/v1/models", (c) => listOrganizationModels(c, "anthropic"));
app.get("/anthropic/models", (c) => listOrganizationModels(c, "anthropic"));

app.post("/openai/*", injectOpenAIProxyContext(), createUpstreamProxyHandler());
app.post(
  "/anthropic/*",
  injectAnthropicProxyContext(),
  createUpstreamProxyHandler(),
);

export default {
  port: Number(process.env.PORT) || 8080,
  fetch: app.fetch,
  idleTimeout: 255,
};

export { app };
