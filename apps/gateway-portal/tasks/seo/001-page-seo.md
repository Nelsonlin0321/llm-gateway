# 001 — Audit and optimize page SEO

## Summary

Every public and private route now has explicit metadata. The marketing homepage is the indexable surface: title template, Open Graph, Twitter card, canonical URL, JSON-LD (`WebSite` + `SoftwareApplication`), OG image, and apple-touch icon. `/sign-up` stays crawlable for acquisition. Authenticated console pages, sign-in, invitations, and 404s are `noindex`.

`robots.ts` blocks `/api`, `/workspace`, `/org/`, `/organization`, `/profile`, `/sign-in`, and `/accept-invitation`. `sitemap.ts` lists only `/` and `/sign-up`. Auth pages use unique H1s. The 404 page no longer links to retired `/workspace/providers` and `/workspace/overview` paths.

## Files touched

- `lib/site.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/opengraph-image.tsx`
- `app/apple-icon.tsx`
- `app/sign-in/page.tsx`
- `app/sign-up/page.tsx`
- `app/accept-invitation/page.tsx`
- `app/not-found.tsx`
- `app/workspace/page.tsx`
- `app/(workspace)/layout.tsx`
- `app/(workspace)/org/[organizationId]/page.tsx`
- `app/(workspace)/org/[organizationId]/providers/page.tsx`
- `app/(workspace)/org/[organizationId]/models/page.tsx`
- `app/(workspace)/org/[organizationId]/analytics/page.tsx`
- `app/(workspace)/org/[organizationId]/child-keys/page.tsx`
- `app/(workspace)/organization/page.tsx`
- `app/(workspace)/profile/settting/page.tsx`
- `components/auth/auth-shell.tsx`
- `components/auth/sign-in-form.tsx`
- `components/auth/sign-up-form.tsx`
- `components/organization/accept-invitation-client.tsx`
- `components/portal-header.tsx`
- `tests/site.test.ts`

## How to verify

1. `node --import tsx --test tests/site.test.ts`
2. `npx eslint 'app/' 'lib/site.ts' 'components/auth/auth-shell.tsx' 'components/portal-header.tsx' 'components/organization/accept-invitation-client.tsx' 'tests/site.test.ts'`
3. `curl -s http://localhost:3000/robots.txt`
4. `curl -s http://localhost:3000/sitemap.xml`
5. View source on `/` for `<title>`, description, canonical, JSON-LD, and `og:image`
6. Confirm `/sign-in` and `/org/...` emit `noindex`

## Follow-ups / next steps

- Add a dedicated marketing hostname if the console and product site are split
- Rank public pages with Search Console after deploy
