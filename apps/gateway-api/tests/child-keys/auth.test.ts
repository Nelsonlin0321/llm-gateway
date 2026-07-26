import test from "node:test";
import assert from "node:assert/strict";

import {
  authenticateChildApiKey,
  decryptApiKeyForProxy,
  decryptChildKey,
  encryptApiKey,
  extractBearerToken,
  requirePlainChildApiKey,
  signChildKeyToken,
  verifyChildKeyToken,
} from "../../src/child-keys/index.js";

const secret = "gateway-api-child-key-test-secret";
const encryptSecret = "gateway-api-child-key-encrypt-secret";

async function mintKey(overrides: { exp?: number } = {}) {
  process.env.JWT_SIGNING_SECRET = secret;
  const issuedAt = Math.floor(Date.now() / 1000);

  return signChildKeyToken({
    key_id: "key-test-1",
    name: "test-key",
    tags: { env: "test", project: "gateway" },
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
    exp: overrides.exp,
  });
}

test("extractBearerToken parses Authorization header", () => {
  assert.equal(extractBearerToken("Bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken("bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken("Basic x"), null);
});

test("authenticateChildApiKey accepts a plain sk_ JWT bearer token", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  const apiKey = await mintKey();
  assert.ok(apiKey.startsWith("sk_"));

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.payload.key_id, "key-test-1");
    assert.equal(result.payload.user_email, "user@example.com");
    assert.equal(result.payload.tags.env, "test");
    assert.equal(result.plainApiKey, apiKey);
  }
});

test("authenticateChildApiKey rejects encrypted DB values as bearer tokens", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const apiKey = await mintKey();
  const encrypted = encryptApiKey(apiKey);
  assert.notEqual(encrypted, apiKey);
  // Encrypted form is only for DB storage — still decryptable via decryptChildKey.
  assert.equal(decryptChildKey(encrypted), apiKey);
  assert.equal(decryptApiKeyForProxy(encrypted), apiKey);

  const result = await authenticateChildApiKey(`Bearer ${encrypted}`);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /plain secret starting with sk_/i);
  }
});

test("authenticateChildApiKey rejects missing Authorization", async () => {
  const result = await authenticateChildApiKey(undefined);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /Authorization/i);
  }
});

test("authenticateChildApiKey rejects expired JWT", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  const issuedAt = Math.floor(Date.now() / 1000) - 120;
  const apiKey = await signChildKeyToken({
    key_id: "key-expired",
    name: "expired",
    tags: {},
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
    exp: issuedAt + 30,
  });

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /expir/i);
  }
});

test("authenticateChildApiKey rejects invalid signatures", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  const apiKey = await mintKey();

  process.env.JWT_SIGNING_SECRET = "other-secret";
  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("requirePlainChildApiKey and verifyChildKeyToken round-trip", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const apiKey = await mintKey();
  assert.equal(requirePlainChildApiKey(apiKey), apiKey);
  assert.throws(() => requirePlainChildApiKey(encryptApiKey(apiKey)), /plain/i);

  const payload = await verifyChildKeyToken(apiKey);
  assert.equal(payload.name, "test-key");
});
