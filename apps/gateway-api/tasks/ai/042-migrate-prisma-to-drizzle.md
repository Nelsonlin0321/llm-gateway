# 042 — Migrate Prisma ORM to Drizzle

## Summary

Replaced Prisma with Drizzle ORM for all database access in `gateway-api`.

- Added Drizzle schema mirroring existing Postgres tables (`src/db/schema.ts`).
- Added Neon serverless Drizzle client (`src/lib/db.ts`) with lazy init so unit tests can import without `DATABASE_URL`.
- Rewrote child-key authorization, provider/model resolution, and root model listing queries to Drizzle.
- Introduced `childKeyRepository` as a mockable lookup surface (replaces Prisma client method reassignment in tests).
- Removed `@prisma/client`, `@prisma/adapter-neon`, `prisma`, generated clients, and `prisma.config.ts`.
- Added `drizzle-kit` scripts: `db:generate`, `db:migrate`, `db:studio`.

## Files touched

- `src/db/schema.ts` (new)
- `src/lib/db.ts` (new; replaces `src/lib/prisma.ts`)
- `src/child-keys/repository.ts` (new)
- `src/child-keys/authorize.ts`, `types.ts`, `service.ts`
- `src/providers/resolve.ts`, `src/index.ts`
- `scripts/drizzle-query.ts` (replaces `scripts/prisma-query.ts`)
- `tests/child-keys/auth.test.ts`, `authorize.test.ts`
- `drizzle.config.ts`, `package.json`, `README.md`

## How to verify

```bash
cd apps/gateway-api
npm test
npx tsc --noEmit
```

## Follow-ups

- Baseline Drizzle migrations against the existing Neon schema before the first production `db:migrate`.
- Optionally extract a shared schema package used by both portal and gateway-api.
