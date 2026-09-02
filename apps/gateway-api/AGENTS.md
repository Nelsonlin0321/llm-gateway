## Runtime

- This app deploys as a **Cloudflare Worker** (Hono). Local runtime is `wrangler dev` (workerd).
- Unit tests still run on **Bun** (`bun test`). Use `bun` for install and test.
- Prefer Web-standard APIs (`fetch`, `WebSocket`, Worker bindings) over Node-only packages.
- Node-compatible APIs (`node:crypto`, `Buffer`, `process.env`) remain fine — Workers `nodejs_compat` implements them.
- Config comes from **Worker bindings**:
  - Local: `.env` next to `wrangler.jsonc` (loaded by `wrangler dev`).
  - Production: `vars` in `wrangler.jsonc` plus `wrangler secret put` (never commit secret values).
  - Request handlers read `c.env`; helpers that still use `process.env` are hydrated from those bindings on each request.

## Testing Expectations

- Add or update automated tests for any behavior change, especially when introducing a new function or modifying request routing or payload transformation logic.
- Prefer small focused unit tests for pure helpers and payload preparation code, and keep integration scripts for end-to-end gateway checks.
- Before handing work off, run the most relevant tests for the files you changed. For `payload-openai.ts`, this includes `bun test` in `apps/gateway-api`.
