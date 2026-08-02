# 052 — Enterprise console UI redesign

## Summary

Repositioned the portal UI from marketing-heavy OpenRouter demo chrome to a denser enterprise control-plane console suitable for B2B customers.

### Design system
- Dark tokens shifted to solid enterprise surfaces (`#07090c` / `#0d1015`) instead of translucent film slabs
- Accent refined to a calmer violet (`#7c3aed`); base type size 14px for product density
- Added reusable `PageHeader` for product pages

### App shell
- Sticky top bar with compact brand + auth (name + avatar)
- Full-height left sidebar (not a nested card) with section labels, disabled “Soon” items, and sticky scroll
- Workspace content constrained to `max-w-[1400px]`

### Product pages
- Removed large marketing heroes / mono path badges from Providers, Child Keys, Models
- Compact page headers with eyebrow + title + short description + back action
- Denser metric strips and table-style list rows for providers, models, and keys
- Destructive actions as quiet ghost buttons to reduce visual noise

### Marketing / auth
- Landing page simplified to enterprise B2B: clear claim, trust strip, capability grid, CTA
- Auth shell centered, brand mark, single card form layout

## Files touched

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/workspace/layout.tsx`
- `app/workspace/page.tsx`
- `app/workspace/providers/page.tsx`
- `app/workspace/child-keys/page.tsx`
- `app/workspace/[providerId]/models/page.tsx`
- `components/portal-header.tsx`
- `components/portal-header-auth.tsx`
- `components/workspace/workspace-sidebar.tsx`
- `components/auth/auth-shell.tsx`
- `components/ui/page-header.tsx` (new)
- `components/ui/card.tsx`
- `components/llm-providers/provider-management-client.tsx`
- `components/child-keys/child-key-management-client.tsx`
- `components/models/model-management-client.tsx`

## How to verify

```bash
cd apps/gateway-portal
npx tsc --noEmit
npm run dev
```

Visually check:
1. `/` — restrained enterprise landing
2. `/sign-in` — centered auth card
3. `/workspace` — app shell with sticky sidebar + overview
4. `/workspace/providers`, `/workspace/child-keys`, models — compact headers + dense lists

## Follow-ups / next steps

- Wire real overview metrics instead of preview charts
- Add breadcrumbs for nested model pages
- Optional mobile drawer for sidebar instead of stacked top nav
- Align light-mode tokens if light mode becomes a first-class product surface
