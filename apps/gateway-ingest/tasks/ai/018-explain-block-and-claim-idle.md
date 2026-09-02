# 018 — Explain `blockMs` and `claimMinIdleMs` in startup log

## Summary of changes

Expanded comments on `blockMs` and `claimMinIdleMs` in the `[gateway-ingest] starting` log: when `XREADGROUP BLOCK` applies, why Workers default to 0, and that `XAUTOCLAIM` min-idle reclaims un-ACKed PEL entries from a previous invocation.

## Files touched

- `src/index.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun run build
```

## Follow-ups / next steps

None.
