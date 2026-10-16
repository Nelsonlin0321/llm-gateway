# 010 — Models link includes the provider query

## Summary

Each provider row’s Models link now opens that provider’s models:

`/org/[organizationId]/models?provider={providerId}`

The models page already reads `provider` and applies it as the provider filter.

## Files touched

- `components/llm-providers/provider-management-client.tsx` — per-provider Models href

## How to verify

1. Open an organization Providers page.
2. Click **Models** on a provider row.
3. Confirm the URL is `/org/{organizationId}/models?provider={providerId}` and the provider filter is that provider.

## Follow-ups / next steps

- None
