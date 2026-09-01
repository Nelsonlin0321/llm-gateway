# 007 — Show brand icons on the configured providers list

## Summary

The add-provider dropdown already rendered Lobe Icons brand marks. The configured providers list on `/org/{id}/providers` only showed the name, so rows were harder to scan.

Each list row now shows the same `BuiltInProviderIcon` next to the provider name. Unknown or custom names still fall back to the first-letter mark.

## Files touched

- `components/llm-providers/provider-management-client.tsx` — icon beside each provider name
- `components/llm-providers/provider-management-skeleton.tsx` — matching icon placeholder

## How to verify

```bash
cd apps/gateway-portal
npx eslint components/llm-providers/provider-management-client.tsx components/llm-providers/provider-management-skeleton.tsx
```

Manual:

1. Sign in and open `/org/{id}/providers`.
2. Confirm each configured provider shows its brand mark (or a letter fallback) to the left of the name.
3. Confirm OpenAI / x-ai / Groq marks stay visible on the dark console.
4. Confirm a custom-named provider still shows the first-letter fallback.

## Follow-ups / next steps

- Reuse the same mark next to provider names on the models list.
