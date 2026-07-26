# 016 - Align gateway portal UI to openrouter-design

## Summary

Refactored `apps/gateway-portal` so the Next.js app follows the **openrouter-design** skill: dark Ink canvas (`#03080A`), Cloud type, Grape Accent (`#7624F4`) primaries, film surfaces, 6px controls / 8px cards, Plus Jakarta Sans + Geist Mono. Removed Framer blue-stage tokens (Outfit/Inter/IBM Plex Mono, electric blue, large radii, mesh glow background).

## Design mapping

| Concern | Before (Framer) | After (OpenRouter) |
|---------|-----------------|--------------------|
| Fonts | Outfit + Inter + IBM Plex Mono | Plus Jakarta Sans + Geist Mono |
| Dark bg | `#050608` solid zinc stack | `#03080A` Ink + Cloud film surfaces |
| Accent | `#0A84FF` blue | `#7624F4` Grape Accent |
| Control radius | ~12–16px (`rounded-xl`) | 6px (`rounded-md`) |
| Card radius | ~16–24px | 8px (`rounded-lg`) |
| Elevation | Drop shadows on cards | Flat border + film (dark) |
| Body bg | Accent radial glow | Flat (no mesh) |

## Files touched

- `app/globals.css` - full token rewrite
- `app/layout.tsx` - font loading
- `app/page.tsx` - copy + surface/radius cleanup
- `app/dashboard/page.tsx` - surface/radius cleanup
- `app/providers/page.tsx` - surface/radius cleanup
- `app/providers/loading.tsx` - radius cleanup
- `components/portal-header.tsx` - compact OR nav chrome
- `components/auth/auth-shell.tsx` - OR typography + shell
- `components/auth/sign-in-form.tsx` - input tokens
- `components/auth/sign-up-form.tsx` - input tokens
- `components/ui/button.tsx` - Accent primary, 6px radius
- `components/ui/card.tsx` - 8px, border, no shadow
- `components/ui/badge.tsx` - 4px chips, status colors
- `components/ui/alert-dialog.tsx` - 12px modal, ink backdrop
- `components/providers/react-hot-toast.tsx` - dark toast chrome
- `components/llm-providers/provider-form-modal.tsx` - modal + inputs
- `components/llm-providers/provider-management-client.tsx` - list density
- `components/llm-providers/provider-management-skeleton.tsx` - types + radii
- `tasks/ai/016-align-portal-to-openrouter-design.md` - this log

## How to verify

```bash
cd apps/gateway-portal
npm run build
npm run dev
# Open http://localhost:3000 — dark Ink page, Grape CTAs, no blue glow
```

Build result: **success** (TypeScript + static generation).

## Follow-ups

- Optional light-mode toggle (tokens already defined for light).
- Email templates still reference Outfit/Inter - align if branded mail is required.
- Future pages (`/keys`, `/pricing`, etc.) should reuse the same primitives.
