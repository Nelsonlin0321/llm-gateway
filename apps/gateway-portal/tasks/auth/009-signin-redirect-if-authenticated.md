# 009 — Redirect signed-in users away from /sign-in

## Summary of changes

If a session already exists, `/sign-in` no longer shows the form. It redirects to the `next` query parameter when that path is a safe same-origin relative URL, otherwise `/workspace`.

## Files touched

- `app/sign-in/page.tsx`
- `tests/auth/safe-return-path.test.ts`
- `tasks/auth/009-signin-redirect-if-authenticated.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npx tsc --noEmit
```

While signed in, visit `/sign-in` → `/workspace`. Visit `/sign-in?next=/profile/setting` → `/profile/setting`. Visit `/sign-in?next=https://evil.example` → `/workspace`.

## Follow-ups / next steps

- Apply the same redirect on `/sign-up` if that flow should skip the form for existing sessions.
