# 004 — Always XAUTOCLAIM from `0-0` (no cursor state)

**Status:** Done  
**App:** `gateway-ingest`

---

## Summary

Dropped `nextAutoclaimStartId` / `autoclaimStartId` maintenance.

Each reclaim uses a fixed start:

```text
XAUTOCLAIM <stream> <group> <consumer> <min-idle> 0-0 COUNT <n>
```

With Phase A `XACK` after extract, handled entries leave the PEL. The next loop’s `0-0` scan naturally picks up whatever is still pending from the oldest side of the PEL. A pagination cursor is only useful for multi-page scans without ACKing (or very large PELs scanned without removing entries).

---

## Files Touched

- `src/consumer/read-group.ts` — fixed `XAUTOCLAIM_START_ID = "0-0"`
- `src/consumer/extract.ts` — autoclaim parser returns entries only
- `src/index.ts` — removed cursor state
- `tests/*`, `README.md`

---

## How To Verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```
