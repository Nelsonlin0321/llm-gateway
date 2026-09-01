import assert from "node:assert/strict";
import test from "node:test";

import { loadGatewayConfig } from "../src/lib/config.js";

test("loadGatewayConfig skips secret checks in test env", () => {
  const config = loadGatewayConfig({
    NODE_ENV: "test",
    PORT: "9090",
    CHILD_KEY_RATE_LIMIT_RPM: "120",
  });
  assert.equal(config.port, 9090);
  assert.equal(config.defaultRateLimitRpm, 120);
  assert.equal(config.requestBodyLimitBytes, 1_048_576);
});

test("loadGatewayConfig requires secrets outside test", () => {
  assert.throws(
    () =>
      loadGatewayConfig({
        NODE_ENV: "production",
      }),
    /DATABASE_URL is required/,
  );
});
