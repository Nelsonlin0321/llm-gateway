## Testing Expectations

- Add or update automated tests for any behavior change, especially when introducing a new function or modifying request routing or payload transformation logic.
- Prefer small focused unit tests for pure helpers and payload preparation code, and keep integration scripts for end-to-end gateway checks.
- Before handing work off, run the most relevant tests for the files you changed. For `payload-openai.ts`, this includes `npm test` in `apps/gateway-api`.
