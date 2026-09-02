# 004 — Highlight shell and JSON on the docs page

## Summary of changes

Made shell and JSON highlighting obvious on `/docs`:

- Language id is now `shell` (bash grammar) instead of `sh`
- JSON payloads keep `json` and use One Dark Pro so keys and strings differ
- Auth header and `NEXT_PUBLIC_PROXY_API_URL` assignment are highlighted as shell

## Files touched

- `lib/docs/highlight.ts`
- `components/docs/api-docs-content.tsx`
- `tests/docs/highlight.test.ts`
- `tasks/docs/004-shell-json-highlight.md`

## How to verify

```bash
cd apps/gateway-portal
node --import tsx --test tests/docs/highlight.test.ts
```

Open `/docs`: curl blocks labeled **shell**, JSON bodies labeled **json**, with distinct token colors.

## Follow-ups / next steps

- None.
