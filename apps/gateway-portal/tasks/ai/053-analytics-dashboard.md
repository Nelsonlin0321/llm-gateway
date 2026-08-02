# 053 — Analytics dashboard (stacked bar by dimension)

## Summary of changes

Implemented an end-to-end workspace analytics dashboard at `/workspace/analytics` over `event_log`:

1. **Controls**
   - **Metric** (Y-axis): request count, total tokens, cost
   - **Dimension** (stack segments): `provider`, `requestedModel`, `user_name`, plus dynamic keys from `metadata_json` and `child_key_tags_json` (e.g. `env`, `team`)
   - **Filters**: dropdown multi-select on discovered metadata/tag fields + provider/model; **User email** is a single autocomplete over `event_log.user_email` (not duplicated as User / User Email)
   - **Date range** (X-axis): last 7 days, last 30 days, or custom from/to

2. **Visualization**
   - Stacked bar chart (SVG) with hover tooltips, legend, and Y-axis ticks
   - KPI cards for requests / tokens / cost (clickable to switch metric)
   - Breakdown table with share bars per segment

3. **Data layer**
   - `lib/analytics/*` — schema, formatting, colors, SQL aggregation service
   - Server actions: `getAnalyticsMeta`, `getAnalyticsSeries`
   - Preset ranges anchor to the latest available `log_date` so empty “today” padding does not appear when ingest lags

4. **Navigation**
   - Sidebar Analytics enabled → `/workspace/analytics`
   - Workspace overview card marked Live and linked

Default view matches the product example: **request count** stacked by **env** over the **last 7 days**.

## Files touched

- `lib/analytics/schema.ts`
- `lib/analytics/format.ts`
- `lib/analytics/colors.ts`
- `lib/analytics/service.ts`
- `app/server-actions/analytics/get-analytics-meta.ts`
- `app/server-actions/analytics/get-analytics-series.ts`
- `components/analytics/analytics-dashboard.tsx`
- `components/analytics/analytics-controls.tsx`
- `components/analytics/filter-multi-select.tsx`
- `components/analytics/filter-user-email.tsx`
- `components/analytics/analytics-kpi-row.tsx`
- `components/analytics/analytics-breakdown.tsx`
- `components/analytics/stacked-bar-chart.tsx`
- `components/analytics/analytics-section.tsx`
- `components/analytics/analytics-skeleton.tsx`
- `app/workspace/analytics/page.tsx`
- `app/workspace/analytics/loading.tsx`
- `components/workspace/workspace-sidebar.tsx`
- `app/workspace/page.tsx`
- `tests/analytics/format.test.ts`
- `tasks/ai/053-analytics-dashboard.md`

## How to verify

```bash
cd apps/gateway-portal

# Unit tests (includes analytics format + date range helpers)
npm test -- tests/analytics/format.test.ts

# Typecheck
npx tsc --noEmit

# Optional: exercise service against DATABASE_URL
node --import tsx -e '
import { fetchAnalyticsSeries } from "./lib/analytics/service.ts";
const s = await fetchAnalyticsSeries({
  metric: "requestCount",
  dimension: "env",
  datePreset: "7d",
  filters: {},
});
console.log(s.range, s.segmentKeys, s.totals);
'

# UI
npm run dev
# Sign in → Workspace → Analytics
```

## Follow-ups / next steps

- URL query sync (`?metric=&dimension=&from=&to=`) for shareable views
- Cap segments at top-N + “Other” when cardinality is high
- Hourly granularity for short ranges
- Wire overview usage panels to the same query layer
- Optional: index `(log_date, provider)` / `(log_date, requested_model)` if query volume grows
