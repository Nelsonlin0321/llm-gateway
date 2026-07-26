# OpenRouter - Components

All values reference `design-model.yaml` / `tokens.md`. Default examples assume **dark mode**.

---

## Buttons

### Variants

| Variant | Background | Color | Border | When |
|---------|------------|-------|--------|------|
| **Primary** | `--accent` (Grape Accent dark + light) | `--accent-foreground` | none | Main CTA - Get API Key, Confirm |
| **Secondary** | transparent | `--text1` | `1px solid --border-visible` | Explore Models, alternate path |
| **Ghost** | transparent | `--text2` | none | Nav, table row actions |
| **Destructive** | `--error` | `#FCFCFE` | none | Revoke key, delete |

### Spec (Primary / Secondary)

| Property | Value |
|----------|-------|
| Height | 44px (`h-11`) for hero; 36px for dense UI |
| Padding X | 32px hero / 16px dense |
| Radius | 6px (`--radius-control`) |
| Font | 14px, weight 500, Plus Jakarta Sans |
| Gap (icon) | 8px |
| Hover primary | `--accent` at ~88% (`#7624F4E0`) |
| Active primary | accent at 80% opacity |
| Disabled | 50% opacity, `pointer-events: none` |
| Focus | `border-color` focus + 3px accent ring at ~18% |

### Rules

- Never use Volt lime as primary button fill - primary is Grape Accent (`#7624F4`).
- Do not use full-pill radius on default buttons.
- Icon size inside buttons: 16px.

---

## Cards

### Feature / content card

| Property | Value |
|----------|-------|
| Background | `--surface1` (Cloud film ~2%) |
| Border | `1px solid --border` |
| Radius | 8px |
| Padding | 24px |
| Shadow | none (dark) |

### Model / data row card

| Property | Value |
|----------|-------|
| Background | transparent or `--surface1` |
| Hover | `--surface3` |
| Padding | 12px 16px |
| Radius | 8px |
| Selected | `--surface2` + visible border or left accent bar |

### Rules

- Prefer film surfaces over solid `#18181B` blocks.
- Featured app cards may include media at top with 8px radius clip.

---

## Inputs

| Property | Value |
|----------|-------|
| Background | transparent or `--surface1` |
| Border | `1px solid --border-visible` |
| Radius | 6px |
| Padding | 10px 12px |
| Font | 14-16px body |
| Placeholder | `--text3` |
| Focus border | Cloud ~30% alpha (dark) |
| Focus ring | `0 0 0 3px` accent at 18% |
| Error border | `--error` |
| Error ring | `0 0 0 3px rgba(255,45,85,0.12)` |

### Search

Same as input; leading 16px icon at `--text3`; height 36-40px in toolbars.

---

## Tags / Badges

| Property | Value |
|----------|-------|
| Background | `--surface2` or status `*-bg` |
| Color | `--text2` or status foreground |
| Padding | 2px 8px |
| Radius | 4px (not pill unless status chip intentionally round) |
| Font | 12px medium |

### Status map

| Status | FG | BG (dark) |
|--------|----|-----------|
| New | `--accent` | `--accent-subtle` |
| Positive | `--success` | `--success-bg` |
| Warning | `--warning` | `--warning-bg` |
| Error | `--error` | `--error-bg` |

---

## Lists & Tables

### Model catalog list

- Row height ~48-56px
- Hover: `--surface3`
- Selected: stronger film + optional Accent indicator
- Primary column: model name (`--text1`, weight 500)
- Meta: provider, tokens, price in mono (`--text2` / `--text3`)
- Dividers: 1px `--border` or gap-separated cards

### Rules

- Dense is correct. Sparse marketing spacing belongs on landing heroes only.
- Use mono for prices (`$0.80 / M`) and context (`200k`).

---

## Navigation

### Top bar

| Property | Value |
|----------|-------|
| Height | ~64-80px |
| Background | `--background` or slight film |
| Border bottom | optional `1px solid --border` |
| Logo | wordmark Cloud; mark may be Volt (brand only) |
| Links | `--text2`, hover `--text1`, 14px medium |
| CTA | Primary small or full Grape Accent button |

### Tabs

| State | Style |
|-------|-------|
| Idle | `--text2`, no fill |
| Hover | `--text1` |
| Active | `--text1` + bottom border or Accent underline 2px |

### Sidebar (product)

| Property | Value |
|----------|-------|
| Background | `#09090B` solid or Ink |
| Item radius | 6px |
| Active item | `--surface2` / sidebar-accent |
| Width | ~240px |

---

## Overlays

### Modal / dialog

| Property | Value |
|----------|-------|
| Backdrop | `rgba(3, 8, 10, 0.72)` |
| Panel bg | solid near-ink `#080D0F` or elevated film |
| Radius | 12px |
| Border | `1px solid --border-visible` |
| Shadow | elevation level 3 dark |
| Padding | 24px |

### Dropdown / popover

| Property | Value |
|----------|-------|
| Background | `#080D0F` / popover token |
| Border | `1px solid --border` |
| Radius | 8px |
| Item height | 36px |
| Item hover | `--surface2` |

### Tooltip

12px caption, film bg, 4-6px radius, 4px offset.

---

## State Patterns

### Empty

Centered; `--text2` message; optional secondary button. No illustration clutter.

### Loading

Prefer thin indeterminate bar or mono “Loading models…” - avoid colorful skeletons.

### Error

`--error` text; optional `--error-bg` banner with 6px radius.

### Disabled

50% opacity on control; no hover affordance.

---

## Derived components

### Toggle

Not strongly branded on marketing site. **Derived:** 40×24 track, 6px radius (not full pill if brand prefers soft-md), thumb 18px, on-state Grape Accent fill dark and light. Justified by control radius language + accent signal rule.

### Progress

Track `--surface2`, fill `--accent` or `--success`. `stroke-linecap: round` for rings.

---

## Tear-down summary (observed)

| Component | Source | Key observation |
|-----------|--------|-----------------|
| Primary button | homepage CTA | `bg-primary h-11 px-8 rounded-md text-button font-medium` → Grape Accent (skill: dark primary is Accent, not site Volt) |
| Secondary button | Explore Models | `border border-input bg-background` |
| Hero title | homepage h1 | 56px bold tight tracking |
| Cards | feature sections | film + 1px border, 8px radius |
| Tables | models UI patterns | dense rows, mono metrics |
