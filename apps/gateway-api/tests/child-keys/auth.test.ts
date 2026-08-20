import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";

import {
  authenticateChildApiKey,
  type ChildKeyDbRecord,
  decryptApiKeyForProxy,
  decryptChildKey,
  encryptApiKey,
  extractBearerToken,
  requirePlainChildApiKey,
  verifyChildKeyToken,
} from "../../src/child-keys/index";
import { childKeyRepository } from "../../src/child-keys/repository";
import { mintTestChildApiKey } from "./mint-test-key";

const secret = "gateway-api-child-key-test-secret";
const encryptSecret = "gateway-api-child-key-encrypt-secret";

function buildChildKeyRecord(
  overrides: Partial<ChildKeyDbRecord>,
): ChildKeyDbRecord {
  return {
    id: "key-test-1",
    name: "test-key",
    key: "encrypted-key",
    creatorId: "creator-1",
    userEmail: "user@example.com",
    isActive: true,
    tags: { env: "test", project: "gateway" },
    expiresAt: null,
    issuedAt: Math.floor(Date.now() / 1000),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

async function mintKey(overrides: { exp?: number } = {}) {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;
  const issuedAt = Math.floor(Date.now() / 1000);

  return mintTestChildApiKey({
    key_id: "key-test-1",
    name: "test-key",
    creator_id: "creator_id",
    issued_at: issuedAt,
    exp: overrides.exp,
  });
}

function mockFindById(
  t: TestContext,
  handler: (
    id: string,
  ) => ChildKeyDbRecord | null | Promise<ChildKeyDbRecord | null>,
) {
  const calls: Array<{ id: string }> = [];
  const originalFindById = childKeyRepository.findById;

  childKeyRepository.findById = async (id: string) => {
    calls.push({ id });
    return handler(id);
  };

  t.after(() => {
    childKeyRepository.findById = originalFindById;
  });

  return { calls };
}

async function acceptingRecord(plainApiKey: string): Promise<ChildKeyDbRecord> {
  const payload = await verifyChildKeyToken(plainApiKey);
  return buildChildKeyRecord({
    id: payload.key_id,
    name: payload.name,
    key: encryptApiKey(plainApiKey),
    issuedAt: payload.issued_at,
  });
}

test("extractBearerToken parses Authorization header", () => {
  assert.equal(extractBearerToken("Bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken("bearer sk_abc"), "sk_abc");
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken("Basic x"), null);
});

test("authenticateChildApiKey accepts a plain sk_ JWT bearer token", async (t) => {
  const apiKey = await mintKey();
  assert.ok(apiKey.startsWith("sk_"));
  const record = await acceptingRecord(apiKey);
  const findById = mockFindById(t, (id) => (id === record.id ? record : null));

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, true);
  assert.equal(findById.calls.length, 1);
  assert.equal(result.record.id, record.id);
});

test("authenticateChildApiKey rejects encrypted DB values as bearer tokens", async (t) => {
  const apiKey = await mintKey();
  const encrypted = encryptApiKey(apiKey);
  assert.notEqual(encrypted, apiKey);
  assert.equal(decryptChildKey(encrypted), apiKey);
  assert.equal(decryptApiKeyForProxy(encrypted), apiKey);
  const originalFindById = childKeyRepository.findById;
  let callCount = 0;
  childKeyRepository.findById = async () => {
    callCount += 1;
    throw new Error("DB lookup should not run for encrypted bearer tokens");
  };
  t.after(() => {
    childKeyRepository.findById = originalFindById;
  });

  const result = await authenticateChildApiKey(`Bearer ${encrypted}`);
  assert.equal(result.ok, false);
  assert.equal(callCount, 0);
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

test("authenticateChildApiKey rejects expired JWT", async (t) => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;
  const issuedAt = Math.floor(Date.now() / 1000) - 120;
  const apiKey = await mintTestChildApiKey({
    key_id: "key-expired",
    name: "expired",
    creator_id: "creator_id",
    issued_at: issuedAt,
    exp: issuedAt + 30,
  });

  const originalFindById = childKeyRepository.findById;
  let callCount = 0;
  childKeyRepository.findById = async () => {
    callCount += 1;
    throw new Error("DB lookup should not run for an expired JWT");
  };
  t.after(() => {
    childKeyRepository.findById = originalFindById;
  });
  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, false);
  assert.equal(callCount, 0);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /expir/i);
  }
});

test("authenticateChildApiKey rejects invalid signatures", async (t) => {
  const apiKey = await mintKey();
  const originalFindById = childKeyRepository.findById;
  let callCount = 0;
  childKeyRepository.findById = async () => {
    callCount += 1;
    throw new Error("DB lookup should not run for invalid signatures");
  };
  t.after(() => {
    childKeyRepository.findById = originalFindById;
  });

  process.env.JWT_SIGNING_SECRET = "other-secret";
  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);
  assert.equal(result.ok, false);
  assert.equal(callCount, 0);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("authenticateChildApiKey rejects deactivated DB key after JWT verify", async (t) => {
  const apiKey = await mintKey();
  const payload = await verifyChildKeyToken(apiKey);
  const findById = mockFindById(t, (id) => {
    if (id !== payload.key_id) return null;
    return buildChildKeyRecord({
      id: payload.key_id,
      name: payload.name,
      key: encryptApiKey(apiKey),
      isActive: false,
      issuedAt: payload.issued_at,
    });
  });

  const result = await authenticateChildApiKey(`Bearer ${apiKey}`);

  assert.equal(result.ok, false);
  assert.equal(findById.calls.length, 1);
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
  assert.equal(payload.key_id, "key-test-1");
});
