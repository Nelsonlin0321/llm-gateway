import test from "node:test";
import assert from "node:assert/strict";

import {
  createProviderInputSchema,
  providerNamePattern,
  updateProviderInputSchema,
} from "@/lib/llm-provider/schema";

test("normalizes provider create input", () => {
  const parsed = createProviderInputSchema.parse({
    name: "OpenAI-Compatible",
    apiUrl: "https://api.example.com/v1/",
    apiKey: "key-123",
    compatibilityType: "openai",
    isActive: true,
  });

  assert.equal(parsed.name, "openai-compatible");
  assert.equal(parsed.apiUrl, "https://api.example.com/v1");
});

test("rejects provider names that break routing expectations", () => {
  assert.equal(providerNamePattern.test("good-prefix"), true);
  assert.equal(providerNamePattern.test("bad_prefix"), false);

  const parsed = createProviderInputSchema.safeParse({
    name: "Bad Prefix",
    apiUrl: "https://api.example.com",
    apiKey: "key-123",
    compatibilityType: "openai",
    isActive: true,
  });

  assert.equal(parsed.success, false);
});

test("allows provider edits to keep the stored API key", () => {
  const parsed = updateProviderInputSchema.parse({
    id: "provider-1",
    name: "anthropic",
    apiUrl: "https://api.anthropic.com",
    apiKey: "",
    compatibilityType: "anthropic",
    isActive: false,
  });

  assert.equal(parsed.apiKey, undefined);
  assert.equal(parsed.isActive, false);
});
