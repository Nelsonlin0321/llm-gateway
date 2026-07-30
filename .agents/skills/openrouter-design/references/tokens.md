# OpenRouter - Tokens

## 0. PRIMITIVES

Raw scales derived from OpenRouter brand tokens (2026 brand refresh + live CSS).

### Color Ramps

**Neutral** (cool Ink → Cloud)

| Step | Hex | Use |
|------|-----|-----|
| 50 | `#FCFCFE` | or-cloud - lightest / primary text on dark |
| 100 | `#F4F4F5` | Light surfaces |
| 200 | `#E4E4E7` | Borders (light) |
| 300 | `#D4D4D8` | Strong borders (light) |
| 400 | `#A1A1AA` | Placeholder |
| 500 | `#71717A` | Muted text (light) |
| 600 | `#52525B` | Secondary text (light) |
| 700 | `#3D3D42` | Strong borders (classic dark chrome) |
| 800 | `#27272A` | Dark solid wells |
| 900 | `#18181B` | Dark solid surface |
| 950 | `#03080A` | or-ink - page background (dark) |

**Brand / Grape Accent** (primary interactive - dark + light)

| Step | Hex |
|------|-----|
| 50 | `#F5EDFF` |
| 100 | `#E9D5FF` |
| 200 | `#D4ABFF` |
| 300 | `#B870FF` |
| 400 | `#9A45F8` |
| 500 | `#7624F4` - or-grape, primary CTA (Accent) |
| 600 | `#6218D4` |
| 700 | `#4E12AB` |
| 800 | `#3A0C80` |
| 900 | `#260855` |
| 950 | `#160433` |

**Volt** (brand mark only - not UI primary)

| Step | Hex |
|------|-----|
| 50 | `#F7FFE0` |
| 100 | `#ECFFB0` |
| 200 | `#DEFF70` |
| 300 | `#D4FF40` |
| 400 | `#CEFF20` |
| 500 | `#C8FF00` - or-volt, logo/mark only |
| 600 | `#A8D900` |
| 700 | `#7AA300` |
| 800 | `#4F6B00` |
| 900 | `#2E3F00` |
| 950 | `#1A2400` |

**Royal** (links / charts)

| Step | Hex |
|------|-----|
| 500 | `#035ADE` - or-royal |

**Status**

| Color | 50 (bg tint) | 500 (foreground) | 900 (dark tint) |
|-------|-------------|------------------|-----------------|
| Red | `#FFF0F3` | `#FF2D55` | `#7F0A22` |
| Green | `#E8FBF3` | `#00BF6F` | `#004D2C` |
| Amber | `#FFF8E6` | `#FFAB00` | `#6A4500` |
| Coral | `#FFF1ED` | `#FF6849` | `#7A2410` |

### Spacing Primitives

`[0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96]` - site base unit is `0.25rem` (4px).

### Radii Primitives

`[0, 4, 6, 8, 12, 16, 24, 999]` - matches `--radius-sm/md/lg/xl/2xl/3xl/full`.

---

## 1. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Weight | Use |
|------|------|----------|--------|-----|
| **Display** | `"Plus Jakarta Sans"` | `ui-sans-serif, system-ui, sans-serif` | 700 | Heroes, screen titles (observed brand face: **Gordita**) |
| **Body / UI** | `"Plus Jakarta Sans"` | `ui-sans-serif, system-ui, sans-serif` | 400-600 | Body, labels, UI |
| **Mono / Code** | `"Geist Mono"` | `ui-monospace, SFMono-Regular, Menlo, monospace` | 400-500 | Model IDs, keys, prices, code |

### Mono Font Rules

**`mono_for_code`: true** · **`mono_for_metrics`: true**

OpenRouter is a developer catalog: model slugs (`anthropic/claude-…`), API keys, token volumes, and pricing are identity, not decoration. Use mono for all of them.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--display` | 56px | 1.15 | -0.02em | 700 | Marketing heroes (`!text-[56px]` on site) |
| `--heading` | 24px | 1.25 | -0.01em | 600 | Section titles |
| `--subheading` | 18px | 1.35 | -0.01em | 600 | Card titles |
| `--body` | 16px | 1.5 | 0 | 400 | Body copy |
| `--body-sm` | 14px | 1.45 | 0 | 400-500 | Button labels, dense UI |
| `--caption` | 12px | 1.35 | 0.01em | 500 | Badges, meta |
| `--label` | 12px | 1.2 | 0.04em | 500 | Uppercase-optional micro labels |

### Typographic Rules

- Marketing heroes may go to 56px; product UI rarely exceeds 24px headings.
- Button text is 14px medium (`--text-button`).
- Prefer weight contrast (400/500/700) over color for hierarchy.
- Do not use Inter or Space Grotesk as substitutes for Plus Jakarta Sans.

---

## 2. COLOR SYSTEM (Semantic Tokens)

### Primary Mode (dark) - brand-refresh `.dark`

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#03080A` | Page / canvas (or-ink) |
| `--bg` | `var(--background)` | Alias |
| `--surface1` | `rgba(252, 252, 254, 0.02)` | Cards |
| `--surface2` | `rgba(252, 252, 254, 0.04)` | Nested wells |
| `--surface3` | `rgba(252, 252, 254, 0.08)` | Hover / stronger well |
| `--border` | `rgba(252, 252, 254, 0.08)` | Default dividers |
| `--border-visible` | `rgba(252, 252, 254, 0.14)` | Inputs, outlined buttons |
| `--text1` | `#FCFCFE` | Primary text (or-cloud) |
| `--text2` | `#A1A1AA` | Secondary / muted |
| `--text3` | `rgba(252, 252, 254, 0.45)` | Tertiary |
| `--text4` | `rgba(252, 252, 254, 0.28)` | Disabled |
| `--accent` | `#7624F4` | Primary CTA (Grape Accent) |
| `--accent-subtle` | `rgba(118, 36, 244, 0.08)` | Accent tint wells |
| `--accent-foreground` | `#FCFCFE` | Text on Accent |
| `--success` | `#00BF6F` | Positive |
| `--warning` | `#FFAB00` | Caution |
| `--error` | `#FF2D55` | Destructive |

