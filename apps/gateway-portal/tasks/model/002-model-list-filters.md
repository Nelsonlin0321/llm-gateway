# 002 — Model list provider, compatibility, and name filters

## Summary

The organization models page now filters the list from the database. A provider select limits results to one connected provider. A compatibility select limits results to `openai` or `anthropic` (from the joined provider). A search input with placeholder **Search model name** runs PostgreSQL full-text search on `model.name` (`simple` config, prefix tokens). Filters live in the URL as `provider`, `compatibility`, and `q`.

A GIN index on `to_tsvector('simple', name)` backs the name query.

## Files touched

- `app/(workspace)/org/[organizationId]/models/page.tsx` — read `searchParams`
- `components/models/model-management-section.tsx`
- `components/models/model-management-client.tsx`
- `components/models/model-management-skeleton.tsx`
- `components/models/model-list-filters.tsx`
- `app/server-actions/model/get-models.ts`
- `lib/model/schema.ts` — query parsing
- `lib/model/service.ts` — tsquery builder
- `lib/db/schema.ts` — GIN index
- `drizzle/migrations/0002_model_name_fts.sql`
- `tests/model/schema.test.ts`
- `tests/model/service.test.ts`

## How to verify

1. `npm run db:migrate`
2. `node --import tsx --test tests/model/**/*.test.ts`
3. Open `/org/{organizationId}/models`
4. Choose a provider and confirm the list updates
5. Choose a compatibility type and confirm the list updates
6. Type a partial name such as `gpt` and confirm matching models
7. Confirm the URL contains `provider`, `compatibility`, and `q`

## Follow-ups / next steps

- Rank FTS matches with `ts_rank` if the catalog grows
