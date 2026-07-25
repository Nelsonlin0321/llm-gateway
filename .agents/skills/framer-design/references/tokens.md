# Framer - Tokens

## 0. PRIMITIVES

### Color Ramps

**Neutral** (pure black to cool white)

| Step | Hex | Use |
|------|-----|-----|
| 50 | `#FFFFFF` | Light mode background, brightest text |
| 100 | `#F6F6F7` | Light surfaces |
| 200 | `#EBEBEE` | Light borders |
| 300 | `#D8D9DE` | Strong light borders |
| 400 | `#A9ADB8` | Disabled text |
| 500 | `#7C8190` | Tertiary copy |
| 600 | `#5B6070` | Secondary copy |
| 700 | `#373B47` | Strong dark borders |
| 800 | `#1E222B` | Dark secondary surfaces |
| 900 | `#0D0F14` | Dark primary surfaces |
| 950 | `#050608` | Stage background |

**Brand** (publish blue)

| Step | Hex |
|------|-----|
| 50 | `#EDF7FF` |
| 100 | `#D8EEFF` |
| 200 | `#B7DEFF` |
| 300 | `#84C6FF` |
| 400 | `#42A2FF` |
| 500 | `#0A84FF` |
| 600 | `#0067D9` |
| 700 | `#004FA8` |
| 800 | `#06366D` |
| 900 | `#052043` |
| 950 | `#041220` |

**Status Colors**

| Color | 50 | 500 | 900 |
|------|-----|-----|-----|
| Red | `#FFF0F0` | `#F25555` | `#6B1717` |
| Green | `#EEF9F3` | `#2FBE74` | `#12482B` |
| Amber | `#FFF7E8` | `#E7A93D` | `#6A4512` |

### Spacing Primitives

`[0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96]`

### Radii Primitives

`[0, 4, 6, 8, 12, 16, 24, 999]`

## 1. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Weight | Use |
|------|------|----------|--------|-----|
| Display | `"Outfit"` | `system-ui, sans-serif` | 600 | Hero headlines, section titles, canvas labels |
| Body / UI | `"Inter"` | `system-ui, sans-serif` | 400 | Interface text, copy, labels |
| Mono / Code | `"IBM Plex Mono"` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 500 | Shortcuts, file paths, traces, code tokens |

### Mono Font Rules

**`mono_for_code: true`** and **`mono_for_metrics: false`**

- Use mono for shortcuts, paths, code snippets, keyboard hints, and agent traces.
- Keep counts, prices, and marketing metrics in Inter so the product does not drift into infra-tool styling.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--display` | 64px | 1.0 | -0.04em | 600 | Hero headline |
| `--heading` | 42px | 1.04 | -0.035em | 600 | Section heading |
| `--subheading` | 24px | 1.18 | -0.02em | 600 | Card titles, feature titles |
| `--body` | 15px | 1.55 | -0.01em | 400 | Default body copy |
| `--body-sm` | 14px | 1.5 | -0.01em | 400 | Labels, descriptions |
| `--caption` | 12px | 1.4 | 0em | 500 | Small helper text |
| `--label` | 11px | 1.2 | 0.08em | 600 | Uppercase metadata and UI labels |

### Compact Portal Scale

Use this scale for dense control-plane surfaces such as `apps/gateway-portal`:

| Token | Size | Line Height | Letter Spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--heading-compact` | 32px | 1.02 | -0.035em | 600 | Page hero for admin screens |
| `--subheading-compact` | 20px | 1.12 | -0.02em | 600 | Panel titles |
| `--body-compact` | 14px | 1.5 | -0.01em | 400 | Dense descriptions |
| `--meta-compact` | 11px | 1.25 | 0.08em | 600 | Labels, route pills, timestamps |

### Typographic Rules

- Headlines are wide, heavy, and short.
- Body copy stays neutral and product-led.
- Labels may use uppercase, but only for meta information.
- Mono appears only where the screen reads like a tool.

## 2. COLOR SYSTEM

### Dark Mode

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.950}` | `#050608` | Main canvas |
| `--bg` | alias | `var(--background)` | Shorthand |
| `--surface1` | `{neutral.900}` | `#0D0F14` | Primary cards |
| `--surface2` | `{neutral.800}` | `#1E222B` | Grouped surfaces |
| `--surface3` | `{neutral.700}` | `#373B47` | Inputs and selected neutrals |
| `--border` | `{neutral.800}` | `#1E222B` | Quiet borders |
| `--border-visible` | `{neutral.700}` | `#373B47` | Strong borders |
| `--text1` | `{neutral.50}` | `#FFFFFF` | Primary text |
| `--text2` | `{neutral.300}` | `#D8D9DE` | Secondary text |
| `--text3` | `{neutral.500}` | `#7C8190` | Tertiary text |
| `--text4` | `{neutral.600}` | `#5B6070` | Disabled text |
| `--accent` | `{brand.500}` | `#0A84FF` | Publish and active state |
| `--accent-subtle` | `{brand.950}` | `#041220` | Accent tint |
| `--success` | `{green.500}` | `#2FBE74` | Good state |
| `--warning` | `{amber.500}` | `#E7A93D` | Caution |
| `--error` | `{red.500}` | `#F25555` | Critical state |

