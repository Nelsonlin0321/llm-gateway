import test from "node:test";
import assert from "node:assert/strict";

import {
  authenticateChildApiKey,
  decryptApiKeyForProxy,
  decryptChildKey,
  encryptApiKey,
  extractBearerToken,
  requirePlainChildApiKey,
  verifyChildKeyToken,
  type ChildKeyLookup,
} from "../../src/child-keys/index.js";
import { mintTestChildApiKey } from "./mint-test-key.js";

const secret = "gateway-api-child-key-test-secret";
const encryptSecret = "gateway-api-child-key-encrypt-secret";

async function mintKey(overrides: { exp?: number } = {}) {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;
  const issuedAt = Math.floor(Date.now() / 1000);

  return mintTestChildApiKey({
    key_id: "key-test-1",
    name: "test-key",
    tags: { env: "test", project: "gateway" },
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
    exp: overrides.exp,
  });
}

/** Lookup that accepts the presented plain key as the current DB secret. */
async function acceptingLookup(plainApiKey: string): Promise<ChildKeyLookup> {
  const payload = await verifyChildKeyToken(plainApiKey);
  return {
    async findById(id) {
      if (id !== payload.key_id) return null;
      return {
        id: payload.key_id,
        key: encryptApiKey(plainApiKey),
        isActive: true,
        expiresAt: null,
        issuedAt: payload.issued_at,
      };
    },
  };
}

test("extractBearerToken parses Authorization header", () => {
  assert.equal(extractBearerToken("Bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken("bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken("Basic x"), null);
});

test("authenticateChildApiKey accepts a plain sk_ JWT bearer token", async () => {
  const apiKey = await mintKey();
  assert.ok(apiKey.startsWith("sk_"));

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`, {
    lookup: await acceptingLookup(apiKey),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.payload.key_id, "key-test-1");
    assert.equal(result.payload.user_email, "user@example.com");
    assert.equal(result.payload.tags.env, "test");
    assert.equal(result.plainApiKey, apiKey);
  }
});

test("authenticateChildApiKey rejects encrypted DB values as bearer tokens", async () => {
  const apiKey = await mintKey();
  const encrypted = encryptApiKey(apiKey);
  assert.notEqual(encrypted, apiKey);
  assert.equal(decryptChildKey(encrypted), apiKey);
  assert.equal(decryptApiKeyForProxy(encrypted), apiKey);

  const result = await authenticateChildApiKey(`Bearer ${encrypted}`, {
    lookup: await acceptingLookup(apiKey),
  });
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
  process.env.API_ENCRYPT_KEY = encryptSecret;
  const issuedAt = Math.floor(Date.now() / 1000) - 120;
  const apiKey = await mintTestChildApiKey({
    key_id: "key-expired",
    name: "expired",
    tags: {},
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
    exp: issuedAt + 30,
  });

  // JWT expires before DB lookup; provide a no-op lookup that must not run.
  const result = await authenticateChildApiKey(`Bearer ${apiKey}`, {
    lookup: {
      async findById() {
        assert.fail("DB lookup should not run for an expired JWT");
        return null;
      },
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /expir/i);
  }
});

test("authenticateChildApiKey rejects invalid signatures", async () => {
  const apiKey = await mintKey();
  const lookup = await acceptingLookup(apiKey);

  process.env.JWT_SIGNING_SECRET = "other-secret";
  const result = await authenticateChildApiKey(`Bearer ${apiKey}`, { lookup });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("authenticateChildApiKey rejects deactivated DB key after JWT verify", async () => {
  const apiKey = await mintKey();
  const payload = await verifyChildKeyToken(apiKey);

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`, {
    lookup: {
      async findById(id) {
        if (id !== payload.key_id) return null;
        return {
          id: payload.key_id,
          key: encryptApiKey(apiKey),
          isActive: false,
          expiresAt: null,
          issuedAt: payload.issued_at,
        };
      },
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /deactivated/i);
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
