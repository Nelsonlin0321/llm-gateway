# 032 - Require creator_id in child-key JWT

## Summary

- Added `creator_id` back into the required child API key JWT payload so downstream requests can be attributed to the creating principal.
- Updated child-key unit tests and test key minting helpers to include the `creator_id` claim.
- Updated live proxy test helpers to mint `creator_id` when `CHILD_API_KEY` is not provided (even though live tests are gated behind `LIVE_PROXY_TEST=1`).

## Files touched

- `src/child-keys/types.ts`
- `src/child-keys/jwt.ts`
- `tests/child-keys/mint-test-key.ts`
- `tests/child-keys/auth.test.ts`
- `tests/child-keys/authorize.test.ts`
- `tests/anthropic-messages-live.ts`
- `tests/openai-chat-completions-live.ts`

## Verification

```bash
LIVE_PROXY_TEST=0 node --import tsx --test tests/**/*.test.ts
```

