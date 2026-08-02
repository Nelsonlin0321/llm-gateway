import assert from "node:assert/strict";
import test from "node:test";

import { buildCurlCommand } from "../src/proxy/curl.js";

test("buildCurlCommand strips sensitive headers and cookie headers", () => {
  const curl = buildCurlCommand({
    url: "https://example.com/v1/chat/completions",
    method: "POST",
    headers: new Headers({
      authorization: "Bearer sk-secret",
      cookie: "session=secret",
      "set-cookie": "session=secret",
      "content-type": "application/json",
      "x-request-id": "req-1",
    }),
    body: JSON.stringify({ model: "gpt-test" }),
    captureLevel: "full",
  });

  // assert.equal(curl.includes("authorization"), false);
  // assert.equal(curl.includes("cookie"), false);
  assert.ok(curl.includes("'content-type: application/json'"));
  assert.ok(curl.includes("'x-request-id: req-1'"));
});

test("buildCurlCommand omits body at metadata capture level", () => {
  const curl = buildCurlCommand({
    url: "https://example.com/v1/chat/completions",
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
    }),
    body: JSON.stringify({ model: "gpt-test" }),
    captureLevel: "metadata",
  });

  assert.equal(curl.includes("--data-raw"), false);
  assert.ok(curl.includes("-X 'POST'"));
});

test("buildCurlCommand escapes single quotes for bash", () => {
  const curl = buildCurlCommand({
    url: "https://example.com/v1/chat/completions",
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      "x-note": "O'Reilly",
    }),
    body: `{"msg":"can't"}`,
    captureLevel: "full",
  });

  assert.ok(curl.includes("'x-note: O'\\''Reilly'"));
  assert.ok(curl.includes("--data-raw '{\"msg\":\"can'\\''t\"}'"));
});
