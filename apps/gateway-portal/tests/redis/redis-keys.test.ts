import test from "node:test";
import assert from "node:assert/strict";

import {
  getChildKeyCacheKey,
  getProviderModelCacheKey,
  getProviderModelCachePattern,
} from "@/lib/redis/redis-keys";

test("cache keys match the gateway-api format", () => {
  assert.equal(getChildKeyCacheKey("key-1"), "child-key:key-1");
  assert.equal(
    getProviderModelCacheKey({
      organizationId: "org-1",
      providerName: "openai",
      compatibilityType: "openai",
      modelAlias: "chat",
    }),
    "provider-model:org-1:openai:openai:chat",
  );
  assert.equal(
    getProviderModelCachePattern({
      organizationId: "org-1",
      providerName: "openai",
      compatibilityType: "openai",
    }),
    "provider-model:org-1:openai:openai:*",
  );
});
