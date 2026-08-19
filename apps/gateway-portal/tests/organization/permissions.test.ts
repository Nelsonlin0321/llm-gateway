import test from "node:test";
import assert from "node:assert/strict";

import {
  assignableRolesFor,
  normalizeOrganizationRole,
  roleHasPermission,
} from "@/lib/organization/permissions";

test("root can update and delete organization resources", () => {
  assert.equal(roleHasPermission("root", { organization: ["update"] }), true);
  assert.equal(roleHasPermission("root", { organization: ["delete"] }), true);
  assert.equal(roleHasPermission("root", { member: ["delete"] }), true);
  assert.equal(roleHasPermission("root", { invitation: ["create"] }), true);
});

test("admin can edit but cannot delete", () => {
  assert.equal(roleHasPermission("admin", { organization: ["update"] }), true);
  assert.equal(roleHasPermission("admin", { organization: ["delete"] }), false);
  assert.equal(roleHasPermission("admin", { member: ["create"] }), true);
  assert.equal(roleHasPermission("admin", { member: ["update"] }), true);
  assert.equal(roleHasPermission("admin", { member: ["delete"] }), false);
  assert.equal(roleHasPermission("admin", { invitation: ["create"] }), true);
  assert.equal(roleHasPermission("admin", { invitation: ["cancel"] }), true);
});

test("viewer can only read", () => {
  assert.equal(roleHasPermission("viewer", { organization: ["update"] }), false);
  assert.equal(roleHasPermission("viewer", { member: ["create"] }), false);
  assert.equal(roleHasPermission("viewer", { invitation: ["create"] }), false);
  assert.equal(roleHasPermission("viewer", { ac: ["read"] }), true);
});

test("legacy owner and member aliases map onto root and viewer", () => {
  assert.equal(normalizeOrganizationRole("owner"), "root");
  assert.equal(normalizeOrganizationRole("member"), "viewer");
  assert.equal(roleHasPermission("owner", { organization: ["delete"] }), true);
  assert.equal(roleHasPermission("member", { invitation: ["create"] }), false);
});

test("only root can assign the root role", () => {
  assert.deepEqual(assignableRolesFor("root"), ["root", "admin", "viewer"]);
  assert.deepEqual(assignableRolesFor("admin"), ["admin", "viewer"]);
  assert.deepEqual(assignableRolesFor("viewer"), []);
});
