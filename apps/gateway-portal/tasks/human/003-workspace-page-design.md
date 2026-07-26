# Workspace Page Design

**Status:** Design (ready for implementation planning)  
**Product:** `gateway-portal`  
**Route (proposed):** `/workspace` (primary authenticated home; redirect from `/dashboard` later if desired)  
**Sources:** `AGENTS.md`, `PROJECT.MD`, current portal UI (`openrouter-design`)

---

## 1. Purpose

The **Workspace** page is the authenticated control-plane home for a single customer account (individual user or organization). It is not a marketing landing page and not a dump of every admin form.

It answers four operator questions in under ten seconds:

1. **What is this workspace?** Name, plan/role, and who is signed in.
2. **Is the gateway ready to serve traffic?** Providers connected, keys issued, policies in place.
3. **What is happening right now?** Spend, requests, errors, budget pressure.
4. **What should I do next?** Clear entry points into providers, keys, policies, pricing, and analytics.

It sits as the management hub **between upstream AI providers and downstream consumers**, matching the product definition in `AGENTS.md`.

---

## 2. Product fit (from AGENTS.md)

### 2.1 Users and jobs-to-be-done

| User                      | Job on Workspace                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| **Platform admin**        | See global readiness: providers, pricing coverage, policies, analytics signals, audit pressure. |
| **Team admin**            | See team-scoped keys, budgets, and spend without touching master credentials.                   |
| **Developer / app owner** | Find assigned child keys, quotas, and project/app usage.                                        |
| **Finance / ops**         | Scan cost, budget consumption, and allocation by team/project/key.                              |

### 2.2 Core product areas represented (not fully implemented on this page)

The Workspace **surfaces status and navigation** into:

1. Authentication / session (who is here, role)
2. Provider management (master URL + key health)
3. Model pricing (coverage vs missing prices)
4. Child API keys (counts, recent issuance)
5. Policies (rate limits, model access, budgets)
6. Analytics (tokens, cost, errors, trends)
7. Audit logging (recent sensitive actions)

### 2.3 Dimensions the page must respect

Any summary metric or deep-link filter should be expressible with:

- provider · model · team · user · project · application · api key · time range

Workspace home uses **workspace-wide aggregates** by default, with optional time-range control (e.g. last 24h / 7d / 30d). Drill-down preserves dimension context when navigating to Analytics or Keys.

### 2.4 Domain concepts (must stay correct in copy and data)

| Concept                        | Meaning on Workspace                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| **Master provider credential** | Upstream connection; show count + active/inactive; never show raw secret.          |
| **Child API key**              | Downstream credential for team/user/project/app; show counts by status.            |
| **Pricing configuration**      | Required for cost truth; surface “models missing price” as a readiness gap.        |
| **Policies**                   | Rate limits, model allowlists, budgets; surface violations and approaching limits. |
| **Analytics**                  | Requests, tokens, cost, errors, latency; high-level only on this page.             |

---

## 3. Goals and non-goals

### Goals

- Single authenticated home that feels like a **production admin console**, not a demo marketing page.
- Readiness + spend visibility in one scroll on desktop.
- Secure defaults: no master API keys, no full child secrets, no unnecessary PII.
- Align with **openrouter-design** (Ink canvas, Grape Accent, film surfaces, compact density).
- Progressive disclosure: empty and partial-setup states guide first-time admins.

### Non-goals (v1)

- Full analytics chart builder (belongs on `/analytics`).
- Full CRUD for providers/keys/policies (deep pages own those).
- Multi-workspace switcher with billing (design hooks only; implement later).
- Real-time websocket live tail (poll or stale-friendly snapshots are enough for v1).

---

## 4. Information architecture

### 4.1 Nav placement

Left sidebar as the primary nav:

