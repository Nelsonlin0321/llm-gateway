# 003 — Colorful built-in provider icons

## Summary

Built-in provider marks now prefer the Lobe Icons color SVG (`{id}-color.svg`) when that variant exists. Brands that only ship a mono mark still use the mono file, and the image falls back to mono if a color asset fails to load.

## Files touched

- `lib/llm-provider/icons.ts` — color-capable id set and variant URL helper
- `components/llm-providers/built-in-provider-icon.tsx` — load color first, fall back to mono
- `components/llm-providers/built-in-provider-select.tsx` — remount icon on name change
- `tests/llm-provider/built-in.test.ts`

## How to verify

1. `node --import tsx --test tests/llm-provider/**/*.test.ts`
2. Open **Add provider** and expand **Built-in provider**
3. Confirm color marks for brands such as DeepSeek, Google, Mistral, and OpenRouter
4. Confirm mono-only brands such as OpenAI and Anthropic still render

## Follow-ups / next steps

- Avatar-style brand-color badges for logos that have no color SVG
