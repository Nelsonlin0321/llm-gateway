# Fix Card Description Skeleton Hydration

## Summary of Changes

- Updated `CardDescription` to support an `as` prop so it can render semantic text as a `<p>` by default while allowing block wrappers where needed.
- Switched the `/providers` loading skeleton to render its description placeholders inside `<div>` containers instead of invalid `<p><div /></p>` markup.
- Resolved the server/client markup mismatch that was causing the hydration warning on the providers route.

## Files Touched

- `apps/gateway-portal/app/providers/page.tsx`
- `apps/gateway-portal/components/ui/card.tsx`
- `apps/gateway-portal/components/providers/provider-management-skeleton.tsx`

## How to Verify

- `cd apps/gateway-portal && npm run lint`
- Open `/providers` and confirm the loading skeleton renders without the `<div>` inside `<p>` hydration error.

## Follow-ups / Next Steps

- If more card loading states are added later, prefer `CardDescription as="div"` whenever the content includes block-level placeholders or layout wrappers.
