# 003 — Phase A: XAUTOCLAIM + XREADGROUP + XACK (Redis 8.2)

**Status:** Done  
**App:** `gateway-ingest`

---

## Summary

Implemented Phase A consumer path compatible with **Redis 8.2** (no `XREADGROUP CLAIM`):

1. **`XAUTOCLAIM`** — reclaim idle pending entries first (`REQUEST_LOG_CLAIM_MIN_IDLE_MS`)
2. **`XREADGROUP … >`** — fill remaining COUNT with never-delivered messages (`BLOCK` only when claim returned nothing)
3. **Extract + log**, then **`XACK`** successfully handled ids

Removed the previous Redis 8.4 `CLAIM` path and the `ERR syntax error` fallback entirely.

### ACK policy (Phase A)

- After extract + log succeeds → `XACK`
- Handle failure → leave pending for later reclaim
- Null payload PEL entries (deleted stream body) → log warning + `XACK`

---

## Files Touched

- `src/lib/redis-client.ts` — `xautoclaim`, `xack` surface + reply types
- `src/lib/config.ts` — config comments for XAUTOCLAIM
- `src/consumer/extract.ts` — autoclaim parse, null payload, `source`
- `src/consumer/read-group.ts` — two-step consume; no CLAIM / no fallback
- `src/consumer/ack.ts` — `XACK` helper
- `src/consumer/index.ts` — exports
- `src/index.ts` — loop: claim cursor, handle, ack
- `tests/*` — unit coverage for claim/read/ack paths
- `README.md`, `.env.example`, `AGENTS.md`

---

## How To Verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

Live (Redis ≥ 6.2, e.g. 8.2):

```bash
bun run dev
# Generate proxy traffic or:
# XADD llm-gateway-request-logs * schema_version 1 event_type request_log event_id t1
```

---

## Follow-ups

- Transform + Postgres ingest; move `XACK` to after successful DB write
- Dead-letter / max delivery count
- Optional metrics (claimed vs new rates, ack lag)
