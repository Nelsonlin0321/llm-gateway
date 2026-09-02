import test from "node:test";
import assert from "node:assert/strict";

import { highlightDocsCode } from "@/lib/docs/highlight";

function spanColors(html: string): string[] {
  return [...html.matchAll(/style="color:([^"]+)"/g)].map((match) => match[1]);
}

test("highlights shell, json, typescript, and python", async () => {
  const shell = await highlightDocsCode(
    'curl -s "$NEXT_PUBLIC_PROXY_API_URL/health"',
    "shell",
  );
  const json = await highlightDocsCode(
    '{ "model": "deepseek/chat", "stream": false }',
    "json",
  );
  const ts = await highlightDocsCode(
    'const client = new OpenAI({ apiKey: "sk_test" });',
    "typescript",
  );
  const py = await highlightDocsCode(
    'from openai import OpenAI\nclient = OpenAI(api_key="sk_test")',
    "python",
  );

  for (const html of [shell, json, ts, py]) {
    assert.match(html, /class="shiki/);
    assert.ok(spanColors(html).length > 1);
  }

  assert.match(shell, /curl/);
  assert.match(json, /model/);
  assert.match(ts, /const/);
  assert.match(py, /from/);

  const jsonColors = new Set(spanColors(json));
  assert.ok(
    jsonColors.size >= 2,
    "JSON keys and strings should use more than one color",
  );
});
