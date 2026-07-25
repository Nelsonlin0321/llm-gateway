# Framer - Components

## 1. BUTTONS

### Variants

| Variant | Background | Text | Border | Radius | Height |
|---------|------------|------|--------|--------|--------|
| Primary | `var(--text1)` | `var(--background)` | `1px solid rgba(255,255,255,0.08)` | 8px | 40px |
| Secondary | `var(--surface2)` | `var(--text1)` | `1px solid rgba(255,255,255,0.10)` | 8px | 40px |
| Ghost | transparent | `var(--text2)` | none | 8px | 36px |
| Destructive | `var(--error)` | `#FFFFFF` | `1px solid transparent` | 8px | 40px |

### Specs

| Property | Value |
|----------|-------|
| Large height | 40px |
| Small height | 36px |
| Large padding | 10px 16px |
| Small padding | 8px 12px |
| Font | `Inter` 500 to 600 |
| Hero CTA font | `Outfit` 600 for hero use |
| Icon gap | 8px |

### States

| State | Change |
|-------|--------|
| Hover | Increase contrast or border clarity, never scale aggressively |
| Active | Translate by 1px and slightly darken background |
| Disabled | Reduce opacity to 0.4 |
| Focus | `0 0 0 3px var(--accent-subtle)` ring |

## 2. CARDS / SURFACES

### Standard Card

- Background: `var(--surface1)`
- Border: `1px solid var(--border)`
- Radius: `16px`
- Padding: `24px`
- Shadow: level 1

### Featured Card

- Background: `var(--surface1)` with brighter top edge
- Border: `1px solid color-mix(in srgb, var(--accent) 18%, var(--border))`
- Radius: `16px`
- Padding: `24px`
- Shadow: level 2

### Content Layout

- Title: `--subheading`, `--text1`
- Description: `--body-sm`, `--text2`
- Metadata: `--caption`, `--text3`
- Traces and shortcuts: mono

## 3. INPUTS

### Text Field

| Property | Value |
|----------|-------|
| Height | 40px |
| Background | `var(--surface2)` |
| Border | `1px solid color-mix(in srgb, var(--text1) 10%, transparent)` |
| Focus border | `1px solid color-mix(in srgb, var(--accent) 55%, transparent)` |
| Error border | `1px solid var(--error)` |
| Radius | 8px |
| Padding | 10px 14px |

### States

| State | Treatment |
|-------|-----------|
| Default | Quiet border and dark surface |
| Focus | Blue border plus subtle ring |
| Error | Error border with caption below |
| Disabled | Opacity 0.4 |

## 4. LISTS / DATA ROWS

### Standard Row

| Property | Value |
|----------|-------|
| Min height | 44px |
| Padding | 10px 12px |
| Divider | `1px solid var(--border)` |
| Label font | `Inter`, `--body` |
| Value font | `Inter`, `--body-sm` |

### Interaction States

| State | Treatment |
|-------|-----------|
| Default | Transparent background |
| Hover | `var(--surface1)` |
| Selected | `var(--surface2)` with accent edge |

## 5. NAVIGATION / TAB BAR

### Tab Bar

| Property | Value |
|----------|-------|
| Height | 36px |
| Background | transparent |
| Border | bottom accent on active tab |
| Font | `Inter`, `--caption` |

### Tab States

| State | Treatment |
|-------|-----------|
| Active | `var(--text1)` with `var(--accent)` underline |
| Inactive | `var(--text2)` |
| Hover | `var(--text1)` |

### Navigation Bar

- Title uses display or body depending on context.
- Top navigation stays minimal.
- Avoid oversized badges in nav unless they are small state counters.

## 6. TAGS / CHIPS

| Property | Value |
|----------|-------|
| Height | 28px |
| Padding | 6px 10px |
| Radius | 999px |
| Font | `Inter`, `--caption`, 500 |
| Background | `var(--surface2)` |
| Text color | `var(--text2)` |
| Border | `1px solid color-mix(in srgb, var(--text1) 8%, transparent)` |

### Selected State

- Background: `var(--accent-subtle)`
- Text: `var(--accent)`
- Border: `1px solid color-mix(in srgb, var(--accent) 35%, transparent)`

### Status Variants

- Success: `var(--success-bg)` and `var(--success)`
- Warning: `var(--warning-bg)` and `var(--warning)`
- Error: `var(--error-bg)` and `var(--error)`

## 7. OVERLAYS

### Modal / Dialog

| Property | Value |
|----------|-------|
| Background | `var(--surface1)` |
| Radius | 24px |
| Shadow | level 3 |
| Backdrop | `rgba(5, 6, 8, 0.72)` |
| Max width | 640px |
| Padding | 24px |

### Dropdown / Popover

| Property | Value |
|----------|-------|
| Background | `var(--surface1)` |
| Radius | 16px |
| Shadow | level 2 |
| Border | `1px solid var(--border)` |
| Item height | 36px |

## 8. STATE PATTERNS

### Empty State

- Large icon or compact window glyph in `var(--text3)`
- Headline in `--subheading`
- Description in `--body-sm`
- One clear primary action

### Loading

- Shimmer stays subtle.
- Spinner and skeleton colors should not outshine real content.

### Error

- Inline field errors use `--error`.
- Screen-level errors use a bordered alert on `--error-bg`.

### Disabled

- Opacity 0.4.
- Maintain shape and spacing.

## 9. TOGGLE / SWITCH

| Property | Value |
|----------|-------|
| Track width | 42px |
| Track height | 24px |
| Track radius | 999px |
| Thumb size | 18px |
| Thumb radius | 999px |
| Label font | `Inter`, `--body` |

### States

| State | Track | Thumb |
|-------|------|-------|
| Off | `var(--surface3)` | `var(--text3)` |
| On | `var(--accent)` | `#FAFAFA` |
| Focus | blue-tinted ring | unchanged |

## 10. TABLES

### Header Row

| Property | Value |
|----------|-------|
| Height | 40px |
| Background | transparent |
| Font | `IBM Plex Mono`, `--caption`, 500 |
| Border bottom | `1px solid var(--border)` |

### Body Row

| Property | Value |
|----------|-------|
| Height | 44px |
| Font | `Inter` plus mono traces |
| Row divider | `1px solid var(--border)` |

### Row States

| State | Treatment |
|-------|-----------|
| Hover | `var(--surface1)` |
| Selected | `var(--surface2)` with accent cue |

## 11. BADGES / ALERTS

### Badge

| Variant | Background | Text |
|---------|-----------|------|
| Neutral | `var(--surface1)` | `var(--text2)` |
| Success | `var(--success-bg)` | `var(--success)` |
| Warning | `var(--warning-bg)` | `var(--warning)` |
| Error | `var(--error-bg)` | `var(--error)` |
| Info | `var(--accent-subtle)` | `var(--accent)` |

### Alert

- Radius: 16px
- Padding: 16px
- Border: semantic tint plus visible border
- Title: body-sm at 600 weight
- Description: body-sm at 400 weight
