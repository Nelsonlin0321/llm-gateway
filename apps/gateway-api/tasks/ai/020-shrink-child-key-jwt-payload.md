# 020 - Shrink child key JWT payload

## Summary

- Reduced `ChildKeyJwtPayload` to the active claim set only: `name`, `key_id`, optional `policy_id`, `issued_at`, and optional `exp`.
- Removed parsing assumptions for deleted legacy child keys, including fallback handling for extra JWT claims not used by gateway authorization.
- Updated child-key test helpers and auth tests to mint and validate the compact payload shape.

## Files touched

- `src/child-keys/types.ts`
- `src/child-keys/jwt.ts`
- `src/child-keys/service.ts`
- `src/child-keys/index.ts`
- `tests/child-keys/mint-test-key.ts`
- `tests/child-keys/auth.test.ts`
- `tests/child-keys/authorize.test.ts`
- `tests/openai-chat-completions-live.ts`
- `tests/anthropic-messages-live.ts`

## Verification

```bash
node --import tsx --test tests/child-keys/auth.test.ts
node --import tsx --test tests/child-keys/authorize.test.ts
./node_modules/.bin/tsc --noEmit --pretty false
```
