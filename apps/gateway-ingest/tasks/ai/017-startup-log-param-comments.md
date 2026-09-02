# 017 — Comment ingest startup log fields

## Summary of changes

Added inline comments on the `[gateway-ingest] starting` log in `src/index.ts` so each drain parameter is explained at the call site.

## Files touched

- `src/index.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun run build
```

## Follow-ups / next steps

None.
