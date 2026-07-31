# Historical Prisma migrations

These SQL migrations created the current PostgreSQL schema while the project used Prisma.

Application code now uses **Drizzle ORM** (`lib/db/schema.ts` in portal, `src/db/schema.ts` in gateway-api).

Do **not** run `prisma migrate` against this folder. For new schema changes:

```bash
npm run db:generate   # drizzle-kit generate
npm run db:migrate    # drizzle-kit migrate
```

When introducing the first Drizzle-managed migration, baseline against the already-applied schema so existing tables are not recreated.
