# 022 — Simplify delivery-count checks

## Summary of changes

- Removed `deliveryCountOf` / `isExhausted` helpers; process uses `entry.deliveryCount ?? 1` inline.
- Delivery count is Redis PEL’s times-delivered counter. We do not `+ 1` in JS: failing without ACK leaves the entry pending, and the next `XAUTOCLAIM` increments Redis’s count. `XPENDING` copies that count onto reclaimed entries.

## Files touched

- `apps/gateway-ingest/src/process.ts`
- `apps/gateway-ingest/src/consumer/extract.ts`
- `apps/gateway-ingest/src/consumer/read-group.ts`

## How to verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

## Follow-ups / next steps

- None.
