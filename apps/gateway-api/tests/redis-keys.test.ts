import assert from "node:assert/strict";
import test from "node:test";

import { getProviderModelCacheKey } from "../src/lib/redis-keys.js";

test("getProviderModelCacheKey builds stable keys", () => {
  assert.equal(
    getProviderModelCacheKey({
      providerName: "openai",
      compatibilityType: "openai",
      modelAlias: "gateway-alias",
      application: "gateway-api",
    }),
    "provider-model:gateway-api:openai:openai:gateway-alias",
  );
});

test("getProviderModelCacheKey URI-encodes path segments", () => {
  assert.equal(
    getProviderModelCacheKey({
      providerName: "provider/with spaces",
      compatibilityType: "gpt-4/mini",
      modelAlias: "openai",
      application: "gateway-api",
    }),
    "provider-model:gateway-api:openai:provider%2Fwith%20spaces:gpt-4%2Fmini",
  );
});
