# 001 — Public API usage docs page

## Summary of changes

Added a public `/docs` page in the portal that explains how to call the gateway. Paths, headers, and JSON bodies follow `apps/gateway-api/scripts/bulk-proxy-test.ts` and its payload fixtures (`POST /openai/chat/completions`, `POST /anthropic/v1/messages`, Bearer child key, `provider/alias` model, optional `metadata`, stream on/off).

## Files touched

- `app/docs/page.tsx`
- `components/docs/api-docs-content.tsx`
- `components/docs/code-block.tsx`
- `lib/docs/api-guide.ts`
- `tests/docs/api-guide.test.ts`
- `app/layout.tsx` — Docs nav
- `app/page.tsx` — hero + footer links
- `app/sitemap.ts`
- `app/not-found.tsx`
- `tasks/docs/001-api-usage-page.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npx tsc --noEmit
npx eslint app/docs components/docs lib/docs tests/docs app/layout.tsx app/page.tsx app/sitemap.ts app/not-found.tsx
```

Open `http://localhost:3000/docs` and copy a curl example. Confirm header **Docs** and homepage **API docs** link there.

## Follow-ups / next steps

- Add language tabs if more SDK examples are needed.
- Optionally generate snippets from the gateway-api payload JSON at build time so they cannot drift.
