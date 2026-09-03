import type { CompatibilityType } from "@/lib/llm-provider/schema";

export type BuiltInProvider = {
  name: string;
  apiUrl: string;
  apiFormat: CompatibilityType;
};

export const builtInProviders: BuiltInProvider[] = [
  // ========== OpenAI format ==========
  {
    name: "openai",
    apiUrl: "https://api.openai.com/v1",
    apiFormat: "openai",
  },
  {
    name: "azure",
    apiUrl: "https://<resources>.services.ai.azure.com/openai/v1",
    apiFormat: "openai",
  },
  {
    name: "deepseek",
    apiUrl: "https://api.deepseek.com",
    apiFormat: "openai",
  },
  {
    name: "x-ai",
    apiUrl: "https://api.x.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "mistral",
    apiUrl: "https://api.mistral.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "google",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiFormat: "openai",
  },
  {
    name: "groq",
    apiUrl: "https://api.groq.com/openai/v1",
    apiFormat: "openai",
  },
  {
    name: "cerebras",
    apiUrl: "https://api.cerebras.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "sambanova",
    apiUrl: "https://api.sambanova.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "fireworksai",
    apiUrl: "https://api.fireworks.ai/inference/v1",
    apiFormat: "openai",
  },
  {
    name: "togetherai",
    apiUrl: "https://api.together.xyz/v1",
    apiFormat: "openai",
  },
  {
    name: "nvidianim",
    apiUrl: "https://integrate.api.nvidia.com/v1",
    apiFormat: "openai",
  },
  {
    name: "deepinfra",
    apiUrl: "https://api.deepinfra.com/v1/openai",
    apiFormat: "openai",
  },
  {
    name: "novitaai",
    apiUrl: "https://api.novita.ai/v3/openai",
    apiFormat: "openai",
  },
  {
    name: "baseten",
    apiUrl: "https://inference.baseten.co/v1",
    apiFormat: "openai",
  },
  {
    name: "nebius",
    apiUrl: "https://api.studio.nebius.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "openrouter",
    apiUrl: "https://openrouter.ai/api/v1",
    apiFormat: "openai",
  },
  {
    name: "huggingface",
    apiUrl: "https://router.huggingface.co/v1",
    apiFormat: "openai",
  },
  {
    name: "vercel",
    apiUrl: "https://ai-gateway.vercel.sh/v1",
    apiFormat: "openai",
  },
  {
    name: "perplexity",
    apiUrl: "https://api.perplexity.ai",
    apiFormat: "openai",
  },
  {
    name: "github",
    apiUrl: "https://models.github.ai/inference",
    apiFormat: "openai",
  },
  {
    name: "alibaba-cn",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiFormat: "openai",
  },
  {
    name: "alibaba",
    apiUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiFormat: "openai",
  },
  {
    name: "moonshot",
    apiUrl: "https://api.moonshot.ai/v1",
    apiFormat: "openai",
  },
  {
    name: "moonshot-cn",
    apiUrl: "https://api.moonshot.cn/v1",
    apiFormat: "openai",
  },
  {
    name: "z-ai",
    apiUrl: "https://api.z.ai/api/paas/v4",
    apiFormat: "openai",
  },
  {
    name: "z-ai-cn",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiFormat: "openai",
  },
  {
    name: "minimax",
    apiUrl: "https://api.minimax.io/v1",
    apiFormat: "openai",
  },
  {
    name: "minimax-cn",
    apiUrl: "https://api.minimaxi.com/v1",
    apiFormat: "openai",
  },
  {
    name: "siliconflow",
    apiUrl: "https://api.siliconflow.cn/v1",
    apiFormat: "openai",
  },
  {
    name: "yiai",
    apiUrl: "https://api.lingyiwanwu.com/v1",
    apiFormat: "openai",
  },
  {
    name: "ollamacloud",
    apiUrl: "https://ollama.com/v1",
    apiFormat: "openai",
  },

  // ========== Anthropic format ==========
  {
    name: "anthropic",
    apiUrl: "https://api.anthropic.com/v1",
    apiFormat: "anthropic",
  },
  {
    name: "azure",
    apiUrl: "https://<resource>.services.ai.azure.com/anthropic",
    apiFormat: "anthropic",
  },
  {
    name: "deepseek",
    apiUrl: "https://api.deepseek.com/anthropic",
    apiFormat: "anthropic",
  },
  {
    name: "z-ai",
    apiUrl: "https://api.z.ai/api/anthropic",
    apiFormat: "anthropic",
  },
  {
    name: "minimax",
    apiUrl: "https://api.minimax.io/anthropic",
    apiFormat: "anthropic",
  },
  {
    name: "moonshot",
    apiUrl: "https://api.moonshot.ai/anthropic",
    apiFormat: "anthropic",
  },
  {
    name: "alibaba",
    apiUrl: "https://dashscope-intl.aliyuncs.com/apps/anthropic",
    apiFormat: "anthropic",
  },
];

export function getBuiltInProvidersByFormat(
  apiFormat: CompatibilityType,
): BuiltInProvider[] {
  return builtInProviders.filter(
    (provider) => provider.apiFormat === apiFormat,
  );
}

export function findBuiltInProvider(
  name: string,
  apiFormat: CompatibilityType,
): BuiltInProvider | undefined {
  const normalizedName = name.trim().toLowerCase();

  return builtInProviders.find(
    (provider) =>
      provider.apiFormat === apiFormat && provider.name === normalizedName,
  );
}
