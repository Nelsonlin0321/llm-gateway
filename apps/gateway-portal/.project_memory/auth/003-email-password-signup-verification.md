# 003 — Email/password sign-up with verification

## Summary

Implemented email/password sign-up with password confirmation and required email verification via Better Auth + SES.

- Sign-up requires matching password + confirm password fields.
- On successful sign-up the account is created with `emailVerified: false` and no session is issued.
- Better Auth sends a verification email (React Email template via SES) with a link that expires in 15 minutes.
- Clicking the link verifies the account, auto-signs the user in, and redirects to the home page (`/`).
- Email/password sign-in is blocked until verification completes.

## Files touched

- `lib/auth.ts` — `requireEmailVerification`, `emailVerification.sendVerificationEmail` (SES), `sendOnSignUp`, `autoSignInAfterVerification`, `expiresIn: 15m`
- `components/auth/sign-up-form.tsx` — confirm password, `callbackURL: "/"`, pending verification UI
- `README.md` — email verification setup and env vars

## How to verify

1. Ensure `.env` includes:
   - `EMAIL_FROM` (verified SES identity, e.g. `noreply@llm-gateway.io`)
   - AWS credentials with SES send permission (`AWS_REGION` as needed)
   - `BETTER_AUTH_URL=http://localhost:3000`
2. `npm run dev`
3. Open `/sign-up`, fill name/email/password/confirm password, submit.
4. Confirm the UI shows **Check your email** (pending verification) and you are not redirected to `/workspace`.
5. Open the verification link from the inbox → land on `/` signed in.
6. Optional: sign up a second account and try signing in before verifying — sign-in should be rejected and another verification email sent.

## Follow-ups

- Consider setting `account.accountLinking.requireLocalEmailVerified` back to `true` once most email/password users complete verification.
- Password reset flow (`sendResetPassword`) is not part of this story.
