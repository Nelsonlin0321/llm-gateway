# 004 — Provider list compatibility filter and name search

## Summary

The organization providers page now filters the list from the database. A compatibility select limits results to `openai` or `anthropic`. A search input with placeholder **Search provider name** runs PostgreSQL full-text search on `llm_provider.name` (`simple` config, prefix tokens). Filters live in the URL as `compatibility` and `q`.

A GIN index on `to_tsvector('simple', name)` backs the name query.

## Files touched

- `app/(workspace)/org/[organizationId]/providers/page.tsx` — read `searchParams`
- `components/llm-providers/providers-management-section.tsx`
- `components/llm-providers/provider-management-client.tsx`
- `components/llm-providers/provider-list-filters.tsx`
- `app/server-actions/llm-provider/get-providers.ts`
- `lib/llm-provider/schema.ts` — query parsing
- `lib/llm-provider/service.ts` — tsquery builder
- `lib/db/schema.ts` — GIN index
- `drizzle/migrations/0001_provider_name_fts.sql`
- `tests/llm-provider/schema.test.ts`
- `tests/llm-provider/service.test.ts`

## How to verify

1. `npm run db:migrate`
2. `node --import tsx --test tests/llm-provider/**/*.test.ts`
3. Open `/org/{organizationId}/providers`
4. Choose a compatibility type and confirm the list updates
5. Type a partial name such as `deep` and confirm matching providers
6. Confirm the URL contains `compatibility` and `q`

## Follow-ups / next steps

- Rank FTS matches with `ts_rank` if the catalog grows
