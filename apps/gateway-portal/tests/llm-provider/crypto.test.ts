import test from "node:test";
import assert from "node:assert/strict";

import {
  decryptApiKeyForProxy,
  encryptApiKey,
} from "@/lib/llm-provider/crypto";

test("encrypts and decrypts provider API keys with the configured key", () => {
  process.env.API_ENCRYPT_KEY = "test-provider-encryption-key";

  const encrypted = encryptApiKey("super-secret-provider-key");

  assert.notEqual(encrypted, "super-secret-provider-key");
  assert.equal(
    decryptApiKeyForProxy(encrypted),
    "super-secret-provider-key",
  );
});

test("rejects decrypting with a different encryption key", () => {
  process.env.API_ENCRYPT_KEY = "first-test-key";
  const encrypted = encryptApiKey("gateway-provider-key");

  process.env.API_ENCRYPT_KEY = "different-test-key";

  assert.throws(
    () => decryptApiKeyForProxy(encrypted),
    /could not be decrypted/i,
  );
});
