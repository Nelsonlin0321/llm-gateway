const UNPKG_SVG_CDN =
  "https://unpkg.com/@lobehub/icons-static-svg@latest/icons";

/**
 * Maps a built-in provider slug to a Lobe Icons asset id.
 * Regional suffixes (`-cn`) share the parent brand mark.
 */
const providerIconIds: Record<string, string> = {
  openai: "openai",
  deepseek: "deepseek",
  "x-ai": "xai",
  mistral: "mistral",
  google: "google",
  groq: "groq",
  cerebras: "cerebras",
  sambanova: "sambanova",
  fireworksai: "fireworks",
  togetherai: "together",
  nvidianim: "nvidia",
  deepinfra: "deepinfra",
  novitaai: "novita",
  baseten: "baseten",
  nebius: "nebius",
  openrouter: "openrouter",
  huggingface: "huggingface",
  vercel: "vercel",
  perplexity: "perplexity",
  github: "github",
  "alibaba-cn": "alibaba",
  alibaba: "alibaba",
  moonshot: "moonshot",
  "moonshot-cn": "moonshot",
  "z-ai": "zhipu",
  "z-ai-cn": "zhipu",
  minimax: "minimax",
  siliconflow: "siliconcloud",
  yiai: "zeroone",
  ollamacloud: "ollama",
  anthropic: "anthropic",
};

/** Lobe Icons that ship a dedicated color SVG (`{id}-color.svg`). */
const colorIconIds = new Set([
  "alibaba",
  "cerebras",
  "deepinfra",
  "deepseek",
  "fireworks",
  "google",
  "huggingface",
  "minimax",
  "mistral",
  "novita",
  "nvidia",
  "openrouter",
  "perplexity",
  "sambanova",
  "siliconcloud",
  "together",
  "zeroone",
  "zhipu",
]);

export function getBuiltInProviderIconId(name: string): string | undefined {
  return providerIconIds[name.trim().toLowerCase()];
}

export function builtInProviderIconHasColor(name: string): boolean {
  const iconId = getBuiltInProviderIconId(name);
  return iconId !== undefined && colorIconIds.has(iconId);
}

export function getBuiltInProviderIconUrl(
  name: string,
  variant: "color" | "mono" = "color",
): string | undefined {
  const iconId = getBuiltInProviderIconId(name);

  if (!iconId) {
    return undefined;
  }

  const useColor = variant === "color" && colorIconIds.has(iconId);
  return `${UNPKG_SVG_CDN}/${iconId}${useColor ? "-color" : ""}.svg`;
}