| Label         | Href                         | Notes                         |
| ------------- | ---------------------------- | ----------------------------- |
| **Workspace** | `/workspace`                 | Active when on workspace home |
| Providers     | `/providers`                 | Existing                      |
| Pricing       | `/pricing`                   | Future                        |
| Keys          | `/keys`                      | Future                        |
| Policies      | `/policies` (or `/workflow`) | Future                        |
| Analytics     | `/analytics`                 | Future                        |

Secondary (header or overflow): Settings, Audit, Sign out.

### 4.2 Page hierarchy

```
/workspace/overview                          ← this design
/workspace/settings                 ← later: name, members, roles
/workspace/members                  ← later: invites, RBAC
/workspace/providers, /workspace/models, /workspace/policies, ...   ← domain detail pages
/workspace/analytics                  ← future: deep-linkable charts
```

### 4.3 Default post-login destination

After successful sign-in, redirect to **`/workspace/overview`**.

---

## 5. Page layout

### 5.1 Structure (desktop, top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ Portal header (full width)                                  │
├─────────────────────────────────────────────────────────────┤
│ Page chrome (max content width, horizontal padding)         │
│                                                             │
│  A. Workspace identity strip                                │
│  B. Time range control (24h / 7d / 30d)                     │
│  C. KPI metric row (5–6 compact cards)                      │
│  D. Readiness / setup checklist (if incomplete)             │
│  E. Two-column main:                                        │
│       Left  – Usage & cost snapshot                         │
│       Right – Policy health + budget pressure               │
│  F. Domain launch grid (Providers, Keys, Pricing, …)        │
│  G. Recent activity (audit-style list)                      │
│  H. Dimension shortcut chips (team / project / app filters) │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Mobile

- Single column stack: identity → KPIs (2-col grid) → checklist → usage → policy → launch cards → activity.
- Time range as a compact select.
- Horizontal scroll only for nav; not for KPI labels.

### 5.3 Visual system (openrouter-design)

| Element     | Spec                                                           |
| ----------- | -------------------------------------------------------------- |
| Background  | Ink `#03080A`                                                  |
| Cards       | Film surface + 1px Cloud border, radius 8px                    |
| Primary CTA | Grape Accent `#7624F4`, radius 6px                             |
| Metrics     | Geist Mono for numbers, slugs, key IDs                         |
| Titles      | Plus Jakarta Sans, product density (prefer ≤24px on this page) |
| Status      | Success / warning / error tokens from design system            |
| Elevation   | Flat; no decorative mesh glow                                  |

---

## 6. Section specifications

### A. Workspace identity strip

**Content**

- Workspace display name (fallback: “Personal workspace” until org entity exists)
- Role badge: Platform admin | Team admin | Member | Finance (from session/RBAC when available)
- Signed-in user email (mono optional for email)
- Optional plan/status pill: “Self-hosted” / “Open source” for now

**Actions**

- Primary: **Manage providers** → `/providers`
- Secondary: **Issue child key** → `/keys` (or create modal when built)
- Ghost: **Workspace settings** → `/workspace/settings` (disabled or “Coming soon” until built)

**Empty / missing org**

- If multi-tenant Workspace entity does not exist yet, treat the authenticated user as a personal workspace:  
  title = user name or “My workspace”.

---

### B. Time range

- Control: segmented buttons or select — `24h` | `7d` | `30d` (default `7d`).
- Applies to KPIs, usage snapshot, and activity feed.
- Persist preference in URL query: `?range=7d` so links are shareable.

---

### C. KPI metric row

Six compact metrics (hide or zero-state when data missing):

| KPI                | Definition                                  | Primary deep-link                                        |
| ------------------ | ------------------------------------------- | -------------------------------------------------------- |
| **Providers**      | Active master providers / total             | `/workspace/providers`                                   |
| **Child keys**     | Active keys                                 | `/workspace/keys`                                        |
| **Requests**       | Count in range                              | `/workspace/analytics?metric=requests`                   |
| **Tokens**         | Input + output (or total) in range          | `/workspace/analytics?metric=tokens`                     |
| **Spend**          | Estimated cost from pricing metadata        | `/workspace/analytics?metric=cost`                       |
| **Budget at risk** | Keys/teams ≥ threshold (e.g. 80%) of budget | `/workspace/policies` or `/workspace/keys?filter=budget` |

