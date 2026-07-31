import assert from "node:assert/strict";
import test from "node:test";

import { encryptApiKey } from "../../src/child-keys/index.js";
import {
  resolveProviderModel,
  type ProviderLookup,
  type ProviderLookupRecord,
  type ProviderModelLookup,
  type ProviderModelLookupRecord,
} from "../../src/providers/resolve.js";

function buildLookupRecord(
  overrides: Partial<ProviderLookupRecord> = {},
): ProviderLookupRecord {
  return {
    id: "provider_openai",
    name: "openai",
    apiUrl: "https://example.com/v1",
    encryptedApiKey: "encrypted",
    compatibilityType: "openai",
    isActive: true,
    ...overrides,
  };
}

function buildLookup(
  handler: (
    name: string,
    compatibilityType: "openai" | "anthropic",
    creatorId: string,
  ) => Promise<ProviderLookupRecord | null>,
): ProviderLookup {
  return {
    findByName(
      name: string,
      compatibilityType: "openai" | "anthropic",
      creatorId: string,
    ) {
      return handler(name, compatibilityType, creatorId);
    },
  };
}

function buildProviderModelLookupRecord(
  overrides: Partial<ProviderModelLookupRecord> = {},
): ProviderModelLookupRecord {
  return {
    llmProvider: buildLookupRecord(),
    llmModel: { alias: "openai/gateway-alias", name: "gpt-5.4-mini" },
    ...overrides,
  };
}

function buildProviderModelLookup(
  handler: (
    name: string,
    modelAlias: string,
    compatibilityType: "openai" | "anthropic",
    creatorId: string,
  ) => Promise<ProviderModelLookupRecord | null>,
): ProviderModelLookup {
  return {
    findByNameAndAlias(
      name: string,
      modelAlias: string,
      compatibilityType: "openai" | "anthropic",
      creatorId: string,
    ) {
      return handler(name, modelAlias, compatibilityType, creatorId);
    },
  };
}

test("resolveProvider returns decrypted provider credentials", async () => {
  process.env.API_ENCRYPT_KEY = "resolve-provider-test-secret";
  const plainApiKey = "sk-provider-plain-secret";
  const creatorId = "creator_1";
  const lookup = buildProviderModelLookup(
    async (name, modelAlias, compatibilityType, id) =>
      name === "openai" &&
      modelAlias === "gateway-alias" &&
      compatibilityType === "openai" &&
      id === creatorId
        ? buildProviderModelLookupRecord({
            llmProvider: buildLookupRecord({
              name,
              encryptedApiKey: encryptApiKey(plainApiKey),
            }),
          })
        : null,
  );

  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "openai",
    creatorId,
    lookup,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected provider resolution to succeed");
  }

  assert.deepEqual(result.value, {
    providerId: "provider_openai",
    providerName: "openai",
    baseUrl: "https://example.com/v1",
    apiKey: plainApiKey,
    compatibilityType: "openai",
    modelAlias: "gateway-alias",
    model: "gpt-5.4-mini",
  });
});

test("resolveProvider returns 400 for missing providers", async () => {
  const result = await resolveProviderModel(
    "missing",
    "gateway-alias",
    "openai",
    "creator_1",
    buildProviderModelLookup(async () => null),
    buildLookup(async () => null),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 400);
  assert.match(result.error.message, /unknown provider "missing"/i);
});

test("resolveProviderModel returns 403 for inactive providers", async () => {
  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "openai",
    "creator_1",
    buildProviderModelLookup(async () =>
      buildProviderModelLookupRecord({
        llmProvider: buildLookupRecord({ isActive: false }),
      }),
    ),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 403);
  assert.match(result.error.message, /inactive/i);
});

test("resolveProviderModel returns 400 for compatibility mismatches", async () => {
  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "anthropic",
    "creator_1",
    buildProviderModelLookup(async () =>
      buildProviderModelLookupRecord({
        llmProvider: buildLookupRecord({ compatibilityType: "openai" }),
      }),
    ),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 400);
  assert.match(
    result.error.message,
    /not available for the anthropic api family/i,
  );
});

test("resolveProvider returns 502 when decryption fails", async () => {
  process.env.API_ENCRYPT_KEY = "resolve-provider-test-secret";
  const lookup = buildProviderModelLookup(async () =>
    buildProviderModelLookupRecord({
      llmProvider: buildLookupRecord({ encryptedApiKey: "v1.invalid.payload" }),
    }),
  );

  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "openai",
    "creator_1",
    lookup,
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 502);
  assert.match(result.error.message, /misconfigured/i);
});

test("resolveProvider returns 503 when lookup fails", async () => {
  const lookup = buildProviderModelLookup(async () => {
    throw new Error("database unavailable");
  });

  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "openai",
    "creator_1",
    lookup,
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 503);
  assert.equal(result.error.type, "server_error");
});

test("resolveProviderModel returns decrypted credentials and upstream model name", async () => {
  process.env.API_ENCRYPT_KEY = "resolve-provider-test-secret";
  const plainApiKey = "sk-provider-plain-secret";
  const creatorId = "creator_1";

  const result = await resolveProviderModel(
    "openai",
    "gateway-alias",
    "openai",
    creatorId,
    buildProviderModelLookup(async (name, modelAlias, compatibilityType, id) =>
      name === "openai" &&
      modelAlias === "gateway-alias" &&
      compatibilityType === "openai" &&
      id === creatorId
        ? buildProviderModelLookupRecord({
            llmProvider: buildLookupRecord({
              encryptedApiKey: encryptApiKey(plainApiKey),
            }),
          })
        : null,
    ),
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected provider+model resolution to succeed");
  }

  assert.deepEqual(result.value, {
    providerId: "provider_openai",
    providerName: "openai",
    baseUrl: "https://example.com/v1",
    apiKey: plainApiKey,
    compatibilityType: "openai",
    modelAlias: "gateway-alias",
    model: "gpt-5.4-mini",
  });
});

test("resolveProviderModel returns 400 for unknown model aliases", async () => {
  const result = await resolveProviderModel(
    "openai",
    "missing-alias",
    "openai",
    "creator_1",
    buildProviderModelLookup(async () => null),
    buildLookup(async () => buildLookupRecord()),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider+model resolution to fail");
  }

  assert.equal(result.status, 400);
  assert.match(result.error.message, /unknown model "openai\/missing-alias"/i);
});
