# 002 — Loading page for `/workspace`

## Summary

Added a `loading.tsx` for `/workspace` so the redirect hop to `/org/[organizationId]` shows the same overview skeleton as the destination page (page header + KPI/usage/control-area placeholders). Extra page padding matches the workspace main column because this route sits outside the `(workspace)` layout.

## Files touched

- `app/workspace/loading.tsx`

## How to verify

1. `npx eslint app/workspace/loading.tsx`
2. `npm run dev`
3. Navigate to `/workspace` (hard refresh or a cold signed-in visit). Confirm the overview skeleton appears before the redirect to `/org/{organizationId}`.

## Follow-ups / next steps

- None.
