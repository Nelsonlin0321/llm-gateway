import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  calculateCost,
  extractRawCounts,
  extractTokenUsage,
  extractTokensFromJsonBody,
  extractTokensFromStream,
  firstNumber,
  getByPath,
  normalizeTokenUsage,
  parseSseDataObjects,
  ZERO_TOKEN_USAGE,
} from "../src/transform/tokens.js";

const samplesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../gateway-api/scripts/response",
);

function readSample(name: string): string {
  return readFileSync(join(samplesDir, name), "utf8");
}

test("getByPath walks nested objects", () => {
  const obj = { usage: { prompt_tokens: 10, prompt_tokens_details: { cached_tokens: 3 } } };
  assert.equal(getByPath(obj, "usage.prompt_tokens"), 10);
  assert.equal(getByPath(obj, "usage.prompt_tokens_details.cached_tokens"), 3);
  assert.equal(getByPath(obj, "usage.missing"), undefined);
  assert.equal(getByPath(null, "usage.prompt_tokens"), undefined);
});

test("firstNumber uses first matching path", () => {
  const obj = { usage: { prompt_tokens: 20, input_tokens: 99 } };
  assert.equal(
    firstNumber(obj, ["usage.prompt_tokens", "usage.input_tokens"]),
    20,
  );
  assert.equal(
    firstNumber(obj, ["usage.input_tokens", "usage.prompt_tokens"]),
    99,
  );
  assert.equal(firstNumber(obj, ["usage.nope"]), undefined);
});

test("normalizeTokenUsage subtracts cached from input", () => {
  assert.deepEqual(
    normalizeTokenUsage({ rawInput: 100, cached: 40, output: 10 }),
    {
      inputToken: 60,
      outputToken: 10,
      cachedInputToken: 40,
      totalToken: 110,
    },
  );
  assert.deepEqual(
    normalizeTokenUsage({ rawInput: 5, cached: 10, output: undefined }),
    {
      inputToken: 0,
      outputToken: 0,
      cachedInputToken: 10,
      totalToken: 10,
    },
  );
});

test("calculateCost uses per-1M prices", () => {
  const cost = calculateCost(
    {
      inputToken: 1_000_000,
      outputToken: 500_000,
      cachedInputToken: 250_000,
      totalToken: 1_750_000,
    },
    { inputPrice: 1, outputPrice: 2, inputCachePrice: 0.4 },
  );
  // 0.25*0.4 + 1*1 + 0.5*2 = 0.1 + 1 + 1 = 2.1
  assert.equal(cost, 2.1);
});

test("extractTokensFromJsonBody — OpenAI-style", () => {
  const body = JSON.stringify({
    usage: {
      prompt_tokens: 100,
      completion_tokens: 20,
      prompt_tokens_details: { cached_tokens: 30 },
    },
  });
  assert.deepEqual(extractTokensFromJsonBody(body), {
    inputToken: 70,
    outputToken: 20,
    cachedInputToken: 30,
    totalToken: 120,
  });
});

test("extractTokensFromJsonBody — Anthropic-style", () => {
  const body = JSON.stringify({
    usage: {
      input_tokens: 108,
      output_tokens: 33,
      cache_creation_input_tokens: 0,
    },
  });
  assert.deepEqual(extractTokensFromJsonBody(body), {
    inputToken: 108,
    outputToken: 33,
    cachedInputToken: 0,
    totalToken: 141,
  });
});

test("extractTokensFromJsonBody returns zeros on bad JSON", () => {
  assert.deepEqual(extractTokensFromJsonBody("not-json"), ZERO_TOKEN_USAGE);
});

test("parseSseDataObjects skips DONE and non-data lines", () => {
  const text = [
    "event: message",
    'data: {"usage":{"prompt_tokens":1,"completion_tokens":2}}',
    "data: [DONE]",
    "data: not-json",
    "",
  ].join("\n");
  const objects = parseSseDataObjects(text);
  assert.equal(objects.length, 1);
  assert.deepEqual(extractRawCounts(objects[0]), {
    rawInput: 1,
    output: 2,
    cached: undefined,
  });
});

