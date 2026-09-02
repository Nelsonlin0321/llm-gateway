# 008 — Enable Profile nav at /profile/setting

## Summary of changes

Profile settings is a live page. Enabled the Account → Profile sidebar item, moved the route from the typo `/profile/settting` to `/profile/setting`, and pointed the header menu and revalidate path at the same URL. The old path redirects.

## Files touched

- `components/workspace/workspace-sidebar.tsx`
- `components/portal-header-auth.tsx`
- `app/(workspace)/profile/setting/page.tsx`
- `app/(workspace)/profile/settting/page.tsx` (redirect)
- `app/server-actions/profile/update-profile.ts`
- `tasks/auth/008-enable-profile-setting-nav.md`

## How to verify

```bash
cd apps/gateway-portal
npx tsc --noEmit
```

Sign in, click **Profile** in the sidebar, confirm `/profile/setting` loads. Header **Profile Settings** should open the same page.

## Follow-ups / next steps

- None.
