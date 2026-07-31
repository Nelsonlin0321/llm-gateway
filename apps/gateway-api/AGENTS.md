## Runtime

- This app runs on **Bun** (not Node.js). Use `bun` for install, dev, start, and test.
- Prefer Bun built-ins (`Bun.serve` via default export, native `WebSocket`, auto-loaded `.env`) over Node-only packages when possible.
- Node-compatible APIs (`node:crypto`, `node:test`, `Buffer`, `process.env`) remain fine — Bun implements them.

## Testing Expectations

- Add or update automated tests for any behavior change, especially when introducing a new function or modifying request routing or payload transformation logic.
- Prefer small focused unit tests for pure helpers and payload preparation code, and keep integration scripts for end-to-end gateway checks.
- Before handing work off, run the most relevant tests for the files you changed. For `payload-openai.ts`, this includes `bun test` in `apps/gateway-api`.