### Light Mode

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.50}` | `#FFFFFF` | Main canvas |
| `--bg` | alias | `var(--background)` | Shorthand |
| `--surface1` | `{neutral.100}` | `#F6F6F7` | Primary cards |
| `--surface2` | `{neutral.200}` | `#EBEBEE` | Grouped surfaces |
| `--surface3` | `{neutral.300}` | `#D8D9DE` | Inputs and selected neutrals |
| `--border` | `{neutral.200}` | `#EBEBEE` | Quiet borders |
| `--border-visible` | `{neutral.300}` | `#D8D9DE` | Strong borders |
| `--text1` | `{neutral.950}` | `#050608` | Primary text |
| `--text2` | `{neutral.600}` | `#5B6070` | Secondary text |
| `--text3` | `{neutral.500}` | `#7C8190` | Tertiary text |
| `--text4` | `{neutral.400}` | `#A9ADB8` | Disabled text |
| `--accent` | `{brand.600}` | `#0067D9` | Active state and CTA |
| `--accent-subtle` | `{brand.50}` | `#EDF7FF` | Accent tint |
| `--success` | `{green.500}` | `#2FBE74` | Good state |
| `--warning` | `{amber.500}` | `#E7A93D` | Caution |
| `--error` | `{red.500}` | `#F25555` | Critical state |

### Accent And Status Tints

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent-subtle` | `#EDF7FF` | `#041220` | Accent pill backgrounds and focus tints |
| `--success-bg` | `#EEF9F3` | `#12482B` | Success badges and alerts |
| `--warning-bg` | `#FFF7E8` | `#6A4512` | Warning badges and alerts |
| `--error-bg` | `#FFF0F0` | `#6B1717` | Error badges and alerts |

### Color Usage Rules

- Keep neutrals dominant.
- Use `--accent` for publish, active state, or a single selected object.
- Avoid blue on passive copy.
- Status colors should remain semantic and never become decorative.

## 3. SPACING

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2px | Optical adjustments |
| `--space-xs` | 4px | Tight icon gaps |
| `--space-sm` | 8px | Small internal spacing |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Card padding and stack gaps |
| `--space-xl` | 32px | Section spacing inside larger regions |
| `--space-2xl` | 48px | Major card and panel breathing room |
| `--space-3xl` | 64px | Section separation |
| `--space-4xl` | 96px | Hero and landing rhythm |

### Compact Portal Spacing

For dense admin panels, bias toward this subset:

- `12px` for control padding
- `16px` for standard card padding
- `20px` for featured panel padding
- `24px` for section gaps

## 4. BORDERS AND RADII

| Token | Value | Use |
|-------|-------|-----|
| `--radius-element` | 4px | Tiny controls |
| `--radius-control` | 8px | Inputs and standard buttons |
| `--radius-component` | 16px | Feature cards and panels |
| `--radius-container` | 24px | Larger shells and device frames |
| `--radius-pill` | 999px | Tags and compact pills |

Border treatment:

- Cards: `1px solid var(--border)`
- Inputs: `1px solid color-mix(in srgb, var(--text1) 10%, transparent)`
- Pills: `1px solid rgba(255,255,255,0.08)` on dark, `1px solid rgba(5,6,8,0.08)` on light

## 5. ELEVATION

| Level | Light Mode | Dark Mode | Use |
|-------|-----------|----------|-----|
| 0 | none | none | Flat surfaces |
| 1 | `0 10px 30px rgba(9, 12, 18, 0.06)` | `0 14px 28px rgba(0, 0, 0, 0.22)` | Standard cards |
| 2 | `0 18px 42px rgba(9, 12, 18, 0.10)` | `0 20px 48px rgba(0, 0, 0, 0.30)` | Hovered or featured cards |
| 3 | `0 24px 64px rgba(9, 12, 18, 0.16)` | `0 32px 72px rgba(0, 0, 0, 0.42)` | Modal and hero device |

## 6. MOTION

### Personality

Smooth, compact, and quick enough to feel native.

### Timing

| Type | Duration | Easing | Use |
|------|----------|--------|-----|
| Micro | 140ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Hover and focus |
| Standard | 220ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Panel shifts |
| Emphasis | 320ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Canvas and mode transitions |

### Interaction States

- Hover increases clarity, not scale.
- Active states can translate by 1px at most.
- Focus rings should be blue-tinted and visible against dark surfaces.

## 7. ICONOGRAPHY

Observed style:

| Attribute | Value |
|-----------|-------|
| Description | Compact geometric utility icons with rounded ends and low detail |
| Stroke weight | medium |
| Corner treatment | soft |
| Fill style | outline |
| Form language | geometric |
| Visual density | minimal |

Fallback kit:

- Kit: Lucide
- Weight / variant: default 2px
- Match score: high
- Why this kit: It matches the site's compact product-tool glyph language without adding extra personality.
- CDN: `https://unpkg.com/lucide-static@1.8.0/font/lucide.css`
- Usage: `icon icon-arrow-right`

Sizes:

| Context | Size |
|---------|------|
| Inline | 14px |
| Buttons | 16px |
| Navigation | 16px |

Do not:

- Mix icon kits.
- Use filled cartoon icons.
- Pretend the fallback kit is the brand's actual icon set.
