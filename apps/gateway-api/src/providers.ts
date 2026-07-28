export type ProviderConfig = {
  /** Upstream OpenAI-compatible base URL (may or may not include /v1). */
  baseUrl: string;
  /** Environment variable that holds the provider API key. */
  apiKeyEnv: string;
  /** Example model id (without provider prefix), for docs/health. */
  exampleModel: string;
};

export type ParsedModel = {
  providerId: string;
  model: string;
};

export const openaiCompatibleProviders: Record<string, ProviderConfig> = {
  minimax: {
    baseUrl: "https://api.minimaxi.com/v1",
    apiKeyEnv: "MINIMAX_API_KEY",
    exampleModel: "MiniMax-M3",
  },
  openai: {
    baseUrl: "https://llm-gateway-resource-01.openai.azure.com/openai/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    exampleModel: "gpt-5.4-mini",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    exampleModel: "deepseek-v4-flash",
  },
  azure: {
    baseUrl: "https://llm-gateway-resource-01.openai.azure.com/openai/v1",
    apiKeyEnv: "AZURE_API_KEY",
    exampleModel: "gpt-5.4-mini",
  },
};

export const anthropicCompatibleProviders: Record<string, ProviderConfig> = {
  minimax: {
    baseUrl: "https://api.minimaxi.com/anthropic",
    apiKeyEnv: "MINIMAX_API_KEY",
    exampleModel: "MiniMax-M3",
  },
};

export const providers = {
  ...openaiCompatibleProviders,
  ...anthropicCompatibleProviders,
};
