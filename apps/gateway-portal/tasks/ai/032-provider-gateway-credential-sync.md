# 032 — Provider credentials consumable by gateway-api

**Status:** Pending  
**App:** `gateway-portal` (+ contract for `gateway-api`)  
**Priority:** P0  
**Depends on:** LLMProvider encrypted vault (done)  
**Enables:** Gateway routing without env-hardcoded provider keys

---

## Context

Portal stores encrypted master provider credentials (`encryptedApiKey`, `apiUrl`, `compatibilityType`). Gateway still loads provider config from **env** (`providers.ts` + `apiKeyEnv`). Production needs a single source of truth.

## Goal

Define and implement a **safe read path** so gateway can resolve upstream URL + decrypted master key for a routing prefix (`provider.name`) without exposing secrets to the browser.

## Options (choose one in implementation)

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A | Shared Postgres; gateway uses Prisma/SQL + `API_ENCRYPT_KEY` | Simple, already same DB possible | Couples deploy secrets |
| B | Internal portal API (`/api/internal/providers/:name`) with service token | Clear boundary | Extra hop, auth for service |
| C | Sync job → Redis/encrypted cache for gateway | Fast hot path | Complexity |

**Recommendation:** A for MVP if both services share `DATABASE_URL` + `API_ENCRYPT_KEY`; add Redis cache later (gateway **014**).

## Portal deliverables

1. Document encryption format + field mapping (`name` → routing prefix, `apiUrl`, `encryptedApiKey`, `isActive`).
2. Ensure provider `name` uniqueness rules remain strict for routing.
3. Optional: internal service-token route if Option B.
4. Never return decrypted keys from Server Actions to the browser.

## Acceptance criteria

- [ ] Written contract in task completion log / short ADR snippet.
- [ ] Gateway can decrypt at least one real portal provider record in a smoke test (script or unit with fixtures).
- [ ] Browser network traces show no master API keys.

## Related

- Gateway task **007** implements the consumer side.  
