# 003 — Show measured gateway overhead on the homepage

## Summary of changes

Replaced the Cloudflare Worker CPU figures on the portal homepage with the local overhead benchmark: p50 0.16 ms, p99 0.30 ms. The number is `latency(client → gateway → mock) − latency(client → mock)` from `apps/gateway-api/scripts/measure-gateway-overhead.ts` (300 samples). Redis and Postgres were not on that path.

## Files touched

- `apps/gateway-portal/app/page.tsx`
- `apps/gateway-portal/tasks/seo/003-homepage-overhead-latency.md`

## How to verify

Open `/` and confirm the stat reads 0.16 ms, “Added latency”, and the hero mentions 0.16 ms versus a direct mock and 0.30 ms at p99. No Cloudflare CPU figures remain on the page.

## Follow-ups / next steps

- The root README still documents the Cloudflare CPU times and the Upstash wall-clock hops. Update it only if those should match the homepage.
