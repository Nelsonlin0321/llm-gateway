# 006 — DB-backed child key authorization

**Status:** Implemented (see `016-db-backed-child-key-authorization.md`)  
**App:** `gateway-api`  
**Priority:** P0  
**Depends on:** Bearer JWT verify (done, 005); shared DB + `ChildKey` table (portal)  
**Enables:** Revocation, deactivate, rotation invalidation

---

## Context

Today auth only verifies JWT signature + optional `exp`. A deactivated, deleted, or rotated key’s old JWT may still validate cryptographically until expiry.

## Goal

After JWT verify, authorize against Postgres `ChildKey`:

1. Load row by `payload.key_id`.
2. Reject if missing, `isActive=false`, or past `expiresAt`.
3. Prefer also verifying presented plain key matches decrypt(`row.key`) **or** `row.issuedAt === payload.issued_at` so rotation invalidates old tokens.

## Requirements

### Data access
- Read-only Prisma client or `pg` against portal schema (same `DATABASE_URL`).
- Connection pooling suitable for multi-instance gateway.
- Timeouts; fail closed on DB errors for proxy routes (503 or 401 — **recommend 503** with distinct type).

### Service API
```ts
authorizeChildKey(plainApiKey: string, payload: ChildKeyJwtPayload): Promise<AuthzResult>
```
Called from `authenticateChildApiKey` after JWT verify.

### Caching
- Optional Redis cache by `key_id` with short TTL (30–60s); invalidate on miss only for MVP.
- Full cache design in **014**.

## Acceptance criteria

- [ ] Deactivated key → 401 even if JWT unexpired.
- [ ] Deleted key → 401.
- [ ] Rotated key (new `issuedAt`) → old JWT rejected.
- [ ] Unit tests with mocked DB layer.
- [ ] Env docs: `DATABASE_URL`.

## Non-goals

- Writing audit rows from gateway.
- Portal UI for force-revoke (already have delete/toggle).

## Risks

- Latency on every request → cache hot path.
- Schema drift between apps → shared migration ownership or contract tests.  
