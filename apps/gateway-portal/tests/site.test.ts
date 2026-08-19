import test from "node:test";
import assert from "node:assert/strict";

import {
  getSiteUrl,
  privatePageMetadata,
  serializeJsonLd,
} from "@/lib/site";

test("getSiteUrl strips trailing slashes and falls back to localhost", () => {
  const previous = process.env.BETTER_AUTH_URL;
  process.env.BETTER_AUTH_URL = "https://gateway.example.com/";
  assert.equal(getSiteUrl(), "https://gateway.example.com");

  delete process.env.BETTER_AUTH_URL;
  assert.equal(getSiteUrl(), "http://localhost:3000");

  if (previous === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = previous;
  }
});

test("serializeJsonLd escapes opening angle brackets", () => {
  assert.equal(
    serializeJsonLd({ name: "<script>" }),
    '{"name":"\\u003cscript>"}',
  );
});

test("privatePageMetadata marks console pages as noindex", () => {
  const metadata = privatePageMetadata("Models", "Register model prices.");
  assert.equal(metadata.title, "Models");
  assert.deepEqual(metadata.robots, {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  });
});
