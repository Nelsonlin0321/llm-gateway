# 019 — Portal header auth avatar

## Summary of changes

Extracted the header CTA into a dedicated client component `PortalHeaderAuth`.

- When the user is signed in, the header shows their avatar (profile image when present, otherwise initials).
- When the user is not signed in, it shows the existing **Launch portal** button.
- While session status is loading, a compact pulse skeleton keeps layout stable.

## Files touched

- `components/portal-header-auth.tsx` (new)
- `components/portal-header.tsx` (imports and renders `PortalHeaderAuth`)
- `tasks/ai/019-portal-header-auth-avatar.md` (this log)

## How to verify

```bash
cd apps/gateway-portal
npm run lint
npm run build
```

Manual checks:

1. Open the portal while signed out — header should show **Launch portal**.
2. Sign in — header should replace the button with an avatar (initials or image).
3. Avatar links to `/workspace/overview`.

## Follow-ups / next steps

- Optional: attach a dropdown menu (profile, settings, sign out) to the avatar.
- Optional: resolve session on the server in the root layout to avoid the brief loading skeleton.
