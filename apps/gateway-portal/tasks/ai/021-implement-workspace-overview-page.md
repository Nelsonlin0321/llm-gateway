# 021 - Implement workspace overview page

## Summary of changes

Created the authenticated `/workspace` overview page with an OpenRouter-style dark control-plane layout based on the provided reference image. The page now includes a left workspace navigation rail, workspace summary header, static usage cards, and quick-access tiles for providers, analytics, guardrails, child keys, routing, and budgets. Added a matching `loading.tsx` skeleton for the new route.

## Files touched

- `app/workspace/page.tsx`
- `app/workspace/loading.tsx`
- `tasks/ai/021-implement-workspace-overview-page.md`

## How to verify

From `apps/gateway-portal`:

```bash
npx eslint app/workspace/page.tsx app/workspace/loading.tsx
npm run build
```

Verification notes:

- `npx eslint app/workspace/page.tsx app/workspace/loading.tsx` passes.
- `npm run build` is still blocked by a pre-existing `/sign-in` issue: `useSearchParams() should be wrapped in a suspense boundary at page "/sign-in"`.

## Follow-ups / next steps

- Extract the workspace sidebar into a shared layout if `/workspace/providers` and future workspace routes should reuse the same chrome.
- Replace the placeholder metrics and preview links with real backend-backed data once the workspace domain model is ready.
- Fix the existing `/sign-in` Suspense issue so the portal can pass a full production build again.
