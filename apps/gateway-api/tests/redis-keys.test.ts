import assert from "node:assert/strict";
import test from "node:test";

import { getProviderModelCacheKey } from "../src/lib/redis-keys.js";

test("getProviderModelCacheKey builds stable keys", () => {
  assert.equal(
    getProviderModelCacheKey(
      "openai",
      "gateway-alias",
      "openai",
      "gateway-api",
    ),
    "provider-model:gateway-api:openai:openai:gateway-alias",
  );
});

test("getProviderModelCacheKey URI-encodes path segments", () => {
  assert.equal(
    getProviderModelCacheKey(
      "provider/with spaces",
      "gpt-4/mini",
      "openai",
      "gateway-api",
    ),
    "provider-model:gateway-api:openai:provider%2Fwith%20spaces:gpt-4%2Fmini",
  );
});
