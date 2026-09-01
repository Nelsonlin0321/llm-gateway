import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeChildKeyToken,
  verifyChildKeyToken,
  CHILD_KEY_PREFIX,
} from "@/lib/child-key/jwt";
import {
  buildChildKeyCreateData,
  buildChildKeyRotateData,
  decryptChildKey,
  encryptChildKey,
} from "@/lib/child-key/service";

const JWT_SECRET = "test-signing-secret-for-child-key-rotation";
const ENCRYPT_KEY = "test-api-encrypt-key-for-child-key-rotation";

function withSecrets() {
  process.env.JWT_SIGNING_SECRET = JWT_SECRET;
  process.env.API_ENCRYPT_KEY = ENCRYPT_KEY;
}

test("buildChildKeyRotateData issues a new sk_ secret and advances issuedAt", async () => {
  withSecrets();

  const created = await buildChildKeyCreateData(
    {
      name: "team-growth-prod",
      userEmail: "dev@example.com",
      tags: { env: "prod", team: "growth" },
      policyId: "policy-abc",
      expiresAt: undefined,
    },
    { id: "user-1" },
    "org-1",
  );

  assert.ok(created.apiKey.startsWith(CHILD_KEY_PREFIX));
  assert.equal(
    created.data.issuedAt,
    decodeChildKeyToken(created.apiKey).issued_at,
  );

  // Simulate same-second rotation: source issuedAt equals "now".
  const rotated = await buildChildKeyRotateData({
    id: created.id,
    expiresAt: null,
    issuedAt: created.data.issuedAt as number,
  });

  assert.ok(rotated.apiKey.startsWith(CHILD_KEY_PREFIX));
  assert.notEqual(rotated.apiKey, created.apiKey);
  assert.ok(rotated.issuedAt > (created.data.issuedAt as number));
  assert.notEqual(rotated.data.key, created.data.key);

  const verified = await verifyChildKeyToken(rotated.apiKey);
  assert.equal(verified.key_id, created.id);
  assert.equal(verified.issued_at, rotated.issuedAt);

  // New ciphertext decrypts to the new secret only.
  const plainFromCipher = decryptChildKey(rotated.data.key as string);
  assert.equal(plainFromCipher, rotated.apiKey);
  assert.notEqual(plainFromCipher, created.apiKey);
});

test("buildChildKeyRotateData preserves expiresAt as JWT exp and keeps id stable", async () => {
  withSecrets();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const created = await buildChildKeyCreateData(
    {
      name: "expiring-key",
      userEmail: "ops@example.com",
      tags: {},
      policyId: undefined,
      expiresAt: expiresAt.toISOString(),
    },
    { id: "user-2" },
    "org-1",
  );

  const rotated = await buildChildKeyRotateData({
    id: created.id,
    expiresAt,
    issuedAt: created.data.issuedAt as number,
  });

  const verified = await verifyChildKeyToken(rotated.apiKey);
  assert.equal(verified.key_id, created.id);
  assert.ok(typeof verified.exp === "number");
  assert.equal(verified.exp, Math.floor(expiresAt.getTime() / 1000));
});

test("encryptChildKey / decryptChildKey round-trip for rotated secret", async () => {
  withSecrets();

  const created = await buildChildKeyCreateData(
    {
      name: "roundtrip",
      userEmail: "dev@example.com",
      tags: {},
      policyId: undefined,
      expiresAt: undefined,
    },
    { id: "user-3" },
    "org-1",
  );

  const cipher = encryptChildKey(created.apiKey);
  assert.equal(decryptChildKey(cipher), created.apiKey);
});
