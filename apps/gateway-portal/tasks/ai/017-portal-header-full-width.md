# 017 - Portal header full width, flush top

## Summary

Made `PortalHeader` span the full viewport width and sit flush with the top of the screen (no top padding, no max-width card chrome).

## Changes

- `components/portal-header.tsx` — full-width bar with bottom border only; removed rounded card shell; horizontal padding kept for content
- `app/layout.tsx` — removed `max-w-8xl` + `pt-*` wrapper around the header

## How to verify

```bash
cd apps/gateway-portal && npm run dev
```

Header should touch the top and left/right edges of the viewport.
