# 001 — Snapshot seed includes all schema tables

## Summary

`TABLE_SPECS` in `scripts/snapshot-seed-data.ts` now covers every table in `lib/db/schema.ts`, in FK-safe insert order (clear uses the reverse). Previously the snapshot omitted organization, invitation, audit log, request/event logs, and dead-letter tables, and referenced `member` without importing it.

## Files touched

- `scripts/snapshot-seed-data.ts`

## How to verify

1. Confirm `TABLE_SPECS` keys match every `pgTable` in `lib/db/schema.ts`:
   user, organization, verification, session, account, member, invitation, auditLog, llmProvider, models, childKeys, requestLog, eventLog, deadRequestLog, deadEventLog
2. `npx tsc --noEmit` from `apps/gateway-portal`

## Follow-ups / next steps

- Re-export `scripts/seed/snapshot.json` from a source database so existing seeds pick up the new tables
