import test from "node:test";
import assert from "node:assert/strict";

import {
  createChildKeyInputSchema,
  normalizeChildKeyTags,
  toggleChildKeyInputSchema,
} from "@/lib/child-key/schema";
import {
  maskChildKey,
  validateCreateChildKeyInput,
  validateToggleChildKeyInput,
} from "@/lib/child-key/service";

test("createChildKeyInputSchema requires name and email; free-form tags optional", () => {
  const valid = createChildKeyInputSchema.safeParse({
    name: "prod-key",
    userEmail: "dev@example.com",
    tags: {
      project: "rag",
      env: "prod",
      region: "us-east-1",
      team: "  ",
    },
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.tags.project, "rag");
    assert.equal(valid.data.tags.env, "prod");
    assert.equal(valid.data.tags.region, "us-east-1");
    assert.equal(valid.data.tags.team, undefined);
  }

  const missingEmail = createChildKeyInputSchema.safeParse({
    name: "prod-key",
    userEmail: "not-an-email",
  });
  assert.equal(missingEmail.success, false);

  const shortName = validateCreateChildKeyInput({
    name: "a",
    userEmail: "dev@example.com",
  });
  assert.equal(shortName.success, false);

  const invalidTagKey = createChildKeyInputSchema.safeParse({
    name: "prod-key",
    userEmail: "dev@example.com",
    tags: {
      "1bad": "value",
    },
  });
  assert.equal(invalidTagKey.success, false);
});

test("toggleChildKeyInputSchema requires id and boolean", () => {
  assert.equal(
    toggleChildKeyInputSchema.safeParse({
      id: "key-1",
      isActive: false,
    }).success,
    true,
  );
  assert.equal(
    validateToggleChildKeyInput({ id: "", isActive: true }).success,
    false,
  );
});

test("normalizeChildKeyTags keeps arbitrary string keys and drops empties", () => {
  assert.deepEqual(
    normalizeChildKeyTags({
      project: " p ",
      env: "prod",
      team: "",
      "custom-label": "value",
      ignoredNumber: 12,
    }),
    {
      project: "p",
      env: "prod",
      "custom-label": "value",
    },
  );

  assert.ok(maskChildKey("sk_live_abcdefghijklmnop").startsWith("sk_live_"));
  assert.ok(maskChildKey("sk_live_abcdefghijklmnop").includes("…"));
});
