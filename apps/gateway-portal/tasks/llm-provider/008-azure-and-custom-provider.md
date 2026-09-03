# 008 — Azure built-in provider and custom entry

## Summary

The add/edit provider form now includes Azure as an OpenAI-compatible built-in preset. Its API URL is the Azure AI Foundry template `https://<resources>.services.ai.azure.com/openai/v1`, which the user must customize with their resource name.

The built-in dropdown also has a **Custom** option (the default). Choosing Custom leaves name and URL empty so the user can type their own provider instead of picking a preset. Switching from a preset to Custom clears the auto-filled fields; clicking Custom when already custom does not wipe values the user has typed.

## Files touched

- `lib/llm-provider/built-in.ts` — add `azure` OpenAI-format preset
- `lib/llm-provider/icons.ts` — Azure Lobe Icons mapping (color SVG)
- `components/llm-providers/built-in-provider-select.tsx` — Custom option
- `components/llm-providers/provider-form-modal.tsx` — custom clear behavior and Azure URL hint
- `tests/llm-provider/built-in.test.ts` — Azure catalog coverage

## How to verify

1. `node --import tsx --test tests/llm-provider/**/*.test.ts`
2. Open an org Providers page and click **Add provider**
3. Confirm the built-in dropdown defaults to **Custom** and name/URL stay empty for typing
4. Pick **azure**, confirm name is `azure` and the URL is `https://<resources>.services.ai.azure.com/openai/v1`
5. Replace `<resources>` with a real resource name and confirm the hint disappears
6. Switch back to **Custom** and confirm name/URL clear so a custom provider can be entered

## Follow-ups / next steps

- None
