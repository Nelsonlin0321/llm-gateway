# 054 — Workspace overview real analytics panels

## Summary of changes

Refactored `/workspace` overview to load live data instead of static preview metrics.

1. **Top stats** (per signed-in user)
   - Active / total providers from `llm_provider`
   - Workspace / active child keys from `child_key`
   - Requests (7d) + spend from `event_log` analytics series

2. **Usage this week** — three stacked mini-panels reusing `fetchAnalyticsSeries`:
   - **Spend** → metric `cost`, dimension `provider`
   - **Requests** → metric `requestCount`, dimension `env`
   - **Tokens** → metric `totalToken`, dimension `requestedModel`
   - Legend (top segments + Other), mini stacked bars by day, deep link into Analytics

3. **Control area** cards unchanged (Providers, Keys, Analytics live; others planned).

## Files touched

- `lib/workspace/overview.ts`
- `app/server-actions/workspace/get-workspace-overview.ts`
- `components/workspace/workspace-overview-section.tsx`
- `components/workspace/workspace-usage-panel.tsx`
- `components/workspace/workspace-overview-skeleton.tsx`
- `app/workspace/page.tsx`
- `app/workspace/loading.tsx`
- `tasks/ai/054-workspace-overview-real-analytics.md`

## How to verify

```bash
cd apps/gateway-portal
npx tsc --noEmit
npm run dev
# Sign in → /workspace — panels should show real env/provider/model breakdowns
```

Optional service smoke:

```bash
node --import tsx -e '
import { fetchWorkspaceOverview } from "./lib/workspace/overview.ts";
// pass a real user id from your DB if needed
'
```

## Follow-ups / next steps

- Honor Analytics URL query params (`metric`, `dimension`, `range`) on `/workspace/analytics`
- Optional: per-user scoped usage once event_log is attributed to portal owners
