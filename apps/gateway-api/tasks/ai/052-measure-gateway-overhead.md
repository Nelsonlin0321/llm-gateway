# 052 — Measure gateway overhead against a local mock

## Summary of changes

Added `scripts/measure-gateway-overhead.ts` and `bun run bench:overhead`. It times the same non-streaming chat body two ways and reports

`overhead = latency(client → gateway → mock) − latency(client → mock)`.

The gateway path uses the real Hono OpenAI proxy (parse, rewrite, `hono/proxy`, JSON response capture) plus in-memory HS256 verify and AES decrypts. Provider resolution is a fixed in-memory record. Redis and Postgres are not contacted.

## Files touched

- `apps/gateway-api/scripts/measure-gateway-overhead.ts`
- `apps/gateway-api/package.json`
- `apps/gateway-api/tasks/ai/052-measure-gateway-overhead.md`

## How to verify

```bash
cd apps/gateway-api
bun scripts/measure-gateway-overhead.ts
```

One local run (300 samples, 50 warmup pairs): direct p50 0.048 ms, via gateway p50 0.212 ms, paired overhead p50 0.163 ms.

## Follow-ups / next steps

- This excludes Upstash and Neon. Wall-clock overhead in production is dominated by those hops, not by this 0.16 ms.
