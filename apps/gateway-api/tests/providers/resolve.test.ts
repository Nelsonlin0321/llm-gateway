import assert from "node:assert/strict";
import test from "node:test";

import { encryptApiKey } from "../../src/child-keys/index.js";
import {
  resolveProvider,
  type ProviderLookup,
  type ProviderLookupRecord,
} from "../../src/providers/resolve.js";

function buildLookupRecord(
  overrides: Partial<ProviderLookupRecord> = {},
): ProviderLookupRecord {
  return {
    name: "openai",
    apiUrl: "https://example.com/v1",
    encryptedApiKey: "encrypted",
    compatibilityType: "openai",
    isActive: true,
    ...overrides,
  };
}

function buildLookup(
  handler: (name: string) => Promise<ProviderLookupRecord | null>,
): ProviderLookup {
  return {
    findByName(name: string) {
      return handler(name);
    },
  };
}

test("resolveProvider returns decrypted provider credentials", async () => {
  process.env.API_ENCRYPT_KEY = "resolve-provider-test-secret";
  const plainApiKey = "sk-provider-plain-secret";
  const lookup = buildLookup(async (name) =>
    name === "openai"
      ? buildLookupRecord({
          name,
          encryptedApiKey: encryptApiKey(plainApiKey),
        })
      : null,
  );

  const result = await resolveProvider("openai", "openai", lookup);

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected provider resolution to succeed");
  }

  assert.deepEqual(result.value, {
    providerId: "openai",
    baseUrl: "https://example.com/v1",
    apiKey: plainApiKey,
    compatibilityType: "openai",
  });
});

test("resolveProvider returns 400 for missing providers", async () => {
  const result = await resolveProvider(
    "missing",
    "openai",
    buildLookup(async () => null),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 400);
  assert.match(result.error.message, /unknown provider "missing"/i);
});

test("resolveProvider returns 403 for inactive providers", async () => {
  const result = await resolveProvider(
    "openai",
    "openai",
    buildLookup(async () => buildLookupRecord({ isActive: false })),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 403);
  assert.match(result.error.message, /inactive/i);
});

test("resolveProvider returns 400 for compatibility mismatches", async () => {
  const result = await resolveProvider(
    "openai",
    "anthropic",
    buildLookup(async () =>
      buildLookupRecord({ compatibilityType: "openai" }),
    ),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 400);
  assert.match(result.error.message, /not available for the anthropic api family/i);
});

test("resolveProvider returns 502 when decryption fails", async () => {
  process.env.API_ENCRYPT_KEY = "resolve-provider-test-secret";
  const lookup = buildLookup(async () =>
    buildLookupRecord({ encryptedApiKey: "v1.invalid.payload" }),
  );

  const result = await resolveProvider("openai", "openai", lookup);

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 502);
  assert.match(result.error.message, /misconfigured/i);
});

test("resolveProvider returns 503 when lookup fails", async () => {
  const lookup = buildLookup(async () => {
    throw new Error("database unavailable");
  });

  const result = await resolveProvider("openai", "openai", lookup);

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("Expected provider resolution to fail");
  }

  assert.equal(result.status, 503);
  assert.equal(result.error.type, "server_error");
});
