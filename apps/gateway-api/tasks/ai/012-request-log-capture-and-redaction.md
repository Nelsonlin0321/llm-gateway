# 012 — Request log capture and redaction policy

**Status:** Pending  
**App:** `gateway-api`  
**Priority:** P2  
**Depends on:** 010 event emission  

---

## Context

Enterprise vision includes searchable request/response logs with PII controls. Full payload capture is sensitive and large.

## Goal

Define **capture levels** (env/config):

| Level | Contents |
|-------|----------|
| `metadata` | tokens, model, latency, status, tags (default MVP) |
| `redacted` | metadata + hashed/truncated prompts |
| `full` | full bodies (dev only) |

Implement redaction helpers (API keys, emails, bearer headers) before any async publish/storage.

## Acceptance criteria

- [ ] Default level never stores Authorization headers or master keys.
- [ ] Configurable level via env.
- [ ] Unit tests for redactors.

## Non-goals

- Portal log explorer UI (portal follow-up).  
