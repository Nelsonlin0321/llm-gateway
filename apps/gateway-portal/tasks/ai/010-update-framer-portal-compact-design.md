## Summary

Updated the shared `framer-design` skill to better support compact control-plane interfaces and applied that tighter design language across the `gateway-portal` shared UI primitives and key authenticated screens.

## Changes

- Added compact gateway portal guidance to `.agents/skills/framer-design/SKILL.md`.
- Extended Framer reference docs with compact portal typography, spacing, card, field, and badge guidance.
- Tightened shared portal primitives in `components/ui/button.tsx`, `components/ui/card.tsx`, and `components/ui/badge.tsx`.
- Reduced spacing and chrome across auth and provider-management surfaces.
- Restyled `app/dashboard/page.tsx` to match the updated compact Framer portal direction.

## Verification

- Run `npm run lint`
- Run `npm run build`
