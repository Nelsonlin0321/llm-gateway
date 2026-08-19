import test from "node:test";
import assert from "node:assert/strict";

import { selectWorkspaceOrganizationId } from "@/lib/organization/service";
import type { OrganizationListItem } from "@/lib/organization/service";

function org(id: string): OrganizationListItem {
  return {
    id,
    name: id,
    slug: id,
    logo: null,
    createdAt: new Date("2026-01-01"),
    role: "owner",
  };
}

test("selectWorkspaceOrganizationId prefers the active membership", () => {
  assert.equal(
    selectWorkspaceOrganizationId([org("org-1"), org("org-2")], "org-2"),
    "org-2",
  );
});

test("selectWorkspaceOrganizationId falls back to the first organization", () => {
  assert.equal(
    selectWorkspaceOrganizationId([org("org-1"), org("org-2")], "missing"),
    "org-1",
  );
  assert.equal(
    selectWorkspaceOrganizationId([org("org-1"), org("org-2")], null),
    "org-1",
  );
});

test("selectWorkspaceOrganizationId returns null when the user has no organizations", () => {
  assert.equal(selectWorkspaceOrganizationId([], "org-1"), null);
});
