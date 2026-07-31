## Runtime

- This app runs on **Bun** (not Node.js). Use `bun` for install, dev, start, and test.
- Prefer Bun built-ins and auto-loaded `.env` over Node-only packages when possible.
- Node-compatible APIs (`node:test`, `process.env`) remain fine — Bun implements them.

## Scope

- Consume Redis Stream request-log events via consumer groups (`XREADGROUP` + `CLAIM`).
- Extract stream entries into structured records.
- Transform + Postgres ingest are **out of scope until explicitly requested**.

## Testing Expectations

- Add or update automated tests for any behavior change, especially stream parsing and consumer helpers.
- Prefer small focused unit tests with a fake Redis client.
- Before handing work off, run `bun test` and `bun run build` in this app.
