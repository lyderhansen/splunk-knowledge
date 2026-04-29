---
name: ds-ref-layout-grid
description: Layout, spacing, and grid math for Splunk Dashboard Studio — 4pt and 8pt grid scales, F-pattern reading flow, hero KPI sizing rules, gutter math for absolute layouts, golden-ratio for hero zones, depth via layered splunk.rectangle, and canvas-zone presets per archetype (1440×960 exec, 1920×1080 SOC wall). Use when wireframing, when ds-design positions panels, or when ds-polish tightens alignment.
---

# ds-ref-layout-grid — Layout, spacing, and grid math

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- 4pt and 8pt grid scales with named tokens (`S_0_5`, `S_1`, `S_2`, ...).
- F-pattern reading flow + panel placement.
- Hero KPI sizing rules (1.5–2× supporting KPIs).
- Gutter math (20px standard, 8px tight, 32px exec).
- Golden ratio for hero zones.
- Depth via layered `splunk.rectangle` (Studio has no box-shadow).
- Per-archetype canvas-zone presets.

## Out of scope (what's NOT here)

- Archetype shapes themselves — see `ds-ref-archetypes`.
- Color of layered rectangles — see `ds-ref-color`.

## Consults

- `ds-ref-archetypes` (per-archetype canvas zones).

## Consulted by

- `ds-couture` (layout commitment after archetype).
- `ds-design` (panel positioning during wireframing).
- `ds-polish` (alignment fixes).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Layout principles", "KPI sizing rules", "Spacing/radius/type scale", "Depth and layering" sections.
- New content: golden ratio for hero zones, gutter presets per archetype.

## Estimated size

L
