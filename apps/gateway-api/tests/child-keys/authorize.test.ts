import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";

import {
  authorizeChildKey,
  encryptApiKey,
  type ChildKeyDbRecord,
} from "../../src/child-keys/index.js";
import prisma from "../../src/prisma.js";
import type { ChildKeyJwtPayload } from "../../src/child-keys/types.js";
import { mintTestChildApiKey } from "./mint-test-key.js";

const secret = "gateway-api-authorize-test-secret";
const encryptSecret = "gateway-api-authorize-encrypt-secret";

function buildChildKeyRecord(
  overrides: Partial<ChildKeyDbRecord>,
): ChildKeyDbRecord {
  return {
    id: "key-db-1",
    name: "db-key",
    key: "encrypted-key",
    creatorId: "creator-1",
    userEmail: "user@example.com",
    isActive: true,
    tags: { env: "test" },
    expiresAt: null,
    issuedAt: Math.floor(Date.now() / 1000),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

type FindUniqueHandler = (
  id: string,
) => ChildKeyDbRecord | null | Promise<ChildKeyDbRecord | null>;

function mockFindUnique(t: TestContext, handler: FindUniqueHandler) {
  const calls: Array<{ where: { id: string } }> = [];
  const originalFindUnique = prisma.childKey.findUnique;

  prisma.childKey.findUnique = (async (args: { where: { id?: string } }) => {
    const id = args.where.id;
    if (typeof id !== "string") {
      throw new TypeError(
        "Expected prisma.childKey.findUnique to receive an id.",
      );
    }
    calls.push({ where: { id } });
    return handler(id);
  }) as unknown as typeof prisma.childKey.findUnique;

  t.after(() => {
    prisma.childKey.findUnique = originalFindUnique;
  });

  return { calls };
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
    issued_at: issuedAt,
  });

  const encrypted = encryptApiKey(plainApiKey);
  const record: ChildKeyDbRecord = buildChildKeyRecord({
    id: "key-db-1",
    name: "db-key",
    key: overrides?.mutateStoredKey
      ? overrides.mutateStoredKey(encrypted)
      : encrypted,
    isActive: overrides?.isActive ?? true,
    expiresAt: overrides?.expiresAt === undefined ? null : overrides.expiresAt,
    issuedAt,
  });

  const payload: ChildKeyJwtPayload = {
    key_id: "key-db-1",
    name: "db-key",
    issued_at: issuedAt,
  };

  return { plainApiKey, record, payload };
}

test("authorizeChildKey accepts active matching key", async (t) => {
  const { plainApiKey, payload, record } = await mintWithDb();
  const findUnique = mockFindUnique(t, (id) =>
    id === record.id ? record : null,
  );
  const result = await authorizeChildKey(plainApiKey, payload);
  assert.equal(result.ok, true);
  assert.equal(findUnique.calls.length, 1);
});

test("authorizeChildKey rejects missing key", async (t) => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const issuedAt = Math.floor(Date.now() / 1000);
  const plainApiKey = await mintTestChildApiKey({
    key_id: "missing",
    name: "x",
    issued_at: issuedAt,
  });

  const findUnique = mockFindUnique(t, () => null);
  const result = await authorizeChildKey(plainApiKey, {
    key_id: "missing",
    name: "x",
    issued_at: issuedAt,
  });

  assert.equal(result.ok, false);
  assert.equal(findUnique.calls.length, 1);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /not found|revoked/i);
  }
});

test("authorizeChildKey rejects deactivated key", async (t) => {
  const { plainApiKey, payload, record } = await mintWithDb({
    isActive: false,
  });
  const findUnique = mockFindUnique(t, (id) =>
    id === record.id ? record : null,
  );
  const result = await authorizeChildKey(plainApiKey, payload);
  assert.equal(result.ok, false);
  assert.equal(findUnique.calls.length, 1);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /deactivated/i);
  }
});

test("authorizeChildKey rejects expired row expiresAt", async (t) => {
  const { plainApiKey, payload, record } = await mintWithDb({
    expiresAt: new Date(Date.now() - 60_000),
  });
  const findUnique = mockFindUnique(t, (id) =>
    id === record.id ? record : null,
  );
  const result = await authorizeChildKey(plainApiKey, payload);
  assert.equal(result.ok, false);
  assert.equal(findUnique.calls.length, 1);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /expir/i);
  }
});

test("authorizeChildKey rejects rotated issuedAt mismatch", async (t) => {
  const { plainApiKey, payload, record } = await mintWithDb();
  const rotatedRecord = {
    ...record,
    issuedAt: record.issuedAt + 10,
  };
  const findUnique = mockFindUnique(t, (id) =>
    id === rotatedRecord.id ? rotatedRecord : null,
  );

  const result = await authorizeChildKey(plainApiKey, payload);
  assert.equal(result.ok, false);
  assert.equal(findUnique.calls.length, 1);
  if (!result.ok) {
    assert.equal(result.status, 401);
    assert.match(result.error.message, /rotated|no longer valid/i);
  }
});

test("authorizeChildKey rejects secret mismatch", async (t) => {
  const { plainApiKey, payload, record } = await mintWithDb({
    mutateStoredKey: () => {
      process.env.API_ENCRYPT_KEY = encryptSecret;
      return encryptApiKey("sk_other-secret-that-is-long-enough-xx");
    },
  });

  // stored key decrypts to different plain value → mismatch (or verify fail)
  const findUnique = mockFindUnique(t, (id) =>
    id === record.id ? record : null,
  );
  const result = await authorizeChildKey(plainApiKey, payload);
  assert.equal(result.ok, false);
  assert.equal(findUnique.calls.length, 1);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("authorizeChildKey returns 503 on database errors", async (t) => {
  process.env.JWT_SIGNING_SECRET = secret;
  process.env.API_ENCRYPT_KEY = encryptSecret;

  const issuedAt = Math.floor(Date.now() / 1000);
  const plainApiKey = await mintTestChildApiKey({
    key_id: "key-db-err",
    name: "err",
    issued_at: issuedAt,
  });

  const originalFindUnique = prisma.childKey.findUnique;
  let callCount = 0;
  prisma.childKey.findUnique = (async () => {
    callCount += 1;
    throw new Error("connection refused");
  }) as unknown as typeof prisma.childKey.findUnique;
  t.after(() => {
    prisma.childKey.findUnique = originalFindUnique;
  });
  const result = await authorizeChildKey(plainApiKey, {
    key_id: "key-db-err",
    name: "err",
    issued_at: issuedAt,
  });

  assert.equal(result.ok, false);
  assert.equal(callCount, 1);
  if (!result.ok) {
    assert.equal(result.status, 503);
    assert.equal(result.error.type, "server_error");
  }
});
