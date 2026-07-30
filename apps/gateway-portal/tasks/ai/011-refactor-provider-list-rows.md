## Summary

Refactored the provider management list to present each configured provider as a compact row instead of an individual card and removed the redundant stored-key and routing-status detail chips.

## Changes

- Reworked `components/llm-providers/provider-management-client.tsx` so configured providers render inside a single bordered list with one responsive row per provider.
- Kept the provider name, compatibility badge, activity badge, API URL, and last-updated metadata visible in the new row layout.
- Preserved the edit and delete actions while simplifying the visual hierarchy.
- Removed the unused detail-chip helper and related icon imports after dropping the `Stored key` and `Routing status` fields.

## Verification

- Run `npx eslint apps/gateway-portal/components/llm-providers/provider-management-client.tsx`
