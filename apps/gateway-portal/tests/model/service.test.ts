import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModelNameTsQuery,
  buildModelsWhereClause,
} from "@/lib/model/service";

test("buildModelsWhereClause applies provider, compatibility, and name search", () => {
  assert.deepEqual(buildModelsWhereClause("org-1"), {
    organizationId: "org-1",
  });

  assert.deepEqual(
    buildModelsWhereClause("org-1", {
      providerId: "provider-1",
      compatibilityType: "openai",
      q: "gpt 4",
    }),
    {
      organizationId: "org-1",
      providerId: "provider-1",
      compatibilityType: "openai",
      nameSearch: "gpt:* & 4:*",
    },
  );
});

test("buildModelNameTsQuery tokenizes names for prefix full-text search", () => {
  assert.equal(
    buildModelNameTsQuery("  Claude-Sonnet "),
    "claude:* & sonnet:*",
  );
  assert.equal(buildModelNameTsQuery("!!!"), null);
});