**Display rules**

- Mono for values (`12`, `3.8k`, `$74.3k`, `99.2%`).
- Subtle caption under value (definition in one line).
- Warning/error color when spend or error rate exceeds thresholds (product-configurable later).

---

### D. Readiness checklist

Shown only while setup is incomplete. Collapses or becomes “All systems ready” badge when complete.

Checklist items (map 1:1 to AGENTS core areas):

| Step                  | Complete when                               | CTA               |
| --------------------- | ------------------------------------------- | ----------------- |
| 1. Sign-in verified   | Session exists                              | —                 |
| 2. Connect a provider | ≥1 active `LLMProvider`                     | Add provider      |
| 3. Configure pricing  | ≥1 model price (when pricing entity exists) | Configure pricing |
| 4. Issue a child key  | ≥1 child key (when keys entity exists)      | Create key        |
| 5. Attach a policy    | ≥1 rate/budget/model policy                 | Add policy        |

**v1 with only providers shipped:** show steps 1–2 as live; steps 3–5 as “Upcoming” with muted CTAs (no fake completion).

---

### E1. Usage & cost snapshot (left)

**Purpose:** Operator-grade summary without full analytics.

**Content**

- Requests sparkline or simple bar (optional v1.1; table is fine for v1)
- Token split: input vs output
- Estimated cost (call out if pricing incomplete: “Cost incomplete — N models unpriced”)
- Error rate % and p50/p95 latency if available; otherwise hide latency row

**Empty**

- “No gateway traffic in this range. Issue a child key and send requests through the proxy.”

**CTA:** View analytics

---

### E2. Policy health & budgets (right)

**Content**

- Counts: policies enforcing rate limits / model allowlists / budgets
- List top 3 **budget pressure** items: owner (team/project/key), % used, remaining
- List top 3 **recent denials** if available (rate limit, model blocked, budget exceeded)

**Empty**

- “No policies yet. Governance is open: anyone with a child key can call allowed upstream routes.”

**CTA:** Manage policies

---

### F. Domain launch grid

Four to six cards, equal weight, dense:

| Card           | Description                                 | Primary action |
| -------------- | ------------------------------------------- | -------------- |
| **Providers**  | Master API URLs and encrypted credentials   | Open providers |
| **Pricing**    | Input/output token costs for accurate spend | Open pricing   |
| **Child keys** | Downstream access for teams, projects, apps | Open keys      |
| **Policies**   | Rate limits, model access, budgets          | Open policies  |
| **Analytics**  | Usage, tokens, cost, errors by dimension    | Open analytics |
| **Audit**      | Sensitive admin actions                     | Open audit     |

Each card: title, one-line description from product language, optional live count chip, single CTA.

---

### G. Recent activity (audit-style)

Table or stacked rows (last 8–12 events):

| Column | Example                                              |
| ------ | ---------------------------------------------------- |
| Time   | relative + absolute tooltip                          |
| Actor  | user email or system                                 |
| Action | “Created provider”, “Rotated key”, “Raised budget”   |
| Target | resource path or name (`openai`, `team-growth/prod`) |
| Result | success / failed / needs review (badge)              |

**Rules**

- Paths and IDs in mono.
- Never log decrypted secrets.
- Link row target to the relevant detail page when possible.
- Empty: “No administrative actions yet.”

---

### H. Dimension shortcuts

Chip row: **By team** · **By project** · **By application** · **By provider** · **By key**

Clicking opens Analytics (or Keys) with that group-by preset.  
If analytics not built, chips disabled with tooltip “Coming soon”.

---

## 7. States

