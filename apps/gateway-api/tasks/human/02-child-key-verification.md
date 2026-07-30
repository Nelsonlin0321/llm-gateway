Implement Authentication protection for apps/gateway-api:

The proxy requires an Authentication bearer token.

## Key forms

- **Plain child API key** (`sk_<jwt>`): what the portal returns on create/reveal; **this** is what clients put in `Authorization`.
- **Encrypted child API key** (`v1.…`): what is stored in the database only. Never used as the Bearer secret.
  - Decrypt DB values with `decryptApiKeyForProxy` / `decryptChildKey` in `apps/gateway-api/src/child-keys/`.

## Authentication flow (proxy)

1. `"authorization": Bearer ${plainChildApiKey}` is required (`sk_…`)
2. Verify the plain key is a valid JWT signed with `JWT_SIGNING_SECRET` and extract the payload
3. Reject if expired (`exp` claim when present)

All related child-key functions live under `apps/gateway-api/src/child-keys`.
