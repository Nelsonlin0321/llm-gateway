# 002 — Google social sign-in: account_not_linked handling

## Summary

Fixed Google OAuth for users who already signed up with email/password (or another provider), and added graceful UI handling when OAuth still fails.

**Root cause:** Better Auth rejects implicit account linking when the local user's email is not verified (`requireLocalEmailVerified` defaults to `true`). Email/password users in this app are typically unverified, so Google sign-in returned `account_not_linked` even though Google is a trusted provider.

**Server:**
- Removed invalid `account_not_linked: false` config key
- Enabled account linking with `trustedProviders: ["google"]` and `requireLocalEmailVerified: false`
- Set `onAPIError.errorURL` to `/sign-in` as a global OAuth failure fallback

**Client:**
- Pass `errorCallbackURL` on Google sign-in so callback errors return to `/sign-in` or `/sign-up` with `?error=...`
- Map OAuth error codes (including `account_not_linked`) to clear user-facing messages
- Clear the error query param after displaying so a refresh does not re-show it

## Files touched

- `lib/auth.ts`
- `components/auth/oauth-error.ts` (new)
- `components/auth/google-sign-in-button.tsx`
- `components/auth/sign-in-form.tsx`
- `components/auth/sign-up-form.tsx`
- `app/sign-up/page.tsx` (Suspense for `useSearchParams`)

## How to verify

1. Create a user with **email + password** (same email as a Google account).
2. On `/sign-in`, click **Continue with Google** using that Google account.
3. Expected: session is created and you land on `/workspace` (accounts linked).
4. To verify error UI (optional): temporarily set `account.accountLinking.enabled: false`, repeat Google sign-in, and confirm redirect to `/sign-in` with a readable error banner instead of a raw error page.
5. Cancel the Google consent screen (or deny access) and confirm a friendly cancellation message appears.

## Follow-ups

- If email verification is added later, reconsider `requireLocalEmailVerified` (can set back to `true` once verification is enforced).
- Optional: account settings UI to manually link/unlink social providers.
