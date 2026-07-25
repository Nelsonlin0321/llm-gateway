# Summary of changes

- Created reusable auth UI components in `components/auth` for the sign-in and sign-up experiences.
- Extracted client-side submit logic out of the route pages into focused form components.
- Refactored the `app/sign-in` and `app/sign-up` pages into thin route wrappers that render the new components.

# Files touched

- `apps/gateway-portal/app/sign-in/page.tsx`
- `apps/gateway-portal/app/sign-up/page.tsx`
- `apps/gateway-portal/components/auth/auth-shell.tsx`
- `apps/gateway-portal/components/auth/sign-in-form.tsx`
- `apps/gateway-portal/components/auth/sign-up-form.tsx`

# How to verify

- Run `npx eslint "app/sign-in/page.tsx" "app/sign-up/page.tsx" "components/auth/auth-shell.tsx" "components/auth/sign-in-form.tsx" "components/auth/sign-up-form.tsx"` from `apps/gateway-portal`.

# Follow-ups / next steps

- Add password reset and email verification flows when the auth journey is expanded.
- Consider extracting a shared auth field component if more auth screens are added.
