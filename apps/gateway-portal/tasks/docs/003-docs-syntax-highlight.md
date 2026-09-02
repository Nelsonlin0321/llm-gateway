# 003 — Syntax highlight docs code blocks

## Summary of changes

Highlighted `/docs` examples with Shiki: `sh` for curl, `typescript` for the Node SDK, `python` for the Python SDKs. JSON payloads use `json`. Highlighting runs on the server; copy stays a client button.

## Files touched

- `lib/docs/highlight.ts`
- `components/docs/code-block.tsx`
- `components/docs/copy-button.tsx`
- `components/docs/api-docs-content.tsx`
- `app/globals.css`
- `next.config.ts` (`serverExternalPackages: ["shiki"]`)
- `package.json` / `package-lock.json` (`shiki`)
- `tests/docs/highlight.test.ts`
- `tasks/docs/003-docs-syntax-highlight.md`

## How to verify

```bash
cd apps/gateway-portal
npm test
npx tsc --noEmit
```

Open `/docs` and confirm curl, TypeScript, and Python blocks have colored tokens (not plain monochrome).

## Follow-ups / next steps

- None.
