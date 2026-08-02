import assert from "node:assert/strict";
import test from "node:test";

import { getProviderModelCacheKey } from "../src/lib/redis-keys.js";

test("getProviderModelCacheKey builds stable keys", () => {
  assert.equal(
    getProviderModelCacheKey({
      providerName: "openai",
      compatibilityType: "openai",
      modelAlias: "gateway-alias",
      creatorId: "creator-1",
      application: "gateway-api",
    }),
    "provider-model:openai:openai:creator-1:gateway-alias:gateway-api",
  );
});

test("getProviderModelCacheKey URI-encodes path segments", () => {
  assert.equal(
    getProviderModelCacheKey({
      providerName: "provider/with spaces",
      compatibilityType: "openai",
      modelAlias: "gpt-4/mini",
      creatorId: "creator/1",
      application: "gateway-api",
    }),
    "provider-model:provider%2Fwith%20spaces:openai:creator%2F1:gpt-4%2Fmini:gateway-api",
  );
});
