## Summary

Changed provider deletion to permanently remove the database record instead of marking it inactive, and updated the portal copy so the destructive action is described accurately.

## Changes

- Updated `app/server-actions/llm-provider/delete-provider.ts` to use `prisma.lLMProvider.delete(...)` with the existing selected fields for the response payload.
- Updated `components/llm-providers/provider-management-client.tsx` so the inactive metric no longer references soft deletion.
- Reworded the delete confirmation dialog to make it clear that provider deletion is permanent and cannot be undone.

## Verification

- Run `./node_modules/.bin/eslint app/server-actions/llm-provider/delete-provider.ts components/llm-providers/provider-management-client.tsx`
