# 005 — Profile settings (avatar + display name)

## Summary

Added end-to-end profile settings so users can customize their avatar image URL and display name:

- Replaced the "Workspace" dropdown item in the portal header user menu with a "Profile Settings" entry that navigates to `/profile/settting`.
- Created the profile settings page under `app/(workspace)/profile/settting/` protected by `requireSession`.
- Built a client-side form with live avatar preview (image URL or initials fallback), display name input, read-only email, reset, and save actions.
- Implemented a server action (`updateProfile`) that validates the session, runs Zod validation, and updates the `user.name` / `user.image` columns directly via Drizzle, then revalidates relevant paths.
- Added missing shadcn-style UI building blocks used by the form: `Input`, `Label`, and `Avatar` (with `AvatarImage` + `AvatarFallback`).

## Files touched

- `components/portal-header-auth.tsx` — swapped Workspace dropdown item for Profile Settings link, added `UserCog` icon import.
- `components/ui/input.tsx` — new Input component.
- `components/ui/label.tsx` — new Label component.
- `components/ui/avatar.tsx` — new Avatar / AvatarImage / AvatarFallback components.
- `components/profile/profile-settings-form.tsx` — client form for avatar URL, display name, save/reset, live preview, error/toast handling.
- `app/(workspace)/profile/settting/page.tsx` — server component that loads the session and mounts the form.
- `lib/profile/service.ts` — Zod `updateProfileSchema` + `validateUpdateProfileInput` helper.
- `app/server-actions/profile/shared.ts` — `ProfileActionResult`, `profileReturning` projection, `validationErrorResult`.
- `app/server-actions/profile/update-profile.ts` — `"use server"` action implementing the update flow with `revalidatePath`.

## How to verify

1. `npx eslint components/portal-header-auth.tsx components/profile/ 'app/(workspace)/profile/' app/server-actions/profile/ lib/profile/`
2. `npx tsc --noEmit`
3. `npm run dev`
4. Sign in, open the avatar menu in the portal header, and confirm "Profile Settings" appears (first item under the first separator) and links to `/profile/settting`.
5. On the settings page:
   - Confirm avatar preview shows initials when no image is set.
   - Enter a valid image URL and confirm the preview renders it.
   - Change the display name and click Save.
   - Confirm toast success message and that the header avatar/name refresh on next navigation.
6. Leave name empty and save — confirm client/server validation surfaces the required-name error.

## Follow-ups / next steps

- Support file upload (e.g. signed S3 upload) instead of only image URLs for avatars.
- Add email-change flow (password re-confirm + verification) instead of a disabled read-only field.
- Consider adding timezone, locale, or notification preferences once product needs are clearer.
