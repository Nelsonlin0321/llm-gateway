# 046 — Migrate Prisma ORM to Drizzle

## Summary

Replaced Prisma with Drizzle ORM for all database access in `gateway-portal`.

- Added Drizzle schema for auth tables + `LLMProvider` / `Model` / `ChildKey` (`lib/db/schema.ts`).
- Added Neon serverless Drizzle client (`lib/db/index.ts`).
- Switched Better Auth to `@better-auth/drizzle-adapter`.
- Converted all server actions (providers, models, child keys) and service layer types from Prisma to Drizzle.
- Kept historical SQL under `prisma/migrations/` with a README; removed `prisma/schema.prisma` and Prisma packages/clients.
- Added `drizzle-kit` scripts: `db:generate`, `db:migrate`, `db:studio`.

## Files touched

- `lib/db/schema.ts`, `lib/db/index.ts` (new; replaces `lib/prisma.ts`)
- `lib/auth.ts`
- `lib/llm-provider/service.ts`, `lib/model/service.ts`, `lib/child-key/service.ts`
- `app/server-actions/llm-provider/*`, `model/*`, `child-key/*`
- `drizzle.config.ts`, `package.json`, `AGENTS.md`
- `prisma/README.md` (historical migrations note)
- Root `README.MD` (setup / stack references)

## How to verify

```bash
cd apps/gateway-portal
npm test
npx tsc --noEmit
```

## Follow-ups

- Baseline Drizzle migrations against the already-applied Prisma migrations before shipping the first Drizzle-managed migration.
- Confirm Better Auth session flows end-to-end against Neon after deploy.
- Make sure the Drizzle schema is aligned to the better auth standards.
- Change the prisma key id to be uuid
- Change the database to be snake_case
- Check the relation logic of drizzle schema
