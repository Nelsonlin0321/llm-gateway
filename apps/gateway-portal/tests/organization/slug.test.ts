import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOrganizationName,
  defaultOrganizationSlug,
  slugifyOrganizationName,
} from "@/lib/organization/slug";

test("slugifyOrganizationName normalizes names", () => {
  assert.equal(slugifyOrganizationName("Acme Engineering"), "acme-engineering");
  assert.equal(slugifyOrganizationName("  Hello---World  "), "hello-world");
  assert.equal(slugifyOrganizationName("@@@"), "workspace");
});

test("defaultOrganizationName uses the user's name or email local part", () => {
  assert.equal(
    defaultOrganizationName({ name: "Jane Doe", email: "jane@example.com" }),
    "Jane Doe's Workspace",
  );
  assert.equal(
    defaultOrganizationName({ name: "  ", email: "ops@example.com" }),
    "ops's Workspace",
  );
});

test("defaultOrganizationSlug includes a stable user-id suffix", () => {
  const slug = defaultOrganizationSlug({
    id: "user_AbC12345",
    name: "Jane Doe",
    email: "jane@example.com",
  });
  assert.equal(slug, "jane-doe-userabc1");
});
