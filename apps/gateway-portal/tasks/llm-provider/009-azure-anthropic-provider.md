# 009 — Azure Anthropic-compatible built-in provider

## Summary

Azure is now also listed as an Anthropic-compatible built-in preset. Selecting it fills the name `azure` and the Azure AI Foundry template `https://<resource>.services.ai.azure.com/anthropic`. Switching compatibility type between openai and anthropic while Azure is selected updates the URL to the matching template.

The add/edit form hint now covers both Azure placeholders (`<resources>` for OpenAI, `<resource>` for Anthropic).

## Files touched

- `lib/llm-provider/built-in.ts` — add `azure` Anthropic-format preset
- `components/llm-providers/provider-form-modal.tsx` — Azure URL placeholder/hint for both formats
- `tests/llm-provider/built-in.test.ts` — cover both Azure formats

## How to verify

1. `node --import tsx --test tests/llm-provider/**/*.test.ts`
2. Open an org Providers page and click **Add provider**
3. Set compatibility type to **anthropic**, pick **azure**
4. Confirm name is `azure` and the URL is `https://<resource>.services.ai.azure.com/anthropic`
5. Switch compatibility type to **openai** and confirm the URL changes to `https://<resources>.services.ai.azure.com/openai/v1`

## Follow-ups / next steps

- None
