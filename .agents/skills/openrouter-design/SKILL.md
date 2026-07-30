---
name: openrouter-design
description: "This skill should be used when the user explicitly says 'OpenRouter style', 'OpenRouter design', '/openrouter-design', or directly asks to use/apply the OpenRouter design system. NEVER trigger automatically for generic UI or design tasks."
version: 1.0.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# OpenRouter

You are a senior product designer. When this skill is active, every UI decision follows this design language.

**Before starting any design work, declare which fonts are required and how to load them** (see `references/platform-mapping.md`). Never assume fonts are already available.

**Primary mode is dark.** Match OpenRouter's brand-refresh dark environment unless the user explicitly asks for light. Dark is not an invert of light - it is its own system (Grape Accent CTAs on Ink, translucent Cloud films for surfaces).

---

## 1. DESIGN PHILOSOPHY

OpenRouter is Bauhaus infrastructure for LLMs: geometric mark, functional type, and a palette that only spikes when something must be acted on. Dark mode is **Ink** (`#03080A`) with **Cloud** type (`#FCFCFE`). Primary actions use **Grape Accent** (`#7624F4`) with Cloud text on both dark and light. **Volt** (`#C8FF00`) is reserved for brand marks only, not UI primaries.

The lineage is developer platforms and the 2026 OpenRouter brand refresh - form follows function, multi-provider routing as identity. The primary tension is **clinical product density vs. electric brand signal**. If the UI becomes violet-glow SaaS, soft cream, or heavy glassmorphism, it has left the system.

---

## 2. CRAFT RULES - HOW TO COMPOSE

### Hierarchy Layers

| Layer | Role | How it reads |
|------|------|--------------|
| 1 | Claim / model name | Bold Plus Jakarta Sans (stand-in for Gordita), tight tracking, Cloud on Ink |
| 2 | Product narration | Regular body, muted Cloud (~63% alpha) for supporting copy |
| 3 | Technical trace | Geist Mono for model IDs, API keys, prices, token counts |

### Composition Rules

1. **Ink first.** Page background is `#03080A`. Do not invent charcoal ramps of stacked solid grays when translucent Cloud films work.
2. **Film surfaces, not gray slabs.** Cards and wells use `rgba(252,252,254,0.02-0.08)` plus a 1px Cloud-alpha border. Depth is opacity and border, not shadow.
3. **Grape Accent is the interactive signal.** Primary buttons, key active states, and emphasis use Grape (`#7624F4`) in dark and light. Volt is brand-mark only. Everything else stays neutral Cloud/Ink.
4. **Rounded-md controls.** Buttons and inputs are `6px`. Cards are `8px`. Pills only for true chips/status.
5. **Compact CTA height.** Primary/secondary buttons are `44px` (`h-11`) with `14px` medium label and generous horizontal padding (`32px` on hero CTAs).
6. **Mono for code and metrics.** Model slugs, API keys, token counts, and prices use Geist Mono. Marketing body stays sans.
7. **Provider density is honest.** Tables and model lists should feel like a catalog, not a sparse marketing grid.

### Quick Validation

- Squint: headline, primary CTA, and main data surface should remain visible first.
- Remove Accent in your head: the UI should still read as complete and trustworthy.
- Check dark mode first: if light looks correct but dark is muddy gray-on-gray, you drifted from Ink + film surfaces.

---

## 3. ANTI-PATTERNS - WHAT TO NEVER DO

- No violet mesh glow on near-black (the generic AI SaaS look).
- No Volt lime primary CTAs for product UI (use Grape Accent `#7624F4`, not `#C8FF00`).
- No Indigo/blue primary CTAs (use Grape Accent, not `#6467F2`).
- No warm beige, cream, or paper surfaces on product canvas.
- No heavy multi-layer drop shadows under every card in dark mode.
- No solid `#18181B` card stacks when a Cloud film would match the site.
- No border-radius above `12px` on ordinary cards (max component shell `12-16px`; pills only for chips).
- No serif typography.
- No Inter as the display face when Plus Jakarta Sans is available.
- No rainbow gradients across hero backgrounds.
- No oversized pill CTAs for ordinary actions.
- No cartoon or doodled icons.
- No filler placeholder copy in previews or product screens - use OpenRouter voice.

---

## 4. WORKFLOW

1. **Declare fonts** - Plus Jakarta Sans + Geist Mono (see `references/platform-mapping.md`). Note Gordita as observed brand face.
2. **Set tokens** - apply variables from `references/tokens.md`. Default to dark tokens.
3. **Build components** - use specs from `references/components.md`.
4. **Check hierarchy** - squint test: claim, CTA, data.
5. **Verify both modes** - dark and light share Grape Accent; surfaces and type invert, primaries do not switch to Volt.
6. **Test extremes** - long model names, empty catalog, dense pricing tables.
7. **Platform-adapt** - consult `references/platform-mapping.md`.

---

## 5. REFERENCE FILES

| File | Contains |
|------|----------|
| `references/tokens.md` | Fonts, type scale, color system (dark + light), spacing, radii, elevation, motion, iconography |
| `references/components.md` | Cards, buttons, inputs, lists, navigation, tags, overlays, state patterns |
| `references/platform-mapping.md` | HTML/CSS variables, SwiftUI, React/Tailwind - loading instructions |
| `design-model.yaml` | Single source of truth for all token values |
