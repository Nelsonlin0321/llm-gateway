import {
  CACHED_INPUT_TOKEN_PATHS,
  INPUT_TOKEN_PATHS,
  OUTPUT_TOKEN_PATHS,
  STREAM_USAGE_LOOKBACK,
} from "./token-paths";

export type TokenUsage = {
  inputToken: number;
  outputToken: number;
  cachedInputToken: number;
  totalToken: number;
};

export type TokenPrices = {
  inputPrice: number;
  outputPrice: number;
  inputCachePrice: number;
};

export const ZERO_TOKEN_USAGE: TokenUsage = {
  inputToken: 0,
  outputToken: 0,
  cachedInputToken: 0,
  totalToken: 0,
};

/**
 * Resolve a dotted path on a plain object (`"usage.prompt_tokens"`).
 */
export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== "object") {
    return undefined;
  }

  let current: unknown = obj;
  for (const part of path.split(".")) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Return the first finite number found at any of the given paths.
 */
export function firstNumber(
  obj: unknown,
  paths: readonly string[],
): number | undefined {
  for (const path of paths) {
    const value = getByPath(obj, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Parse SSE / JSONL transcript into JSON objects from `data:` lines.
 * Skips `[DONE]`, empty payloads, and malformed JSON.
 */
export function parseSseDataObjects(streamText: string): unknown[] {
  const objects: unknown[] = [];

  for (const line of streamText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }
    const payload = trimmed.slice("data:".length).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    try {
      objects.push(JSON.parse(payload));
    } catch {
      // ignore non-JSON data lines
    }
  }

  return objects;
}

type RawCounts = {
  rawInput: number | undefined;
  output: number | undefined;
  cached: number | undefined;
};

/**
 * Pull raw token fields from one JSON object using the configured paths.
 * Returns null when none of the token paths resolve.
 */
export function extractRawCounts(obj: unknown): RawCounts | null {
  const rawInput = firstNumber(obj, INPUT_TOKEN_PATHS);
  const output = firstNumber(obj, OUTPUT_TOKEN_PATHS);
  const cached = firstNumber(obj, CACHED_INPUT_TOKEN_PATHS);

  if (rawInput === undefined && output === undefined && cached === undefined) {
    return null;
  }

  return { rawInput, output, cached };
}

/**
 * Normalize raw provider counts into DB token columns.
 *
 * - cachedInputToken: first matching cache path (else 0)
 * - inputToken: (prompt/input tokens) − cachedInputToken, floored at 0
 * - outputToken: completion/output tokens (else 0)
 * - totalToken: cached + input + output
 */
export function normalizeTokenUsage(raw: RawCounts): TokenUsage {
  const cachedInputToken = raw.cached ?? 0;
  const rawInput = raw.rawInput ?? 0;
  const inputToken = Math.max(0, rawInput - cachedInputToken);
  const outputToken = raw.output ?? 0;
  const totalToken = cachedInputToken + inputToken + outputToken;

  return {
    inputToken,
    outputToken,
    cachedInputToken,
    totalToken,
  };
}

/**
 * Scan the last N SSE data objects (from the end) for token usage.
 */
export function extractTokensFromStream(
  streamText: string,
  lookback: number = STREAM_USAGE_LOOKBACK,
): TokenUsage {
  const objects = parseSseDataObjects(streamText);
  if (objects.length === 0) {
    return ZERO_TOKEN_USAGE;
  }

  const start = Math.max(0, objects.length - lookback);
  for (let i = objects.length - 1; i >= start; i--) {
    const raw = extractRawCounts(objects[i]);
    if (raw) {
      return normalizeTokenUsage(raw);
    }
  }

  return ZERO_TOKEN_USAGE;
}

/**
 * Extract token usage from a non-stream JSON body string.
 */
export function extractTokensFromJsonBody(body: string): TokenUsage {
  try {
    const parsed: unknown = JSON.parse(body);
    const raw = extractRawCounts(parsed);
    if (!raw) {
      return ZERO_TOKEN_USAGE;
    }
    return normalizeTokenUsage(raw);
  } catch {
    return ZERO_TOKEN_USAGE;
  }
}

/**
 * Extract tokens from either stream transcript or non-stream JSON body.
 */
export function extractTokenUsage(input: {
  isStream: boolean;
  responseStreamText?: string;
  responsePayloadJson?: string;
}): TokenUsage {
  if (input.isStream) {
    const text = input.responseStreamText;
    if (!text) {
      return ZERO_TOKEN_USAGE;
    }
    return extractTokensFromStream(text);
  }

  const body = input.responsePayloadJson;
  if (!body) {
    return ZERO_TOKEN_USAGE;
  }
  return extractTokensFromJsonBody(body);
}

/**
 * cost = cached/1M * cachePrice + input/1M * inputPrice + output/1M * outputPrice
 */
export function calculateCost(tokens: TokenUsage, prices: TokenPrices): number {
  const perMillion = 1_000_000;
  const cost =
    (tokens.cachedInputToken / perMillion) * prices.inputCachePrice +
    (tokens.inputToken / perMillion) * prices.inputPrice +
    (tokens.outputToken / perMillion) * prices.outputPrice;

  return Number.isFinite(cost) ? cost : 0;
}
