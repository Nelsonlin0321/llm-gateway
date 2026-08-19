# 002 — Built-in provider preset dropdown

## Summary

The add/edit provider form now starts with compatibility type. A built-in provider dropdown is filtered by that type (`apiFormat`) and fills the provider name and API URL from `lib/llm-provider/built-in.ts`. Brand marks are resolved from the Lobe Icons SVG CDN via `lib/llm-provider/icons.ts`.

Switching compatibility keeps a matching preset when the same name exists in the other format (for example DeepSeek OpenAI → DeepSeek Anthropic) and updates the API URL.

## Files touched

- `lib/llm-provider/built-in.ts` — export catalog and `apiFormat` helpers
- `lib/llm-provider/icons.ts` — slug → Lobe Icons asset mapping
- `components/llm-providers/provider-form-modal.tsx` — first-row compatibility + auto-fill
- `components/llm-providers/built-in-provider-select.tsx` — dropdown
- `components/llm-providers/built-in-provider-icon.tsx` — brand mark
- `tests/llm-provider/built-in.test.ts`

## How to verify

1. `node --import tsx --test tests/llm-provider/**/*.test.ts`
2. Open an org Providers page and click **Add provider**
3. Confirm compatibility type is on the first row
4. Open the built-in dropdown, pick a provider, and confirm name + API URL fill
5. Switch compatibility type and confirm the dropdown list changes to matching `apiFormat` entries
6. For a dual-format name such as `deepseek`, confirm the URL updates to the other format

## Follow-ups / next steps

- Show the same brand marks on the configured providers list
- Add a typeahead filter if the OpenAI-compatible list keeps growing
