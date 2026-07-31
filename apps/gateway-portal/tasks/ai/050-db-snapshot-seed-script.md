# 050 — DB snapshot seed script

## Summary of changes

Added a Drizzle script that snapshots selected portal tables from `DATABASE_URL` into a JSON seed file, and can re-seed another database with the same schema (typically empty).

**Tables included** (FK-safe insert order):

1. `user`
2. `session`
3. `account`
4. `verification`
5. `llmProvider` (`llm_provider`)
6. `models` (`model`)
7. `childKeys` (`child_key`)

Default output: `scripts/seed/snapshot.json` (gitignored — may contain secrets).

## Files touched

- `scripts/snapshot-seed-data.ts` — export + seed commands
- `package.json` — `db:snapshot` / `db:seed` npm scripts
- `.gitignore` — ignore `scripts/seed/snapshot.json`
- `scripts/seed/snapshot.json` — generated locally (not committed)

## How to verify

From `apps/gateway-portal` with `DATABASE_URL` set:

```bash
# Export current DB → scripts/seed/snapshot.json
npm run db:snapshot

# Or explicit path
npx tsx scripts/snapshot-seed-data.ts export ./scripts/seed/my-snapshot.json

# Point DATABASE_URL at empty target DB (same schema/migrations), then:
npm run db:seed
# or replace existing rows in these tables:
npx tsx scripts/snapshot-seed-data.ts seed --clear
```

Live export run on source DB produced: 1 user, 1 session, 1 account, 0 verification, 5 llmProvider, 5 models, 1 childKeys.

## Follow-ups / next steps

- Run migrations on the target DB before `db:seed`.
- Prefer `--clear` only when intentionally overwriting these tables on the target.
- Do not commit real snapshot JSON (secrets: password hashes, encrypted provider keys, child key material, sessions).
