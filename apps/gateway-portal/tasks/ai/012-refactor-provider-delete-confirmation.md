## Summary

Replaced the provider deletion `window.confirm` prompt with a Shadcn-style `AlertDialog` confirmation flow so destructive actions use the same in-app UI patterns as the rest of the portal.

## Changes

- Added a shared `components/ui/alert-dialog.tsx` wrapper built on top of `@base-ui/react/alert-dialog` and the portal's existing button styling utilities.
- Updated `components/llm-providers/provider-management-client.tsx` to track the provider pending deletion in component state.
- Replaced the native browser confirmation with a controlled `AlertDialog` that explains the soft-delete behavior before confirming.
- Kept the async delete state wired to the selected provider so the delete action remains disabled while the request is in flight.

## Verification

- Run `./node_modules/.bin/eslint components/ui/alert-dialog.tsx components/llm-providers/provider-management-client.tsx`
