# 002 — XREADGROUP CLAIM Redis version fallback

**Status:** Done  
**App:** `gateway-ingest`

---

## Summary

`ERR syntax error` on:

```text
XREADGROUP GROUP … COUNT … BLOCK … CLAIM 60000 STREAMS … >
```

is **not** a malformed command for modern Redis — `CLAIM` on `XREADGROUP` only exists since **Redis 8.4**. Older servers do not recognize the token and reply `ERR syntax error`.

### Fix

- Detect `ERR syntax error` when CLAIM was requested
- Retry once without `CLAIM`
- Return `claimUnsupported` so the main loop disables CLAIM for subsequent reads
- Log a one-time warning explaining Redis 8.4+ requirement

### Workaround without code

Set in `.env`:

```bash
REQUEST_LOG_CLAIM_MIN_IDLE_MS=0
```

Or upgrade Redis to ≥ 8.4.

---

## Files Touched

- `src/consumer/read-group.ts` — syntax-error detect + CLAIM fallback
- `src/consumer/index.ts` — export `isRedisSyntaxError`
- `src/index.ts` — permanent claim disable after first unsupported reply
- `tests/read-group.test.ts` — fallback coverage
- `README.md`, `.env.example` — document Redis 8.4 requirement

---

## How To Verify

```bash
cd apps/gateway-ingest
bun test
bun run build
```

On Redis &lt; 8.4 with default CLAIM config, startup should log a CLAIM fallback warning once and then read successfully without looping on syntax errors.

---

## Follow-ups

- Optional: on Redis &lt; 8.4, reclaim idle pending via separate `XAUTOCLAIM` (available since Redis 6.2)
