import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProviderCreateData,
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
      inputPrice: 1,
      inputCachePrice: 0.5,
      outputPrice: 2,
      isActive: true,
    },
    "user-1",
  );

  assert.equal(data.creatorId, "user-1");
  assert.equal(data.name, "openai");
  assert.notEqual(data.encryptedApiKey, "provider-secret");
  assert.equal(
    decryptApiKeyForProxy(data.encryptedApiKey),
    "provider-secret",
  );
});

test("buildProviderUpdateData preserves the encrypted API key when no new key is supplied", () => {
  process.env.API_ENCRYPT_KEY = "update-data-test-key";

  const existingEncryptedKey = buildProviderCreateData(
    {
      name: "openai",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "existing-secret",
      compatibilityType: "openai",
      inputPrice: undefined,
      inputCachePrice: undefined,
      outputPrice: undefined,
      isActive: true,
    },
    "user-1",
  ).encryptedApiKey;

  const data = buildProviderUpdateData(existingEncryptedKey, {
    id: "provider-1",
    name: "openai",
    apiUrl: "https://api.openai.com/v1",
    compatibilityType: "openai",
    inputPrice: 3,
    inputCachePrice: 1,
    outputPrice: 4,
    isActive: false,
    apiKey: undefined,
  });

  assert.equal(data.encryptedApiKey, existingEncryptedKey);
  assert.equal(data.isActive, false);
  assert.equal(data.outputPrice, 4);
});

test("buildProvidersWhereClause defaults to active providers only", () => {
  assert.deepEqual(buildProvidersWhereClause("user-1"), {
    creatorId: "user-1",
    isActive: true,
  });

  assert.deepEqual(
    buildProvidersWhereClause("user-1", { includeInactive: true }),
    {
      creatorId: "user-1",
    },
  );
});
