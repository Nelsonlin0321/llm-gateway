# 005 — Restore XAUTOCLAIM `nextAutoclaimStartId` pagination

**Status:** Done  
**App:** `gateway-ingest`

---

## Summary

Reverted always-`0-0` XAUTOCLAIM starts. Large PELs pay a latency cost if every loop re-scans from the beginning.

### Behavior

- Start cursor: `0-0`
- After each `XAUTOCLAIM`, store reply next id as `nextAutoclaimStartId`
- Next loop passes that cursor
- When Redis returns `0-0`, scan has wrapped; next call starts from the beginning again

---

## Files Touched

- `src/consumer/extract.ts` — return `nextStartId` again
- `src/consumer/read-group.ts` — `autoclaimStartId` in / `nextAutoclaimStartId` out
- `src/index.ts` — maintain cursor across loop
- `tests/*`, `README.md`

---

## How To Verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```
