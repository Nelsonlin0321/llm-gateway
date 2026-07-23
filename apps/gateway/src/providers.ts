import "dotenv/config";

export type ProviderConfig = {
  /** Upstream OpenAI-compatible base URL (may or may not include /v1). */
  baseUrl: string;
  /** Environment variable that holds the provider API key. */
  apiKeyEnv: string;
  /** Example model id (without provider prefix), for docs/health. */
  exampleModel: string;
};

/**
 * Provider registry. Clients address models as `{provider}/{model}`, e.g.
 * `minimax/MiniMax-M3` or `openai/gpt-4o-mini`.
 */

export const providers: Record<string, ProviderConfig> = {
  minimax: {
    baseUrl: "https://api.minimaxi.com",
    apiKeyEnv: "MINIMAX_API_KEY",
    exampleModel: "MiniMax-M3",
  },
  openai: {
    baseUrl: "https://api.openai.com",
    apiKeyEnv: "OPENAI_API_KEY",
    exampleModel: "gpt-4o-mini",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    exampleModel: "deepseek-v4-pro",
  },
};

export type ParsedModel = {
  providerId: string;
  model: string;
  provider: ProviderConfig;
};

/**
 * Parse `provider/model` style names. Returns null if the format is invalid
 * or the provider is unknown.
 */
export function parseModel(model: string): ParsedModel | null {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    return null;
  }

  const providerId = model.slice(0, slash).toLowerCase();
  const bareModel = model.slice(slash + 1);
  const provider = providers[providerId];

  if (!provider) {
    return null;
  }

  return { providerId, model: bareModel, provider };
}

export function buildTargetUrl(baseUrl: string, requestPath: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const path = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  const normalizedPath =
    path.replace(/^\/(?:openai|anthropic)(?=\/|$)/, "") || "/";

  if (base.endsWith("/v1") && normalizedPath.startsWith("/v1")) {
    return `${base}${normalizedPath.slice(3)}`;
  }

  return `${base}${normalizedPath}`;
}

export function getProviderApiKey(provider: ProviderConfig): string | null {
  const key = process.env[provider.apiKeyEnv];
  if (!key || key.trim() === "") {
    return null;
  }
  return key;
}