| State                  | Behavior                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Loading**            | Skeleton for KPI row + two panels + list (match existing provider skeleton density). |
| **Unauthenticated**    | Redirect to `/sign-in` with return URL `/workspace`.                                 |
| **Empty workspace**    | Checklist dominant; KPIs zeroed; launch grid still visible.                          |
| **Partial setup**      | Live data for providers; placeholders for keys/policies/analytics.                   |
| **Error (data fetch)** | Inline error on failing panel; rest of page remains usable.                          |
| **Forbidden**          | If RBAC later blocks workspace view, show role message (not a blank screen).         |

---

## 8. Permissions (future-ready)

Design for role filters even if v1 is “any authenticated user owns their data”:

| Capability        | Platform admin | Team admin  | Developer       | Finance        |
| ----------------- | -------------- | ----------- | --------------- | -------------- |
| See all providers | ✓              | — (or none) | —               | —              |
| See all keys      | ✓              | Team-scoped | Own             | Aggregate only |
| See spend         | ✓              | Team        | Own project/app | ✓              |
| See audit         | ✓              | Limited     | —               | Limited        |
| Manage policies   | ✓              | Team        | —               | —              |

Workspace page should accept a **viewer scope** object from the server so UI can hide panels without redesign.

---

## 9. Data model (design-level)

### 9.1 Existing

- `User`, `Session`, `LLMProvider` (per creator)

### 9.2 Proposed entities (for Workspace product completeness)

Not all required for first UI slice; order by dependency:

1. **Workspace** — `id`, `name`, `slug`, `createdAt`
2. **WorkspaceMember** — `workspaceId`, `userId`, `role`
3. **Team / Project / Application** — ownership scopes for keys and analytics
4. **ChildApiKey** — secret hash, owner type/ref, status, limits
5. **Policy / Budget** — attached to key or scope
6. **ModelPricing** — provider, model, input/output prices
7. **UsageAggregate** (or query from gateway logs) — for KPIs
8. **AuditEvent** — actor, action, target, result, timestamp

### 9.3 v1 implementation slice (recommended)

Ship Workspace **UI + real provider stats** first:

- Session user
- Provider counts (active/total) from existing `LLMProvider`
- Checklist steps 1–2 live
- Other KPIs and panels as honest empty/upcoming states
- No fabricated analytics numbers in production

---

## 10. API / server actions (proposed)

| Action                                   | Responsibility                                              |
| ---------------------------------------- | ----------------------------------------------------------- |
| `getWorkspaceOverview({ range })`        | Aggregate KPIs + readiness flags for current user/workspace |
| `getWorkspaceActivity({ range, limit })` | Recent audit events (or empty array)                        |
| Existing `get-providers`                 | Reuse for provider list/count                               |

Prefer **Server Components** + server actions; client only for time-range and interactive toggles.

---

## 11. UX copy guidelines

- Voice: direct, infrastructure-confident, developer-first (openrouter-design).
- Prefer concrete nouns: “providers”, “child keys”, “budgets”, “tokens”.
- Avoid hype: no “revolutionary AI platform”.
- Cost incomplete → say so; never invent spend.

Examples:

- “Connect an upstream provider so the gateway can route traffic.”
- “Cost incomplete: 4 models have no pricing metadata.”
- “3 child keys are above 80% of their monthly budget.”

---

## 12. Interaction and motion

- Time-range change: soft refresh of KPI + panels (200ms ease).
- No page-blocking full reloads if partial data can update.
- Toasts only for mutations started from this page (rare in v1).
- Deep links open target pages; avoid multi-step wizards on Workspace itself.

---

## 13. Accessibility

- KPI values associated with labels (`aria-labelledby` or visible captions).
- Status badges not color-only (include text: Active / Warning).
- Keyboard focus on time-range and all CTAs.
- Contrast meets text-on-Ink requirements from design tokens.

---

## 14. Implementation phases

### Phase 0 — Design approval (this doc)

- Product confirms Workspace as post-login home and section set.

