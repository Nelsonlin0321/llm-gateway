## Summary
- Removed the partial unique index that enforced uniqueness for active providers by `(creatorId, name)`.

## Files Touched
- [migration.sql](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/prisma/migrations/20260726001000_add_llm_provider_indexes/migration.sql)

## How To Verify
- `npm --prefix apps/gateway-portal run lint`
- For a fresh DB: run Prisma migrations and confirm multiple active providers can share the same `(creatorId, name)` if desired.

## Follow-ups / Next Steps
- If this migration has already been applied to an existing database, add a new migration to `DROP INDEX "LLMProvider_creatorId_name_active_unique"` (removing it from an old migration only affects fresh installs).
