import test from "node:test";
import assert from "node:assert/strict";

import {
  createProviderInputSchema,
  getProvidersOptionsSchema,
  parseProviderListSearchParams,
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

test("getProviders options accept an organization id", () => {
  const parsed = getProvidersOptionsSchema.parse({
    organizationId: "org-1",
    includeInactive: true,
    q: "moonshot",
  });

  assert.equal(parsed?.organizationId, "org-1");
  assert.equal(parsed?.includeInactive, true);
  assert.equal(parsed?.q, "moonshot");
});

test("parseProviderListSearchParams reads compatibility and name query", () => {
  assert.deepEqual(
    parseProviderListSearchParams({
      compatibility: "openai",
      q: "  moonshot  ",
    }),
    {
      compatibilityType: "openai",
      q: "moonshot",
    },
  );

  assert.deepEqual(
    parseProviderListSearchParams({
      compatibility: "unknown",
      q: "   ",
    }),
    {},
  );
});
