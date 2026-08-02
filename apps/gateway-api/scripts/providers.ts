export type ProviderConfig = {
  baseUrl: string;
  exampleModel: string;
};

export type ParsedModel = {
  providerId: string;
  model: string;
};

export const openaiCompatibleProviders: Record<string, ProviderConfig> = {
  minimax: {
    baseUrl: "https://api.minimaxi.com/v1",
    exampleModel: "minimax-m3",
  },
  openai: {
    baseUrl: "https://llm-gateway-resource-01.openai.azure.com/openai/v1",
    exampleModel: "gpt-5.4-mini",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    exampleModel: "deepseek-v4-flash",
  },
  azure: {
    baseUrl: "https://llm-gateway-resource-01.openai.azure.com/openai/v1",
    exampleModel: "gpt-5.4-mini",
  },
  openrouter: {
    baseUrl: "https://api.deepinfra.ai",
    exampleModel: "glm-5.2",
  },
};

export const anthropicCompatibleProviders: Record<string, ProviderConfig> = {
  minimax: {
    baseUrl: "https://api.minimaxi.com/anthropic",
    exampleModel: "minimax-m3",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/anthropic",
    exampleModel: "deepseek-v4-flash",
  },
};
