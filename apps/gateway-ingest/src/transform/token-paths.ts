/**
 * Dot-path lists used to pull token counts from provider response JSON.
 * First matching finite number wins — extend these arrays for new providers.
 */

/** Raw prompt/input token total (includes cached portion for most OpenAI-style APIs). */
export const INPUT_TOKEN_PATHS = [
  "usage.prompt_tokens",
  "usage.input_tokens",
] as const;

/** Completion / output tokens. */
export const OUTPUT_TOKEN_PATHS = [
  "usage.completion_tokens",
  "usage.output_tokens",
] as const;

/** Cached / cache-related input tokens. */
export const CACHED_INPUT_TOKEN_PATHS = [
  "usage.prompt_tokens_details.cached_tokens",
  "usage.cache_creation_input_tokens",
] as const;

/**
 * How many trailing SSE data chunks to scan for usage (from the end).
 * Providers usually put usage on the last 1–2 chunks.
 */
export const STREAM_USAGE_LOOKBACK = 5;