test("extractTokensFromStream finds usage in last chunks", () => {
  const stream = [
    'data: {"choices":[{"delta":{"content":"Hi"}}],"usage":null}',
    'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":null}',
    'data: {"choices":[],"usage":{"prompt_tokens":23,"completion_tokens":11,"prompt_tokens_details":{"cached_tokens":0}}}',
    "data: [DONE]",
  ].join("\n");

  assert.deepEqual(extractTokensFromStream(stream), {
    inputToken: 23,
    outputToken: 11,
    cachedInputToken: 0,
    totalToken: 34,
  });
});

test("extractTokenUsage routes stream vs non-stream", () => {
  const stream = extractTokenUsage({
    isStream: true,
    responseStreamText:
      'data: {"usage":{"prompt_tokens":10,"completion_tokens":2}}\ndata: [DONE]\n',
  });
  assert.equal(stream.inputToken, 10);
  assert.equal(stream.outputToken, 2);

  const json = extractTokenUsage({
    isStream: false,
    responsePayloadJson: JSON.stringify({
      usage: { prompt_tokens: 5, completion_tokens: 1 },
    }),
  });
  assert.equal(json.inputToken, 5);
  assert.equal(json.outputToken, 1);
});

test("sample: openai azure gpt stream", () => {
  const text = readSample("openai-chat-completions-azure-gpt-5.4-mini.jsonl");
  const usage = extractTokensFromStream(text);
  assert.equal(usage.inputToken, 23);
  assert.equal(usage.outputToken, 11);
  assert.equal(usage.cachedInputToken, 0);
  assert.equal(usage.totalToken, 34);
});

test("sample: openai azure gpt non-stream", () => {
  const text = readSample("openai-chat-completions-azure-gpt-5.4-mini.json");
  const usage = extractTokensFromJsonBody(text);
  assert.equal(usage.inputToken, 23);
  assert.equal(usage.outputToken, 13);
  assert.equal(usage.cachedInputToken, 0);
});

test("sample: anthropic deepseek stream uses last message_delta usage", () => {
  const text = readSample(
    "anthropic-v1-messages-deepseek-deepseek-v4-flash.jsonl",
  );
  const usage = extractTokensFromStream(text);
  assert.equal(usage.inputToken, 108);
  assert.equal(usage.outputToken, 39);
  assert.equal(usage.cachedInputToken, 0);
  assert.equal(usage.totalToken, 147);
});

test("sample: anthropic deepseek non-stream", () => {
  const text = readSample(
    "anthropic-v1-messages-deepseek-deepseek-v4-flash.json",
  );
  const usage = extractTokensFromJsonBody(text);
  assert.equal(usage.inputToken, 108);
  assert.equal(usage.outputToken, 33);
  assert.equal(usage.cachedInputToken, 0);
});

test("sample: minimax openai stream with cached tokens", () => {
  const text = readSample("openai-chat-completions-minimax-minimax-m3.jsonl");
  const usage = extractTokensFromStream(text);
  // prompt_tokens 183, cached 128 → input 55, output 27
  assert.equal(usage.cachedInputToken, 128);
  assert.equal(usage.inputToken, 55);
  assert.equal(usage.outputToken, 27);
  assert.equal(usage.totalToken, 210);
});

test("sample: openrouter grok stream with cached tokens", () => {
  const text = readSample(
    "openai-chat-completions-openrouter-grok-4.5.jsonl",
  );
  const usage = extractTokensFromStream(text);
  assert.equal(usage.cachedInputToken, 128);
  assert.equal(usage.inputToken, 94); // 222 - 128
  assert.equal(usage.outputToken, 31);
  assert.equal(usage.totalToken, 253);
});
