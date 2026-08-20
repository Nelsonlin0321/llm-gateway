import test from "node:test";
import assert from "node:assert/strict";

import {
  assignableRolesFor,
  hasPermission,
  normalizeRole,
  organizationPluginRoles,
  roleHasPermission,
  rolePermission,
  roles,
} from "@/lib/organization/permissions";

test("hasPermission follows rolePermission for each role", () => {
  assert.equal(hasPermission("root", "organization", "delete"), true);
  assert.equal(hasPermission("root", "childKey", "create"), true);
  assert.equal(hasPermission("admin", "organization", "update"), true);
  assert.equal(hasPermission("admin", "organization", "delete"), false);
  assert.equal(hasPermission("admin", "member", "delete"), true);
  assert.equal(hasPermission("viewer", "llmProvider", "view"), true);
  assert.equal(hasPermission("viewer", "llmProvider", "create"), false);
  assert.equal(hasPermission("member", "model", "view"), true);
  assert.equal(hasPermission("member", "childKey", "view"), false);
  assert.equal(hasPermission("member", "organization", "create"), true);
  assert.equal(hasPermission("member", "member", "create"), false);
});

test("unknown and missing roles are denied", () => {
  assert.equal(hasPermission(null, "organization", "view"), false);
  assert.equal(hasPermission(undefined, "organization", "view"), false);
  assert.equal(hasPermission("", "model", "view"), false);
  assert.equal(hasPermission("unknown", "organization", "view"), false);
});

test("legacy owner alias maps onto root; member is a first-class role", () => {
  assert.equal(normalizeRole("owner"), "root");
  assert.equal(normalizeRole("member"), "member");
  assert.equal(hasPermission("owner", "organization", "delete"), true);
  assert.equal(hasPermission("MEMBER", "model", "view"), true);
});

test("roleHasPermission requires every listed operation", () => {
  assert.equal(
    roleHasPermission("root", { organization: ["update", "delete"] }),
    true,
  );
  assert.equal(
    roleHasPermission("admin", { organization: ["update", "delete"] }),
    false,
  );
  assert.equal(
    roleHasPermission("admin", { member: ["create", "update"] }),
    true,
  );
});

test("only root can assign the root role", () => {
  assert.deepEqual(assignableRolesFor("root"), [
    "root",
    "admin",
    "viewer",
    "member",
  ]);
  assert.deepEqual(assignableRolesFor("admin"), [
    "admin",
    "viewer",
    "member",
  ]);
  assert.deepEqual(assignableRolesFor("viewer"), []);
  assert.deepEqual(assignableRolesFor("member"), []);
});

test("every configured role lists all entities", () => {
  for (const role of roles) {
    assert.deepEqual(
      Object.keys(rolePermission[role]).sort(),
      ["childKey", "llmProvider", "member", "model", "organization"],
    );
  }
});

test("Better Auth organization endpoints honor the same permission table", () => {
  assert.equal(
    organizationPluginRoles.root.authorize({ organization: ["delete"] })
      .success,
    true,
  );
  assert.equal(
    organizationPluginRoles.admin.authorize({ organization: ["delete"] })
      .success,
    false,
  );
  assert.equal(
    organizationPluginRoles.admin.authorize({ invitation: ["create"] })
      .success,
    true,
  );
  assert.equal(
    organizationPluginRoles.viewer.authorize({ invitation: ["create"] })
      .success,
    false,
  );
  assert.equal(
    organizationPluginRoles.member.authorize({ member: ["create"] }).success,
    false,
  );
});
