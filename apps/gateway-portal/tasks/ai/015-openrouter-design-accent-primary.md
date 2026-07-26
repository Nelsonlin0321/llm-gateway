# 015 - OpenRouter design: dark primary Volt → Accent

## Summary

Updated the `openrouter-design` skill so the **main dark primary** is **Grape Accent** (`#7624F4`) instead of **Volt** (`#C8FF00`). Volt remains in the palette as a brand-mark color only. Surfaces, type, spacing, radii, fonts, and light-mode Accent stay as before.

## Change

| Token (dark) | Before | After |
|--------------|--------|-------|
| `--accent` | `#C8FF00` Volt | `#7624F4` Grape Accent |
| `--accent-foreground` | `#03080A` ink | `#FCFCFE` cloud |
| `--accent-hover` | `#C8FF00E0` | `#7624F4E0` |
| `--accent-subtle` | Volt 8% | Grape 8% |
| Focus ring | Volt 18% | Grape 18% |
| `or-volt` | Dark primary | Brand mark only |

## Files touched

- `.agents/skills/openrouter-design/design-model.yaml`
- `.agents/skills/openrouter-design/SKILL.md`
- `.agents/skills/openrouter-design/references/tokens.md`
- `.agents/skills/openrouter-design/references/components.md`
- `.agents/skills/openrouter-design/references/platform-mapping.md`
- `.agents/skills/openrouter-design/preview.html`
- `.agents/skills/openrouter-design/component-library.html`
- `.agents/skills/openrouter-design/landing-page.html`
- `.agents/skills/openrouter-design/app-screen.html`
- `apps/gateway-portal/tasks/ai/015-openrouter-design-accent-primary.md`

## How to verify

```bash
node .agents/skills/hue/scripts/validate.mjs .agents/skills/openrouter-design
open .agents/skills/openrouter-design/preview.html
```

Expect dark primary buttons to be purple (`#7624F4`) with white label text, not lime Volt.

## Follow-ups

None required unless Volt should still appear as a secondary CTA variant.
