import test from "node:test";
import assert from "node:assert/strict";

import {
  builtInProviders,
  findBuiltInProvider,
  getBuiltInProvidersByFormat,
} from "@/lib/llm-provider/built-in";
import {
  builtInProviderIconHasColor,
  builtInProviderIconUsesLightFill,
  getBuiltInProviderIconId,
  getBuiltInProviderIconUrl,
} from "@/lib/llm-provider/icons";
import { providerNamePattern } from "@/lib/llm-provider/schema";

test("filters built-in providers by apiFormat", () => {
  const openaiProviders = getBuiltInProvidersByFormat("openai");
  const anthropicProviders = getBuiltInProvidersByFormat("anthropic");

  assert.ok(openaiProviders.length > 0);
  assert.ok(anthropicProviders.length > 0);
  assert.equal(
    openaiProviders.every((provider) => provider.apiFormat === "openai"),
    true,
  );
  assert.equal(
    anthropicProviders.every((provider) => provider.apiFormat === "anthropic"),
    true,
  );
  assert.equal(
    openaiProviders.length + anthropicProviders.length,
    builtInProviders.length,
  );
});

test("finds a built-in provider by name and compatibility type", () => {
  const deepseekOpenAi = findBuiltInProvider("DeepSeek", "openai");
  const deepseekAnthropic = findBuiltInProvider("deepseek", "anthropic");

  assert.equal(deepseekOpenAi?.apiUrl, "https://api.deepseek.com");
  assert.equal(
    deepseekAnthropic?.apiUrl,
    "https://api.deepseek.com/anthropic",
  );
  assert.equal(findBuiltInProvider("openai", "anthropic"), undefined);
});

test("built-in names and URLs match provider form constraints", () => {
  const namesByFormat = new Map<string, Set<string>>();

  for (const provider of builtInProviders) {
    assert.equal(providerNamePattern.test(provider.name), true);
    assert.match(provider.apiUrl, /^https:\/\//);
    assert.equal(provider.apiUrl.endsWith("/"), false);
    assert.ok(getBuiltInProviderIconId(provider.name));

    const seen = namesByFormat.get(provider.apiFormat) ?? new Set<string>();
    assert.equal(
      seen.has(provider.name),
      false,
      `duplicate ${provider.apiFormat} provider: ${provider.name}`,
    );
    seen.add(provider.name);
    namesByFormat.set(provider.apiFormat, seen);
  }
});

test("uses colorful Lobe Icons when a color asset exists", () => {
  assert.equal(builtInProviderIconHasColor("deepseek"), true);
  assert.match(
    getBuiltInProviderIconUrl("deepseek") ?? "",
    /deepseek-color\.svg$/,
  );
  assert.equal(builtInProviderIconHasColor("anthropic"), false);
  assert.match(
    getBuiltInProviderIconUrl("anthropic") ?? "",
    /anthropic\.svg$/,
  );
  assert.match(
    getBuiltInProviderIconUrl("deepseek", "mono") ?? "",
    /deepseek\.svg$/,
  );
});

test("inverts black mono marks so they stay visible on dark surfaces", () => {
  assert.equal(builtInProviderIconUsesLightFill("openai"), true);
  assert.equal(builtInProviderIconUsesLightFill("x-ai"), true);
  assert.equal(builtInProviderIconUsesLightFill("groq"), true);
  assert.equal(builtInProviderIconUsesLightFill("deepseek"), false);
  assert.equal(builtInProviderIconUsesLightFill("anthropic"), false);
});