### Secondary Mode (light)

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#FCFCFE` | Page |
| `--bg` | `var(--background)` | Alias |
| `--surface1` | `#FFFFFF` | Cards |
| `--surface2` | `#F4F4F5` | Nested |
| `--surface3` | `#E4E4E7` | Wells |
| `--border` | `#E4E4E7` | Dividers |
| `--border-visible` | `#D4D4D8` | Inputs |
| `--text1` | `#03080A` | Primary |
| `--text2` | `#71717A` | Secondary |
| `--text3` | `#A1A1AA` | Tertiary |
| `--text4` | `#D4D4D8` | Disabled |
| `--accent` | `#7624F4` | Primary CTA (or-grape) |
| `--accent-subtle` | `rgba(118, 36, 244, 0.08)` | Grape tint |
| `--accent-foreground` | `#FCFCFE` | Text on Grape |
| `--success` | `#00BF6F` | Positive |
| `--warning` | `#FFAB00` | Caution |
| `--error` | `#FF2D55` | Destructive |

### Accent & Status Tints

| Token | Dark | Light |
|-------|------|-------|
| `--accent-subtle` | `rgba(118, 36, 244, 0.08)` | `rgba(118, 36, 244, 0.08)` |
| `--success-bg` | `rgba(0, 191, 111, 0.08)` | `#E8FBF3` |
| `--warning-bg` | `rgba(255, 171, 0, 0.08)` | `#FFF8E6` |
| `--error-bg` | `rgba(255, 45, 85, 0.08)` | `#FFF0F3` |

### Color Usage Rules

1. **Default to dark tokens** unless the user asks for light.
2. Max one primary accent hue on screen for interactive chrome (Grape Accent `#7624F4` in both modes). Volt is brand-mark only. Royal, Coral, and status colors are secondary signals only.
3. Never paint large regions Grape Accent - it is for CTAs and highlights. Never use Volt as a button fill.
4. Prefer Cloud-alpha films over solid zinc panels in dark mode.

---

## 3. SPACING

### Scale (4px base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2px | Optical only |
| `--space-xs` | 4px | Icon gaps |
| `--space-sm` | 8px | Tight padding |
| `--space-md` | 16px | Standard gaps |
| `--space-lg` | 24px | Card padding |
| `--space-xl` | 32px | Section gaps |
| `--space-2xl` | 48px | Major breaks |
| `--space-3xl` | 64px | Screen sections |
| `--space-4xl` | 96px | Hero breathing room |

---

## 4. BORDERS & RADII

### Radii Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-element` | 4px | Chips, small controls |
| `--radius-control` | 6px | Buttons, inputs (`rounded-md`) |
| `--radius-component` | 8px | Cards (`rounded-lg`) |
| `--radius-container` | 12px | Modals, large shells |
| `--radius-pill` | 999px | True pills only |

### Border Treatment

| Element | Border |
|---------|--------|
| Cards | `1px solid var(--border)` |
| Primary buttons | none |
| Secondary buttons | `1px solid var(--border-visible)` |
| Inputs | `1px solid var(--border-visible)` |
| Focus | border lightens + subtle Grape Accent ring |

Corner philosophy: soft-but-not-round. Controls sit at 6px; never default to full pills.

---

## 5. ELEVATION & SHADOWS

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| **0** | None | None | Default inline |
| **1** | soft 1-3px | none (border only) | Cards |
| **2** | medium | soft black | Menus |
| **3** | large | deeper black | Modals |

Dark mode is **flat-first**: border + film opacity. Shadows only for floating layers.

---

## 6. MOTION & INTERACTION

### Personality

Smooth, short, product-tool. Color and opacity transitions - no bounce.

### Timing

| Type | Duration | Easing | Use |
|------|----------|--------|-----|
| **Micro** | 120ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Hover color |
| **Standard** | 200ms | same | Panels |
| **Emphasis** | 320ms | same | Modals |

### Interaction States

- Hover primary: `accent-hover` (`#7624F4E0` dark and light)
- Active primary: ~80% opacity of accent
- Disabled: 50% opacity, no pointer
- Focus: visible border + 3px accent ring at low alpha

---

## 7. ICONOGRAPHY

> **Fallback disclosure.** Preview icons use **Lucide** as a best-match geometric kit. They are **not** OpenRouter's proprietary glyphs or provider logos.

### Observed style

| Attribute | Value |
|-----------|-------|
| Description | Compact geometric utility icons; provider favicons in marquee rows |
| Stroke weight | medium (~2px) |
| Corner treatment | soft |
| Fill style | outline (UI) / solid (brand mark) |
| Form language | geometric / Bauhaus |
| Visual density | minimal |

### Fallback kit

- **Kit:** Lucide
- **CDN:** `https://unpkg.com/lucide-static@1.8.0/font/lucide.css`
- **Usage:** `<i class="icon icon-key"></i>`

### Sizes

| Context | Size |
|---------|------|
| Inline | 16px |
| Buttons | 16px |
| Navigation | 18-20px |

### Color rule

Icons inherit text color. Active/selected may use accent. Never multicolor icon sets in chrome.