### Phase 1 — Shell + identity + provider readiness

- Route `/workspace`, auth gate, header nav item.
- Identity strip, time range (UI only), provider KPIs, checklist steps 1–2.
- Domain launch grid with real/disabled links.
- openrouter-design layout only.

### Phase 2 — Keys, policies, pricing placeholders → real data

- Wire entities as they land.
- Budget pressure + policy health panels.

### Phase 3 — Analytics snapshot + audit feed

- Usage/cost panel from aggregates.
- Activity list from audit log.

### Phase 4 — Multi-member workspace

- Workspace entity, invites, RBAC-aware overview.

---

## 15. Success criteria

- Authenticated user lands on a page that reflects **control-plane readiness**, not marketing content.
- Provider-only customers see truthful status and a clear next action.
- No decrypted master or child secrets appear in HTML, network responses, or audit rows.
- Metrics and navigation align with AGENTS dimensions and core product areas.
- Visual system matches openrouter-design dark product chrome.
- Page remains usable with partial product surface area (no fake production metrics).

---

## 16. Open questions

1. Is **Workspace** multi-tenant from day one, or personal-until-org later?
2. Should `/dashboard` redirect permanently to `/workspace`?
3. Default time range: 24h vs 7d for ops vs finance personas?
4. Budget threshold for “at risk”: 80% hard-coded or workspace setting?
5. Do finance users get a spend-first variant of the same page or the same layout with different defaults?

---

## 17. Out-of-scope references

Related human tasks:

- `000-provider-config.md` — providers (feeds readiness + KPI)
- `001-child-key-management.md` — keys (feeds KPI + launch card)
- `002-refactor-llm-provider.md` — provider model changes

Related AI logs:

- Design system: openrouter-design skill + portal alignment tasks

---

## 18. Wireframe (low fidelity)

```
┌─ header: Workspace | Providers | Pricing | Keys | Policies | Analytics ─┐
├──────────────────────────────────────────────────────────────────────────┤
│  [GW] Acme Gateway          Platform admin     you@acme.com   [7d ▾]     │
│  Manage providers   Issue child key   Settings                             │
├──────────┬──────────┬──────────┬──────────┬──────────┬───────────────────┤
│ Providers│ Keys     │ Requests │ Tokens   │ Spend    │ Budget at risk    │
│  3 / 4   │  128     │  9.2M    │  4.8B    │  $12.4k  │  3                │
├──────────────────────────────────────────────────────────────────────────┤
│  Readiness: ✓ Auth  ✓ Provider  ○ Pricing  ○ Keys  ○ Policy              │
├───────────────────────────────┬──────────────────────────────────────────┤
│  Usage & cost (7d)            │  Policy health                           │
│  req · tokens · $ · errors    │  budgets near limit · recent denials     │
│  [View analytics]             │  [Manage policies]                       │
├───────────────────────────────┴──────────────────────────────────────────┤
│  [Providers] [Pricing] [Keys] [Policies] [Analytics] [Audit]             │
├──────────────────────────────────────────────────────────────────────────┤
│  Recent activity                                                         │
│  10:42  platform-admin  Created provider  openai     Synced              │
│  09:15  team-admin      Issued child key  project-rag  Synced            │
├──────────────────────────────────────────────────────────────────────────┤
│  Group by: Team · Project · Application · Provider · Key                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 19. Acceptance checklist for implementers

- [ ] Route exists and is auth-protected
- [ ] Header marks Workspace active
- [ ] Identity strip shows user (and workspace name when available)
- [ ] Provider KPI reflects real DB counts
- [ ] Checklist never marks keys/pricing/policies complete without data
- [ ] No secret material in props or HTML
- [ ] Empty states use product language from this doc
- [ ] Dark openrouter-design tokens only (no Framer blue-stage leftovers)
- [ ] Mobile single-column usable without horizontal page scroll
- [ ] Work log written under `tasks/ai/` when implemented
