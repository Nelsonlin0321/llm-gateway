import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProviderCreateData,
  buildProviderNameTsQuery,
  buildProviderUpdateData,
  buildProvidersWhereClause,
} from "@/lib/llm-provider/service";
import { decryptApiKeyForProxy } from "@/lib/llm-provider/crypto";

test("buildProviderCreateData encrypts the API key before persistence", () => {
  process.env.API_ENCRYPT_KEY = "create-data-test-key";

  const data = buildProviderCreateData(
    {
      name: "openai",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "provider-secret",
      compatibilityType: "openai",
      isActive: true,
    },
    "user-1",
    "org-1",
  );

  assert.equal(data.creatorId, "user-1");
  assert.equal(data.organizationId, "org-1");
  assert.equal(data.name, "openai");
  assert.notEqual(data.encryptedApiKey, "provider-secret");
  assert.equal(decryptApiKeyForProxy(data.encryptedApiKey), "provider-secret");
});

test("buildProviderUpdateData preserves the encrypted API key when no new key is supplied", () => {
  process.env.API_ENCRYPT_KEY = "update-data-test-key";

  const existingEncryptedKey = buildProviderCreateData(
    {
      name: "openai",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "existing-secret",
      compatibilityType: "openai",
      isActive: true,
    },
    "user-1",
    "org-1",
  ).encryptedApiKey;

  const data = buildProviderUpdateData(existingEncryptedKey, {
    id: "provider-1",
    name: "openai",
    apiUrl: "https://api.openai.com/v1",
    compatibilityType: "openai",
    isActive: false,
    apiKey: undefined,
  });

  assert.equal(data.encryptedApiKey, existingEncryptedKey);
  assert.equal(data.isActive, false);
});

test("buildProvidersWhereClause defaults to active providers only", () => {
  assert.deepEqual(buildProvidersWhereClause("org-1"), {
    organizationId: "org-1",
    isActive: true,
  });

  assert.deepEqual(
    buildProvidersWhereClause("org-1", { includeInactive: true }),
    {
      organizationId: "org-1",
    },
  );

  assert.deepEqual(
    buildProvidersWhereClause("org-1", {
      includeInactive: true,
      compatibilityType: "anthropic",
      q: "deep seek",
    }),
    {
      organizationId: "org-1",
      compatibilityType: "anthropic",
      nameSearch: "deep:* & seek:*",
    },
  );
});

test("buildProviderNameTsQuery tokenizes names for prefix full-text search", () => {
  assert.equal(buildProviderNameTsQuery("  Alibaba-CN "), "alibaba:* & cn:*");
  assert.equal(buildProviderNameTsQuery("!!!"), null);
});
