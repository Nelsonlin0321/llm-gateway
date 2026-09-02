import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeChildKeyToken,
  signChildKeyToken,
  verifyChildKeyToken,
  CHILD_KEY_PREFIX,
} from "@/lib/child-key/jwt";
import type { ChildKeyJwtPayload } from "@/lib/child-key/schema";

const samplePayload: ChildKeyJwtPayload = {
  key_id: "key-123",
  issued_at: 1694502400,
};

test("signChildKeyToken prefixes sk_ and is verifiable", async () => {
  process.env.JWT_SIGNING_SECRET = "test-signing-secret-for-child-keys";

  const token = await signChildKeyToken(samplePayload);
  assert.ok(token.startsWith(CHILD_KEY_PREFIX));

  const verified = await verifyChildKeyToken(token);
  assert.equal(verified.key_id, samplePayload.key_id);
  assert.equal(verified.issued_at, 1694502400);
});

test("decodeChildKeyToken returns payload without re-verifying", async () => {
  process.env.JWT_SIGNING_SECRET = "test-signing-secret-for-child-keys";

  const token = await signChildKeyToken(samplePayload);
  const decoded = decodeChildKeyToken(token);
  assert.equal(decoded.key_id, "key-123");
  assert.equal(decoded.issued_at, 1694502400);
});

test("verifyChildKeyToken rejects tokens signed with a different secret", async () => {
  process.env.JWT_SIGNING_SECRET = "secret-a";
  const token = await signChildKeyToken(samplePayload);

  process.env.JWT_SIGNING_SECRET = "secret-b";
  await assert.rejects(() => verifyChildKeyToken(token));
});
