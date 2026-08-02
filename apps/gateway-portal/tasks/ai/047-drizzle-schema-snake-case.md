# 047 — Drizzle schema snake_case columns with camelCase TS models

## Summary

Refactored both Drizzle schemas so PostgreSQL identifiers use snake_case while TypeScript model fields stay camelCase.

- SQL tables: `llm_provider`, `model`, `child_key` (auth tables stay `user` / `session` / `account` / `verification`)
- SQL enum: `compatibility_type` (was `CompatibilityType`)
- SQL columns/indexes: e.g. `email_verified`, `api_url`, `creator_id`, `llm_provider_name_compatibility_type_key`
- TypeScript exports and property access unchanged: `emailVerified`, `apiUrl`, `creatorId`, `LLMProvider`, etc.
- Regenerated portal baseline migration to match.
- Added `casing: "snake_case"` to gateway-api `drizzle.config.ts` (portal already had it; both DB clients already use it).

## Files touched

- `apps/gateway-portal/lib/db/schema.ts`
- `apps/gateway-api/src/db/schema.ts`
- `apps/gateway-api/drizzle.config.ts`
- `apps/gateway-portal/drizzle/migrations/0000_plain_lethal_legion.sql` (replaced prior baseline)
- `apps/gateway-portal/drizzle/migrations/meta/*`

## How to verify

```bash
cd apps/gateway-portal
npx tsc --noEmit
npm run db:generate   # should report no schema changes

cd ../gateway-api
bunx tsc --noEmit
```

## Follow-ups / next steps

- If a database already applied the previous camelCase/PascalCase baseline (`0000_common_the_fury`), do **not** re-run the new create migration as-is. Either reset that DB and apply the new baseline, or generate a rename migration (`ALTER TABLE` / `RENAME COLUMN`) from the live schema.
- Confirm Better Auth sign-in/session flows against the snake_case auth columns after migrate.
- Mark complete the snake_case follow-up noted in `046-migrate-prisma-to-drizzle.md`.

## Update — drop hardcoded column aliases

Portal `lib/db/schema.ts` no longer passes explicit snake_case column name strings. Columns use bare builders (`text()`, `boolean()`, …); `casing: "snake_case"` in `drizzle.config.ts` and `lib/db/index.ts` maps camelCase keys to SQL. `db:generate` reports no schema diff. Gateway-api schema still has explicit aliases if parity is needed later.
