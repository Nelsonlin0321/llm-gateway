# SES Verification Email

## Summary

Refactored the portal verification email flow so Better Auth sends the verification email through Amazon SES using the existing React Email template.

## Files Touched

- `apps/gateway-portal/lib/auth.ts`
- `apps/gateway-portal/lib/email.ts`
- `apps/gateway-portal/lib/ses.ts`
- `apps/gateway-portal/tasks/ai/002-ses-verification-email.md`

## What Changed

- Replaced the exported render-only verification helper with an SES-backed `sendVerificationEmail` function.
- Added SES `SendEmailCommand` payload generation with both HTML and plain-text bodies.
- Updated the SES client to use `SESClient` and read `AWS_REGION` with a `us-east-1` fallback.
- Wired Better Auth `emailVerification.sendVerificationEmail` to the SES sender.
- Set Better Auth verification links to expire in 15 minutes so the auth behavior matches the email copy.
- Enabled verification email sending on sign-up.

## How To Verify

From `apps/gateway-portal`, run:

```bash
npm run lint -- lib/auth.ts lib/email.ts lib/ses.ts
```

Then ensure `BETTER_AUTH_EMAIL_FROM` or `EMAIL_FROM` is set to an SES-verified sender and test the sign-up or send-verification-email flow.

## Follow-ups

- Add a committed `.env.example` if you want to document the required sender env var for other contributors.
