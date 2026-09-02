import assert from "node:assert/strict";
import test from "node:test";

import { getProviderModelCacheKey } from "../src/lib/redis-keys.js";

test("getProviderModelCacheKey builds stable keys", () => {
  assert.equal(
    getProviderModelCacheKey({
      organizationId: "org-1",
      providerName: "openai",
      compatibilityType: "openai",
      modelAlias: "gateway-alias",
    }),
    "provider-model:org-1:openai:openai:gateway-alias",
  );
});

test("getProviderModelCacheKey URI-encodes path segments", () => {
  assert.equal(
    getProviderModelCacheKey({
      organizationId: "org/1",
      providerName: "provider/with spaces",
      compatibilityType: "openai",
      modelAlias: "gpt-4/mini",
    }),
    "provider-model:org%2F1:openai:provider%2Fwith%20spaces:gpt-4%2Fmini",
  );
});
