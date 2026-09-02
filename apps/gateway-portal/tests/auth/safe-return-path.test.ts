import test from "node:test";
import assert from "node:assert/strict";

import { safeReturnPath } from "@/lib/auth-redirect";

test("safeReturnPath uses /workspace when next is missing", () => {
  assert.equal(safeReturnPath(null), "/workspace");
  assert.equal(safeReturnPath(undefined), "/workspace");
  assert.equal(safeReturnPath(""), "/workspace");
});

test("safeReturnPath allows same-origin relative paths", () => {
  assert.equal(safeReturnPath("/profile/setting"), "/profile/setting");
  assert.equal(
    safeReturnPath("/org/abc/providers"),
    "/org/abc/providers",
  );
});

test("safeReturnPath rejects open redirects", () => {
  assert.equal(safeReturnPath("https://evil.example"), "/workspace");
  assert.equal(safeReturnPath("//evil.example"), "/workspace");
  assert.equal(safeReturnPath("workspace"), "/workspace");
});
