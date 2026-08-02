# 043 — Migrate gateway-api runtime from Node.js to Bun

## Summary

Converted `apps/gateway-api` from a Node.js runtime (`@hono/node-server` + `tsx` + `node --test`) to **Bun**:

- Serve Hono via Bun’s default export (`port` + `fetch`) instead of `@hono/node-server`
- Run TypeScript directly with Bun (no `tsx` for app start/dev/test)
- Use Bun-native WebSocket for Neon serverless (drop `ws`)
- Rely on Bun auto-loaded `.env` for runtime; keep `dotenv` for Drizzle Kit config
- Package management: `bun.lock` replaces `package-lock.json`
- Unit tests run under `bun test`; live tests flattened (Bun does not support nested `node:test`)
- Aligned a few stale unit assertions (`downstreamBody`, redis key shape, capture default) so the suite is green under Bun

## Files touched

- `package.json` — scripts + deps for Bun
- `bun.lock` — new lockfile (removed `package-lock.json`)
- `tsconfig.json` — `types: ["bun"]`
- `src/index.ts` — Bun server export
- `src/lib/db.ts` — native `WebSocket`; remove dotenv
- `src/lib/redis-client.ts`, `src/request-log/capture.ts`, `src/shared/upstream.ts` — remove runtime dotenv imports
- `README.md`, `AGENTS.md` — Bun runtime docs
- `tests/*.live.test.ts` — flat tests (no nested `t.test`)
- `tests/payload-*.test.ts`, `tests/redis-keys.test.ts`, `tests/request-log.test.ts` — assertion fixes

## How to verify

```shell
cd apps/gateway-api
bun install
bun run build          # tsc --noEmit
bun test               # unit tests (excludes *.live.test.ts)
bun run dev            # hot-reload server
curl http://localhost:8080/health
```

Verified in this change:

- `bun run build` — pass
- `bun test` — 63 pass / 0 fail
- `PORT=18080 bun run src/index.ts` + `GET /health` and `GET /` — 200 OK

## Follow-ups / next steps

- Optionally migrate tests from `node:test` to `bun:test` for fuller Bun test features
- Consider Docker / deploy image based on `oven/bun` if production still assumes Node
- Live proxy scripts: `bun run test:openai-chat` / `bun run test:anthropic-messages` (require gateway + `LIVE_PROXY_TEST=1`)
