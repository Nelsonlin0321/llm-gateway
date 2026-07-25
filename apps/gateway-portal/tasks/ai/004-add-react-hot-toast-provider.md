## Summary of changes

- Fixed and finalized the `ReactHotToastProvider` client component so it renders `children` and an embedded `<Toaster />`.
- Wrapped the root portal layout with `ReactHotToastProvider` so toast notifications are available application-wide.

## Files touched

- `apps/gateway-portal/components/providers/react-hot-toast.tsx`
- `apps/gateway-portal/app/layout.tsx`

## How to verify

- Run `npm run lint -- app/layout.tsx components/providers/react-hot-toast.tsx` from `apps/gateway-portal`
- Start the app with `npm run dev` from `apps/gateway-portal`
- Trigger any `react-hot-toast` call in a client component and confirm the toast renders

## Follow-ups / next steps

- Add shared toast styling or default options if the portal should have branded notification variants
