# 007 — Load provider credentials from database (Prisma)

**Status:** Pending  
**App:** `gateway-api`  
**Priority:** P0  
**Depends on:** Portal providers encrypted vault; contract task portal **032**; shared `DATABASE_URL` + `API_ENCRYPT_KEY`  
**Replaces:** Env-only `apiKeyEnv` resolution for production routing  
**Pattern:** Same Prisma + decrypt approach as **016** (child-key authorization)

---

## Context

Today routing uses the static registry in `src/providers.ts` plus `getProviderApiKey` from `process.env[provider.apiKeyEnv]` (`src/shared/upstream.ts`).

Portal (and the gateway Prisma schema) already store master credentials on `LLMProvider`:

| Field | Role |
|-------|------|
| `name` | Routing prefix in `model` (`{name}/{upstreamModel}`) |
| `apiUrl` | Upstream base URL |
| `encryptedApiKey` | AES-256-GCM ciphertext (`API_ENCRYPT_KEY`) |
| `compatibilityType` | `openai` \| `anthropic` — must match route family |
| `isActive` | Soft-disable |

Gateway already has:

- `src/prisma.ts` — shared `PrismaClient` (Neon adapter)
- `prisma/schema.prisma` — `LLMProvider` model
- `decryptApiKeyForProxy` in `src/child-keys/crypto.ts` (same scheme as portal)

## Goal

Resolve upstream config for a request by **looking up the provider in Postgres via Prisma**, not env vars:

1. Parse provider id from model string (`provider/model`) — keep existing slash split.
2. Query Prisma: `prisma.lLMProvider.findFirst` (or unique by `name` if a unique constraint is added) where `name = providerId` and `isActive = true`, optionally filtered by `compatibilityType`.
3. Decrypt `encryptedApiKey` with `decryptApiKeyForProxy`.
4. Use `apiUrl` as upstream `baseUrl` for `buildUpstreamUrl` / proxy handlers.
5. Fall back or error clearly when the row is missing / inactive / decrypt fails.

## Implementation plan

### 1. Provider credential module

Add something like `src/providers/db.ts` (or `src/providers/resolve.ts`) that:

- Imports the shared client from `../prisma.js` (same as `src/child-keys/authorize.ts`).
- Exposes a typed result (success vs failure) — no raw secrets in logs.
- Accepts an injectable lookup for unit tests (mirror `ChildKeyLookup`).

Suggested shapes:

```ts
export type ResolvedProvider = {
  providerId: string;
  baseUrl: string;
  apiKey: string; // decrypted; never log
  compatibilityType: "openai" | "anthropic";
  exampleModel?: string; // optional; may come from related Model later
};

export type ProviderLookup = {
  findByName(
    name: string,
    compatibilityType: "openai" | "anthropic",
  ): Promise<{
    name: string;
    apiUrl: string;
    encryptedApiKey: string;
    compatibilityType: "openai" | "anthropic";
    isActive: boolean;
  } | null>;
};

// Default lookup uses Prisma:
// prisma.lLMProvider.findFirst({
//   where: { name: providerId, isActive: true, compatibilityType },
//   select: { name: true, apiUrl: true, encryptedApiKey: true, compatibilityType: true, isActive: true },
// })
```

### 2. Wire into model parsing / proxy

- Extend or replace the static path in `parseModel` / proxy handlers so production resolution is async:

  - `resolveProvider(model, compatibility)` → Prisma lookup + decrypt
  - Keep static `providers.ts` only as **dev fallback** (optional env flag) or remove once DB is required

- Update `proxy-openai.ts` / `proxy-anthropic.ts` (and any `/v1` surface) to:

  1. Parse `providerId` + bare model
  2. Call Prisma-backed resolver
  3. Use resolved `baseUrl` + decrypted `apiKey` for upstream request

- Error mapping (do not leak secrets or ciphertext):

  | Condition | HTTP | Message (approx.) |
  |-----------|------|-------------------|
  | Unknown / missing provider | 400/404 | same class as today unknown provider |
  | Found but `isActive = false` | 400/403 | provider inactive / not available |
  | `compatibilityType` mismatch | 400 | provider not available for this API family |
  | Decrypt / config error | 500/502 | generic misconfiguration (no key material) |
  | DB unavailable | 503 | fail closed, like child-key authz |

### 3. Prisma query details

- Use **select** only needed columns (`name`, `apiUrl`, `encryptedApiKey`, `compatibilityType`, `isActive`) — never return full row to logs.
- Prefer lookup by **`name`** (routing prefix). Schema today indexes `[creatorId, name]` but does not enforce global uniqueness; portal **032** owns uniqueness rules. For MVP:
  - If multiple rows match `name` + active + compatibility, take a deterministic choice (e.g. most recently updated) **or** require portal uniqueness and use `findFirst` with documented order.
  - Follow-up: add `@@unique([name])` (or workspace-scoped unique) once portal contract settles.
- Name matching: request prefix is lowercased today (`parseModel`); ensure portal stores names consistently (document case rules).

### 4. Security

- Never log decrypted `apiKey` or `encryptedApiKey`.
- Error responses must not include env var names, ciphertext, or plaintext keys.
- Reuse `decryptApiKeyForProxy` only; do not reimplement crypto.
- Env required: `DATABASE_URL`, `API_ENCRYPT_KEY` (same as child-key path).

## Requirements

- [ ] Prisma client from `src/prisma.ts` is the only DB access path for provider credentials.
- [ ] Module with injectable lookup + typed resolve result.
- [ ] Decrypt via existing `decryptApiKeyForProxy`.
- [ ] Compatibility type must match route family (`openai` vs `anthropic`).
- [ ] Inactive provider → clear client error (not silent env-miss).
- [ ] Missing provider → same class of error as current unknown provider.
- [ ] 502/500/503 messages must not leak secrets.
- [ ] Unit tests with fixture encrypted key (`encryptApiKey` helper) and mock Prisma lookup.
- [ ] Optional: smoke script against a real DB row (portal fixture).

## Acceptance criteria

- [ ] Request with `model: "{portalProviderName}/…"` routes using portal `apiUrl` + decrypted key from Prisma.
- [ ] Inactive provider → clear 4xx error.
- [ ] Missing provider → clear error (not “set FOO_API_KEY”).
- [ ] Compatibility mismatch does not use the wrong family’s credentials.
- [ ] Tests with fixture encrypted key (no live secrets required for unit tests).
- [ ] DB failure fails closed (503), consistent with **016**.

## Out of scope (follow-ups)

- Redis cache of provider rows (**014**).
- Model alias / pricing join (**011**).
- Portal uniqueness enforcement / ADR (portal **032**).
- Removing static `providers.ts` entirely if still useful for local demo without DB.

## Related

- Portal **032** — field mapping, uniqueness of `name`, encryption contract  
- Gateway **016** — Prisma + decrypt pattern for child keys  
- Gateway **014** — cache provider routing after this ships  
- `src/prisma.ts`, `prisma/schema.prisma` (`LLMProvider`), `src/child-keys/crypto.ts`
