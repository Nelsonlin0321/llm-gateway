# 033 - Remove policy_id from child-key JWT

## Summary

- Removed `policy_id` from the child API key JWT claim set in `gateway-api`.
- Updated JWT parsing/types and the test-only child-key mint helper to match the new claim shape.

## Files touched

- `src/child-keys/types.ts`
- `src/child-keys/jwt.ts`
- `src/child-keys/service.ts`
- `tests/child-keys/mint-test-key.ts`

## Verification

```bash
LIVE_PROXY_TEST=0 node --import tsx --test tests/**/*.test.ts
```
