# 049 — Event log table schema

## Summary of changes

Added a Drizzle table for gateway request event logging (routing, attribution, tokens, cost):

- Table: `event_log` (`eventLog`)
- Composite primary key: (`id` = request_id, `log_date`)
- Soft FKs: `provider_id` → `llm_provider`, `child_key_id` → `child_key`, `child_key_creator_id` → `user` (`onDelete: "set null"`)
- Token/cost fields: `input_token`, `output_token`, `cached_input_token`, `cost`
- Documented intended `PARTITION BY RANGE (log_date)` for a custom SQL migration

Schema only — no migration generated.

## Files touched

- `apps/gateway-portal/lib/db/schema.ts`

## How to verify

- Inspect `eventLog` / types `EventLog` and `NewEventLog` in `lib/db/schema.ts`
- Optional later: custom SQL migration for partitioned parent + partitions

## Follow-ups / next steps

- Custom SQL migration with `PARTITION BY RANGE (log_date)` for both `request_log` and `event_log`
- Wire gateway-api ingest to write `event_log` (+ optional `request_log` payloads)
- Indexes for analytics queries (e.g. `child_key_id`, `provider_id`, `logged_at`) when needed
