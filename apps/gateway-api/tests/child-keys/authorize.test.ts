import test from "node:test";
import assert from "node:assert/strict";

import {
  authorizeChildKey,
  encryptApiKey,
  type ChildKeyDbRecord,
  type ChildKeyLookup,
} from "../../src/child-keys/index.js";
import type { ChildKeyJwtPayload } from "../../src/child-keys/types.js";
import { mintTestChildApiKey } from "./mint-test-key.js";

const secret = "gateway-api-authorize-test-secret";
const encryptSecret = "gateway-api-authorize-encrypt-secret";

function makeLookup(record: ChildKeyDbRecord | null): ChildKeyLookup {
  return {
    async findById(id: string) {
      if (!record || record.id !== id) {
        return null;
      }
      return record;
    },
  };
}

async function mintWithDb(overrides?: {
  isActive?: boolean;
  expiresAt?: Date | null;
  issuedAt?: number;
  mutateStoredKey?: (encrypted: string) => string;
}) {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const issuedAt = overrides?.issuedAt ?? Math.floor(Date.now() / 1000);
  const plainApiKey = await mintTestChildApiKey({
    key_id: "key-db-1",
    name: "db-key",
    tags: { env: "test" },
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
  });

  const encrypted = encryptApiKey(plainApiKey);
  const record: ChildKeyDbRecord = {
    id: "key-db-1",
    key: overrides?.mutateStoredKey
      ? overrides.mutateStoredKey(encrypted)
      : encrypted,
    isActive: overrides?.isActive ?? true,
    expiresAt: overrides?.expiresAt === undefined ? null : overrides.expiresAt,
    issuedAt,
  };

  const payload: ChildKeyJwtPayload = {
    key_id: "key-db-1",
    name: "db-key",
    tags: { env: "test" },
    user_email: "user@example.com",
    creator_email: "admin@example.com",
    issued_at: issuedAt,
  };

  return { plainApiKey, record, payload, lookup: makeLookup(record) };
}

test("authorizeChildKey accepts active matching key", async () => {
  const { plainApiKey, payload, lookup } = await mintWithDb();
  const result = await authorizeChildKey(plainApiKey, payload, lookup);
  assert.equal(result.ok, true);
});

test("authorizeChildKey rejects missing key", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const issuedAt = Math.floor(Date.now() / 1000);
  const plainApiKey = await mintTestChildApiKey({
    key_id: "missing",
    name: "x",
    tags: {},
    user_email: "u@example.com",
    creator_email: "a@example.com",
    issued_at: issuedAt,
  });

  const result = await authorizeChildKey(
    plainApiKey,
    {
      key_id: "missing",
      name: "x",
      tags: {},
      user_email: "u@example.com",
      creator_email: "a@example.com",
      issued_at: issuedAt,
    },
    makeLookup(null),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /not found|revoked/i);
  }
});

test("authorizeChildKey rejects deactivated key", async () => {
  const { plainApiKey, payload, lookup } = await mintWithDb({
    isActive: false,
  });
  const result = await authorizeChildKey(plainApiKey, payload, lookup);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /deactivated/i);
  }
});

test("authorizeChildKey rejects expired row expiresAt", async () => {
  const { plainApiKey, payload, lookup } = await mintWithDb({
    expiresAt: new Date(Date.now() - 60_000),
  });
  const result = await authorizeChildKey(plainApiKey, payload, lookup);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /expir/i);
  }
});

test("authorizeChildKey rejects rotated issuedAt mismatch", async () => {
  const { plainApiKey, payload, record } = await mintWithDb();
  const rotatedLookup = makeLookup({
    ...record,
    issuedAt: record.issuedAt + 10,
  });

  const result = await authorizeChildKey(plainApiKey, payload, rotatedLookup);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /rotated|no longer valid/i);
  }
});

test("authorizeChildKey rejects secret mismatch", async () => {
  const { plainApiKey, payload, lookup } = await mintWithDb({
    mutateStoredKey: () => {
      process.env.API_ENCRYPT_KEY = encryptSecret;
      return encryptApiKey("sk_other-secret-that-is-long-enough-xx");
    },
  });

  // stored key decrypts to different plain value → mismatch (or verify fail)
  const result = await authorizeChildKey(plainApiKey, payload, lookup);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("authorizeChildKey returns 503 on database errors", async () => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const issuedAt = Math.floor(Date.now() / 1000);
  const plainApiKey = await mintTestChildApiKey({
    key_id: "key-db-err",
    name: "err",
    tags: {},
    user_email: "u@example.com",
    creator_email: "a@example.com",
    issued_at: issuedAt,
  });

  const failingLookup: ChildKeyLookup = {
    async findById() {
      throw new Error("connection refused");
    },
  };

  const result = await authorizeChildKey(
    plainApiKey,
    {
      key_id: "key-db-err",
      name: "err",
      tags: {},
      user_email: "u@example.com",
      creator_email: "a@example.com",
      issued_at: issuedAt,
    },
    failingLookup,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 503);
    assert.equal(result.error.type, "server_error");
  }
});
