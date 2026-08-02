import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatMetricValue,
  formatShare,
  humanizeKey,
  niceAxisTicks,
} from "../../lib/analytics/format";
import { resolveDateRange } from "../../lib/analytics/service";

describe("analytics format helpers", () => {
  it("formats cost as currency", () => {
    assert.equal(formatMetricValue("cost", 12.5), "$12.50");
  });

  it("formats request counts without decimals", () => {
    assert.equal(formatMetricValue("requestCount", 1024), "1,024");
  });

  it("formats share percentages", () => {
    assert.equal(formatShare(0.5), "50.0%");
    assert.equal(formatShare(0), "0%");
  });

  it("humanizes dimension keys", () => {
    assert.equal(humanizeKey("user_name"), "User");
    assert.equal(humanizeKey("requestedModel"), "Model");
    assert.equal(humanizeKey("department"), "Department");
  });

  it("builds nice axis ticks covering the max", () => {
    const ticks = niceAxisTicks(874, 5);
    assert.equal(ticks[0], 0);
    assert.ok((ticks[ticks.length - 1] ?? 0) >= 874);
  });
});

describe("resolveDateRange", () => {
  it("resolves last 7 days ending on the anchor date", () => {
    const range = resolveDateRange({ datePreset: "7d" }, "2026-08-01");
    assert.equal(range.from, "2026-07-26");
    assert.equal(range.to, "2026-08-01");
    assert.equal(range.preset, "7d");
  });

  it("respects custom ranges", () => {
    const range = resolveDateRange({
      datePreset: "custom",
      from: "2026-06-01",
      to: "2026-06-15",
    });
    assert.equal(range.from, "2026-06-01");
    assert.equal(range.to, "2026-06-15");
  });
});
