import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModelAlias,
  createModelInputSchema,
  getModelsInputSchema,
  parseModelAliasSuffix,
  parseModelListSearchParams,
  updateModelInputSchema,
} from "@/lib/model/schema";
import {
  buildModelCreateData,
  buildModelUpdateData,
  validateCreateModelInput,
  validateGetModelsInput,
  validateUpdateModelInput,
} from "@/lib/model/service";

test("createModelInputSchema requires positive prices and non-empty names", () => {
  const valid = createModelInputSchema.safeParse({
    providerId: "provider-1",
    name: "gpt-4.1",
    alias: "gpt-4.1",
    inputPrice: "2.5",
    outputPrice: 10,
    inputCachePrice: 1.25,
  });

  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.inputPrice, 2.5);
    assert.equal(valid.data.outputPrice, 10);
    assert.equal(valid.data.inputCachePrice, 1.25);
  }

  const missingName = createModelInputSchema.safeParse({
    providerId: "provider-1",
    name: "   ",
    alias: "alias",
    inputPrice: 1,
    outputPrice: 1,
    inputCachePrice: 1,
  });
  assert.equal(missingName.success, false);

  const zeroPrice = createModelInputSchema.safeParse({
    providerId: "provider-1",
    name: "gpt-4.1",
    alias: "alias",
    inputPrice: 0,
    outputPrice: 1,
    inputCachePrice: 1,
  });
  assert.equal(zeroPrice.success, false);

  const negativePrice = createModelInputSchema.safeParse({
    providerId: "provider-1",
    name: "gpt-4.1",
    alias: "alias",
    inputPrice: 1,
    outputPrice: -2,
    inputCachePrice: 1,
  });
  assert.equal(negativePrice.success, false);

  const aliasWithSlash = createModelInputSchema.safeParse({
    providerId: "provider-1",
    name: "gpt-4.1",
    alias: "minimax/gpt-4.1",
    inputPrice: 1,
    outputPrice: 1,
    inputCachePrice: 1,
  });
  assert.equal(aliasWithSlash.success, false);
});

test("model names are allowed to repeat (no uniqueness constraint in schema)", () => {
  const first = validateCreateModelInput({
    providerId: "provider-1",
    name: "claude-sonnet",
    alias: "a",
    inputPrice: 3,
    outputPrice: 15,
    inputCachePrice: 0.3,
  });
  const second = validateCreateModelInput({
    providerId: "provider-1",
    name: "claude-sonnet",
    alias: "b",
    inputPrice: 3,
    outputPrice: 15,
    inputCachePrice: 0.3,
  });

  assert.equal(first.success, true);
  assert.equal(second.success, true);
});

test("buildModelCreateData prefixes alias with provider name", () => {
  const data = buildModelCreateData(
    {
      providerId: "provider-1",
      name: "gpt-4.1",
      alias: "gpt-4.1",
      inputPrice: 2.5,
      outputPrice: 10,
      inputCachePrice: 1.25,
    },
    "minimax",
    "org-1",
  );

  assert.equal(typeof data.id, "string");
  assert.ok(data.id.length > 0);
  assert.equal(data.providerId, "provider-1");
  assert.equal(data.organizationId, "org-1");
  assert.equal(data.name, "gpt-4.1");
  assert.equal(data.alias, "minimax/gpt-4.1");
  assert.equal(buildModelAlias("minimax", "gpt-4.1"), "minimax/gpt-4.1");
  assert.equal(data.inputPrice, 2.5);
  assert.equal(data.outputPrice, 10);
  assert.equal(data.inputCachePrice, 1.25);
});

test("getModelsInputSchema requires organizationId", () => {
  assert.equal(getModelsInputSchema.safeParse({}).success, false);
  assert.equal(
    validateGetModelsInput({ organizationId: "org-1" }).success,
    true,
  );
  assert.equal(
    validateGetModelsInput({
      organizationId: "org-1",
      providerId: "provider-1",
      compatibilityType: "openai",
      q: "gpt",
    }).success,
    true,
  );
});

test("parseModelListSearchParams reads provider, compatibility, and name query", () => {
  assert.deepEqual(
    parseModelListSearchParams({
      provider: "provider-1",
      compatibility: "anthropic",
      q: "  gpt-4  ",
    }),
    {
      providerId: "provider-1",
      compatibilityType: "anthropic",
      q: "gpt-4",
    },
  );

  assert.deepEqual(
    parseModelListSearchParams({
      provider: "  ",
      compatibility: "unknown",
      q: "   ",
    }),
    {},
  );
});

test("updateModelInputSchema requires id and positive prices", () => {
  const valid = validateUpdateModelInput({
    id: "model-1",
    name: "gpt-4.1",
    alias: "gpt-4.1-mini",
    inputPrice: 1.5,
    outputPrice: 6,
    inputCachePrice: 0.75,
  });
  assert.equal(valid.success, true);

  const missingId = updateModelInputSchema.safeParse({
    name: "gpt-4.1",
    alias: "gpt-4.1",
    inputPrice: 1,
    outputPrice: 1,
    inputCachePrice: 1,
  });
  assert.equal(missingId.success, false);
});

test("buildModelUpdateData and parseModelAliasSuffix keep provider prefix correct", () => {
  assert.equal(
    parseModelAliasSuffix("minimax", "minimax/gpt-4.1"),
    "gpt-4.1",
  );
  assert.equal(parseModelAliasSuffix("minimax", "legacy"), "legacy");

  const data = buildModelUpdateData(
    {
      id: "model-1",
      name: "gpt-4.1",
      alias: "gpt-4.1-mini",
      inputPrice: 1.5,
      outputPrice: 6,
      inputCachePrice: 0.75,
    },
    "minimax",
  );

  assert.equal(data.alias, "minimax/gpt-4.1-mini");
  assert.equal(data.name, "gpt-4.1");
  assert.equal(data.inputPrice, 1.5);
});
