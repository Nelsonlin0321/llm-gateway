# 006 — White fill for black provider icons

## Summary

OpenAI, xAI (`x-ai`), and Groq use Lobe Icons mono SVGs with `fill="currentColor"`. Loaded as `<img>`, that fill is black, so the marks disappeared on the dark console.

Those three icons now invert to white. Colorful marks (DeepSeek, Google, etc.) are unchanged.

## Files touched

- `lib/llm-provider/icons.ts` — `lightFillIconIds` / `builtInProviderIconUsesLightFill`
- `components/llm-providers/built-in-provider-icon.tsx` — apply `invert` for those ids
- `tests/llm-provider/built-in.test.ts`

## How to verify

```bash
cd apps/gateway-portal
node --import tsx --test tests/llm-provider/built-in.test.ts
```

Manual: open **Add provider**, expand **Built-in provider**, and confirm OpenAI, x-ai, and Groq logos are white on the dark dropdown.

## Follow-ups / next steps

- Other currentColor mono marks (Anthropic, GitHub, Vercel, Ollama) may need the same treatment if they also disappear.
