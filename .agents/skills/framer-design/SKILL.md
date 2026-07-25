---
name: framer-design
description: "This skill should be used when the user explicitly says 'Framer style', 'Framer design', '/framer-design', or directly asks to use/apply the Framer design system. NEVER trigger automatically for generic UI or design tasks."
version: 1.0.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# Framer

You are a senior product designer. When this skill is active, every UI decision follows this design language.

Before starting any design work, declare which fonts are required and how to load them from `references/platform-mapping.md`. Never assume fonts are already present.

## 1. DESIGN PHILOSOPHY

Framer should feel like a design tool that is already one step from publish. The stage is black, the type is bright and geometric, and the product screenshot carries the persuasion instead of decorative graphics. White and graphite surfaces do almost all of the work, while electric blue appears only when the interface needs to signal action, state, or readiness.

The lineage is creative software, modern website builders, and compact macOS utilities rather than soft consumer AI branding. The primary tension is editorial restraint against product immediacy. If the interface starts looking ornamental, glossy, or over-illustrated, it has drifted away from the system.

## 2. CRAFT RULES - HOW TO COMPOSE

### Hierarchy Layers

| Layer | Role | How it reads |
|------|------|--------------|
| 1 | Hero claim | Large Outfit headlines with very tight tracking and almost no extra decoration |
| 2 | Product narration | Inter for body copy, labels, feature text, and settings copy |
| 3 | Technical trace | IBM Plex Mono for shortcuts, page paths, agent traces, and code-like tokens |

### Composition Rules

1. Let the product be the hero. Use device frames, editor panels, and canvas crops before inventing decorative illustrations.
2. Keep the stage nearly black. Depth comes from border, contrast, and one strong screenshot, not from layered effects.
3. Use blue as a signal, not a theme. Publish, active states, and precise highlights get blue. Everything else stays neutral.
4. Keep controls compact and rounded. Buttons and inputs sit at `8px`, larger shells at `16px` or `24px`, pills only when the UI genuinely needs them.
5. Limit surface hierarchy to three steps. `surface1`, `surface2`, and `surface3` are enough for editor chrome, nested panels, and inset controls.
6. Reserve mono for technical moments only. File paths, shortcuts, agent traces, and code fragments get mono. Metrics and marketing copy do not.

### Quick Validation

- Squint at the screen. The headline, publish action, and main canvas should remain visible first.
- Remove the blue in your head. The interface should still read as confident and complete.
- Check a screenshot crop. If the frame feels louder than the content inside it, reduce the chrome.

## 3. ANTI-PATTERNS - WHAT TO NEVER DO

- No rainbow AI gradients.
- No glowing mesh backgrounds behind product screenshots.
- No multiple accent hues competing with publish blue.
- No oversized glass panels or frosted cards.
- No giant pill buttons for ordinary actions.
- No card radii above `24px` unless the element is intentionally a pill.
- No serif typography.
- No cartoon or doodled icon sets.
- No warm beige or soft cream surfaces on the product canvas.
- No extra chrome around screenshots that already have their own chrome.
- No serif typography.
- No empty placeholder panels that exist only to fill the grid.
- No heavy shadows under every control. Most controls should read flat.

## 4. WORKFLOW

1. Declare fonts and load them.
2. Apply tokens from `references/tokens.md`.
3. Build components from `references/components.md`.
4. Make the main visual a canvas or editor surface before adding secondary decoration.
5. Keep accent use disciplined and visible.
6. Check both light and dark mode.
7. Verify density with real-looking pages, sections, agent traces, and publishing states.
8. Use `references/platform-mapping.md` for implementation details.

## 5. REFERENCE FILES

| File | Contains |
|------|----------|
| `references/tokens.md` | Fonts, type scale, color system, spacing, radii, elevation, motion, iconography |
| `references/components.md` | Buttons, cards, inputs, lists, navigation, tags, overlays, state patterns |
| `references/platform-mapping.md` | Web CSS variables, SwiftUI mapping, and Tailwind extension setup |
