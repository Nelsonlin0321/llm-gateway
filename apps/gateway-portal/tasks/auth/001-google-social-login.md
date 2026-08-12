# 001 — Google social login

## Summary

Added Google OAuth via Better Auth on sign-in and sign-up.

## Files touched

- `lib/auth.ts` — Google social provider + `nextCookies`
- `components/auth/google-sign-in-button.tsx` — Google button
- `components/auth/auth-divider.tsx` — email/Google divider
- `components/auth/sign-in-form.tsx` / `sign-up-form.tsx` — Google CTA
- `app/sign-in/page.tsx` / `app/sign-up/page.tsx` — Suspense where needed
- `README.md` — env + setup notes

## How to verify

1. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` in `.env`
2. Google Cloud redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
3. `npm run dev` → use **Continue with Google** on `/sign-in` or `/sign-up`
