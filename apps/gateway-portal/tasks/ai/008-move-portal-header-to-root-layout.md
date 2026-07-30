# Move Portal Header To Root Layout

## Summary of Changes

- Moved the shared `PortalHeader` render from the landing page into `app/layout.tsx` so the portal shell appears across routes.
- Removed the landing-page-only header wiring from `app/page.tsx`.
- Updated header navigation and action links to use home-route anchors like `/#providers-card` so they still resolve correctly from nested routes.

## Files Touched

- `apps/gateway-portal/app/layout.tsx`
- `apps/gateway-portal/app/page.tsx`
- `apps/gateway-portal/components/portal-header.tsx`

## How to Verify

- `cd apps/gateway-portal && npm run lint -- app/layout.tsx app/page.tsx components/portal-header.tsx`
- Open `/` and confirm the header still appears above the landing page content.
- Open another route such as `/providers` and confirm the same header is visible there.
- From a non-home route, use the header links and confirm they navigate back to the correct section on `/`.

## Follow-ups / Next Steps

- If more routes get their own bespoke hero shells, consider whether the shared header should become sticky to keep cross-route navigation available while scrolling.
