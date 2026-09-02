import assert from "node:assert/strict";
import test from "node:test";

import { createIdleExitTracker } from "../src/lib/idle-exit.js";

test("idle-exit is disabled when idleExitMs is 0", () => {
  let now = 0;
  const idle = createIdleExitTracker(0, () => now);

  assert.equal(idle.isExpired(), false);
  now = 1_000_000;
  assert.equal(idle.isExpired(), false);
  assert.equal(idle.capBlockMs(5_000), 5_000);
});

test("idle-exit expires after idleExitMs with no reset", () => {
  let now = 100;
  const idle = createIdleExitTracker(1_000, () => now);

  assert.equal(idle.isExpired(), false);
  now = 1_099;
  assert.equal(idle.isExpired(), false);
  now = 1_100;
  assert.equal(idle.isExpired(), true);
});

test("reset moves the deadline to now + idleExitMs", () => {
  let now = 0;
  const idle = createIdleExitTracker(1_000, () => now);

  now = 800;
  idle.reset();
  now = 1_799;
  assert.equal(idle.isExpired(), false);
  now = 1_800;
  assert.equal(idle.isExpired(), true);
});

test("capBlockMs does not wait past the idle deadline", () => {
  let now = 0;
  const idle = createIdleExitTracker(1_000, () => now);

  assert.equal(idle.capBlockMs(5_000), 1_000);
  now = 700;
  assert.equal(idle.capBlockMs(5_000), 300);
  now = 1_000;
  assert.equal(idle.capBlockMs(5_000), 0);
});
