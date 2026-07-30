## Summary
- Restored the original migration that created the `LLMProvider_creatorId_name_active_unique` partial unique index.
- Added a new Prisma migration that drops the index for existing databases (safe to run on fresh databases via `IF EXISTS`).

## Files Touched
- [migration.sql](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/prisma/migrations/20260726001000_add_llm_provider_indexes/migration.sql)
- [migration.sql](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/prisma/migrations/20260728170000_drop_llm_provider_active_unique_index/migration.sql)

## How To Verify
- Apply migrations on a database (e.g. `npx prisma migrate dev` in `apps/gateway-portal`) and confirm the index is not present after the latest migration.

## Follow-ups / Next Steps
- If you want to enforce a different uniqueness rule (e.g. only by `(creatorId, name, compatibilityType)`), add a replacement index in a subsequent migration.
