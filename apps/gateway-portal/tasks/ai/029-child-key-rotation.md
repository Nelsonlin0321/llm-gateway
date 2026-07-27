# 029 — Child API key rotation

**Status:** Done  
**App:** `gateway-portal`  
**Priority:** P1  
**Depends on:** Child keys create/reveal/delete (done), JWT `issued_at` (done)  
**Implemented in:** [037-child-key-rotation.md](./037-child-key-rotation.md)

---

## Context

Keys are immutable once signed. `issued_at` exists so rotations produce distinct tokens. Operators need a safe way to replace a compromised or aged key without losing name/tags/policy metadata.

## Goal

Add **Rotate** action that re-issues a new plain `sk_…` secret (new `issuedAt`, new ciphertext in DB), shows the new secret once, and invalidates the previous secret for gateway auth.

## Requirements

### Behavior

1. Confirm dialog: warn that old secret stops working immediately.
2. Server action `rotateChildKey(id)`:
   - Auth: creator only.
   - Load existing row (name, tags, userEmail, expiresAt; `policy_id` from previous JWT when present).
   - **Decision:** keep same `id` (`key_id` stable for analytics).
   - Sign JWT with new `issued_at` (and `exp` from `expiresAt`).
   - Encrypt and overwrite `key`.
3. Return plaintext secret once (same UX as create reveal dialog).

### Gateway implications

- Auth that only verifies JWT signature will accept old tokens until they expire unless gateway also checks DB `issuedAt` / ciphertext match (see gateway **006** / **016**).
- Document dependency: rotation without gateway DB authz only “replaces stored secret” but old JWTs may still verify cryptographically until `exp`.

## Acceptance criteria

- [x] Rotate yields new `sk_…` string ≠ previous.
- [x] DB ciphertext updated; list still shows same name/tags.
- [x] Old secret cannot be revealed (only new ciphertext stored).
- [x] Work log + unit tests for service builder.

## Open questions

1. Keep `key_id` stable (recommended) or issue a new id on rotate? **keep `key_id` stable.**
2. Should rotation clear `expiresAt` or preserve it? **preserve.**
