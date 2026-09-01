## Runtime

- This app runs on **Bun** (not Node.js). Use `bun` for install, dev, start, and test.
- Prefer Bun built-ins and auto-loaded `.env` over Node-only packages when possible.
- Node-compatible APIs (`node:test`, `process.env`) remain fine — Bun implements them.

## Scope

- Consume Redis Stream request-log events via consumer groups:
  - `XAUTOCLAIM` for idle pending (Redis 6.2+; works on 8.2)
  - `XREADGROUP … >` for new messages
  - Transform → load Postgres → `XACK` on success
- Do **not** use `XREADGROUP … CLAIM` (Redis 8.4+ only).
- Pipeline modules:
  - `src/consumer/` — Redis read / extract / ack / ensure-group
  - `src/transform/` — stream fields → `request_log` + `event_log` rows (token paths + cost)
  - `src/load/` — transactional inserts; auto-create day + org partitions on miss
  - `src/process.ts` — batch orchestrator (only successful entries are ACKed)
- Token field paths live in `src/transform/token-paths.ts` (extend arrays for new providers).
- `request_log` / `event_log` are `PARTITION BY RANGE (log_date)`, with
  daily children `PARTITION BY LIST (organization_id)`. On
  `no partition of relation … found for row`, create
  `{table}_{YYYY_MM_DD}` (LIST parent) and
  `{table}_{YYYY_MM_DD}_{normalized_organization_id}` (org leaf) and retry
  once (`src/load/partitions.ts`).
- Prefer matching `gateway-api` Drizzle patterns (Neon serverless, `casing: "snake_case"`, lazy `db` proxy).

## Testing Expectations

- Add or update automated tests for any behavior change, especially stream parsing, token extraction, and consumer helpers.
- Prefer small focused unit tests with a fake Redis / DB client.
- Before handing work off, run `bun test` and `bun run build` in this app.
