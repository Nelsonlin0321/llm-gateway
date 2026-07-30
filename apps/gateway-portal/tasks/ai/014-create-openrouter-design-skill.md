# 014 - Create openrouter-design skill

## Summary

Generated an OpenRouter design-language skill under `.agents/skills/openrouter-design/` using the hue meta-skill workflow. The skill targets OpenRouter's **2026 brand-refresh dark mode** as the primary environment: Ink canvas (`#03080A`), Cloud type (`#FCFCFE`), Volt primary CTAs (`#C8FF00`), translucent Cloud film surfaces, and Grape (`#7624F4`) as the light-mode primary. Tokens were extracted from live `openrouter.ai` CSS/HTML and the brand-refresh post (no Chrome DevTools; text/CSS extraction path).

## Files touched

| Path | Role |
|------|------|
| `.agents/skills/openrouter-design/design-model.yaml` | Single source of truth |
| `.agents/skills/openrouter-design/SKILL.md` | Philosophy, craft rules, anti-patterns, workflow |
| `.agents/skills/openrouter-design/references/tokens.md` | Color, type, spacing, motion, icons |
| `.agents/skills/openrouter-design/references/components.md` | Buttons, cards, inputs, lists, nav, overlays |
| `.agents/skills/openrouter-design/references/platform-mapping.md` | CSS vars, Tailwind, SwiftUI |
| `.agents/skills/openrouter-design/preview.html` | Bento dashboard preview |
| `.agents/skills/openrouter-design/component-library.html` | Component + token canvas |
| `.agents/skills/openrouter-design/landing-page.html` | Marketing landing story |
| `.agents/skills/openrouter-design/app-screen.html` | Models list-detail product UI |
| `apps/gateway-portal/tasks/ai/014-create-openrouter-design-skill.md` | This work log |

## Key design decisions (dark fidelity)

- **Background:** `#03080A` (`or-ink`), not generic zinc-950
- **Primary CTA (dark):** `#C8FF00` Volt with ink text (not indigo/purple)
- **Primary CTA (light):** `#7624F4` Grape
- **Surfaces:** `rgba(252,252,254,0.02–0.08)` films + 1px Cloud-alpha borders
- **Type:** Plus Jakarta Sans (observed brand face Gordita is proprietary) + Geist Mono
- **Controls:** 6px radius, 44px hero button height, 14px medium labels
- **Icons:** Lucide as geometric fallback (not redistributed brand icons)

## How to verify

```bash
# Schema / contrast / orphan CSS gate
node .agents/skills/hue/scripts/validate.mjs .agents/skills/openrouter-design

# Visual check (dark first, then Light toggle)
open .agents/skills/openrouter-design/preview.html
open .agents/skills/openrouter-design/landing-page.html
open .agents/skills/openrouter-design/component-library.html
open .agents/skills/openrouter-design/app-screen.html
```

Validation result: **PASS** (0 errors, 0 warnings).

## Follow-ups / next steps

- Optional: re-extract with Chrome DevTools MCP for computed `border-radius` / hero screenshot confidence.
- Optional: wire gateway-portal UI to openrouter-design tokens (compact control-plane density) similar to framer-design portal notes.
- Restart the coding assistant session so `openrouter-design` is discovered; activate with "OpenRouter design" or `/openrouter-design`.
