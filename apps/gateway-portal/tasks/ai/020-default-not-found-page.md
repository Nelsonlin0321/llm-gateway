# 020 — Default not-found page

## Summary of changes

Added a root App Router `not-found` page aligned with the OpenRouter portal design language already used on the home and workspace surfaces.

- Status chips use mono/error badge treatment (`HTTP 404`, `/not-found`)
- Primary card explains the missing route in operator voice
- CTAs: **Back to home** and **Launch portal**
- Side card lists known active routes (home, providers, sign-in)

Renders inside the root layout, so the existing portal header remains visible.

## Files touched

- `app/not-found.tsx` (new)
- `tasks/ai/020-default-not-found-page.md` (this log)

## How to verify

```bash
cd apps/gateway-portal
npm run lint
npm run dev
```

Manual:

1. Visit a missing path (e.g. `http://localhost:3000/this-does-not-exist`)
2. Confirm 404 UI matches portal surfaces (cards, badges, accent buttons)
3. Confirm header still appears and links navigate correctly

## Follow-ups / next steps

- Optionally add `global-not-found.tsx` if multi-root layouts are introduced later
- Call `notFound()` from dynamic workspace routes when a resource ID is invalid
