# 022 - Extract workspace shared layout

## Summary of changes

Created a shared `app/workspace/layout.tsx` so every route under `/workspace` now renders inside the same left-sidebar shell. Moved the sidebar UI into a reusable `WorkspaceSidebar` component, simplified the workspace overview page to render content only, and updated the providers page and loading states to rely on the shared layout instead of duplicating page-level containers.

## Files touched

- `app/workspace/layout.tsx`
- `app/workspace/page.tsx`
- `app/workspace/loading.tsx`
- `app/workspace/providers/page.tsx`
- `app/workspace/providers/loading.tsx`
- `components/workspace/workspace-sidebar.tsx`
- `tasks/ai/022-extract-workspace-shared-layout.md`

## How to verify

From `apps/gateway-portal`:

```bash
npx eslint app/workspace/layout.tsx app/workspace/page.tsx app/workspace/loading.tsx app/workspace/providers/page.tsx app/workspace/providers/loading.tsx components/workspace/workspace-sidebar.tsx
npm run build
```

Verification notes:

- The ESLint command passes.
- `npm run build` is still blocked by the existing `/sign-in` Suspense issue: `useSearchParams() should be wrapped in a suspense boundary at page "/sign-in"`.

## Follow-ups / next steps

- Migrate future workspace routes such as analytics, guardrails, and child keys into `app/workspace/*` so they inherit the shared shell automatically.
- Consider extracting the sidebar navigation config into a shared constants file if those destinations keep growing.
- Fix the `/sign-in` Suspense issue so the portal can complete a full production build.
