# 007 — Replace README latency figures with mock overhead

## Summary of changes

Replaced the Cloudflare Worker CPU times and the Upstash round-trip table in the root README with the local overhead benchmark. The formula is `latency(client → gateway → mock) − latency(client → mock)`: p50 0.163 ms, p90 0.220 ms, p99 0.302 ms (300 samples). The homepage rounding (0.16 ms / 0.30 ms) is noted. Redis, Postgres, and the model are called out as excluded.

## Files touched

- `README.MD`
- `tasks/docs/007-readme-overhead-latency.md`

## How to verify

Read the "How light and how fast" section. Re-run with `cd apps/gateway-api && bun run bench:overhead`.

## Follow-ups / next steps

- None. Production still pays Upstash HTTPS hops; this section no longer quotes those timings.
