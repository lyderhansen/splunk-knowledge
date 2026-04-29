---
name: ds-ref-themes
description: Light vs dark theme parity for Splunk dashboards — perceptual equivalence rules (not just inversion), OKLCH-based luminance/chroma adjustments, when chroma is preserved vs dampened, dark-NOC variant (pure-black canvas, neon accents), and the rules that make_light.py operates on. Use when converting a dashboard between themes, when authoring a dual-theme dashboard, or when ds-deploy needs to know which theme variant to ship.
---

# ds-ref-themes — Light vs dark theme parity

> **Status:** skeleton only. Body authored partly from `make_light.py` source comments + new content in a follow-up task.

## Scope (what's IN)

- Perceptual equivalence (not pixel-flip inversion).
- OKLCH luminance + chroma rules per element type.
- Dark vs Dark-NOC vs Light variant differences.
- Documented rules `make_light.py` operates on.
- Theme decision tree (when to start dark, when light, when both).
- Cross-theme palette mapping.

## Out of scope (what's NOT here)

- Concrete hex values — see `ds-ref-color`.
- The script `make_light.py` itself (lives in `scripts/`) — this skill documents the rules; the script is the implementation.
- Per-archetype theme bias — see `ds-ref-archetypes` / `ds-ref-personas`.

## Consults

- `ds-ref-color` (cross-theme palette math).

## Consulted by

- `ds-couture` (theme decision early in Design Context Protocol).
- `ds-deploy` (light-variant generation).
- `ds-polish` (theme-correctness checks).

## Source / migration

- Some content from `make_light.py` source comments (color-mapping rules).
- New content: perceptual equivalence theory, dark-NOC variant rules, theme decision tree.

## Estimated size

M
