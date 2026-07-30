instead of stored the plain text child key, we should store the encrypted child key.
Encrypted child key using the `API_ENCRYPT_KEY` environment variable using the same encryption algorithm in `apps/gateway-portal/lib/llm-provider/crypto.ts` file.
