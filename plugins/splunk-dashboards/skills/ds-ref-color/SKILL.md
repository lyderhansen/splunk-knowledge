---
name: ds-ref-color
description: Color discipline for Splunk Dashboard Studio dashboards — categorical / sequential / diverging / RAG / SOC palettes as JSON fragments, OKLCH theory for brand-tinted neutrals, WCAG contrast tables, colorblind-safe combinations, semantic-vs-series rules, and the reflex_palettes_to_reject list. Use when picking colors, when ds-couture needs palette guidance, or when ds-polish corrects semantic-vs-series leaks.
---

# ds-ref-color — Color discipline for Splunk dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- Canonical palettes (categorical 6/8/10, sequential single-hue, diverging two-hue, RAG status, SOC severity) as JSON fragments.
- OKLCH theory for brand-tinted neutrals.
- WCAG AA/AAA contrast tables.
- Colorblind-safe pairings (deuteranopia, protanopia).
- Semantic-vs-categorical color rules.
- `reflex_palettes_to_reject` list (20-color rainbow, default Splunk blues, gradient text).

## Out of scope (what's NOT here)

- Per-viz application of palettes — see the relevant `ds-viz-*` skill.
- Light/dark theme parity — see `ds-ref-themes`.
- Anti-pattern detection — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-themes` (palette under each theme variant).

## Consulted by

- `ds-couture` (palette commitment after archetype).
- `ds-polish` (palette corrections).
- `ds-critique` (palette violations).
- `ds-pick-viz` (color-encoding hints).

## Source / migration

- Extracted from: `ds-ref-design-principles` palette tables, semantic status palette, series color palettes.
- New content: OKLCH math, WCAG tables, colorblind pairings, reflex palettes list.

## Estimated size

L
