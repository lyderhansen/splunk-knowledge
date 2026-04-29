---
name: ds-ref-typography
description: Typography for Splunk Dashboard Studio — font pairings safe within Studio's constraints (only splunk.markdown exposes fontFamily), modular type scales per archetype, UPPER vs Title vs sentence case rules, number formatting (numberPrecision, tabular figures, k/M/B abbreviations), and the reflex_fonts_to_reject list (Inter, Roboto, default-system reaches). Use when picking fonts, when ds-polish fixes type hierarchy, or when number formatting needs review.
---

# ds-ref-typography — Typography for Splunk dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- Font pairing recipes (display + body) safe in Studio.
- Modular type scale (1.25 ratio recommended) per archetype.
- Line-height adjustments (dark-on-light vs light-on-dark).
- UPPER vs Title vs sentence case rules per archetype/element.
- Number formatting: `numberPrecision`, tabular figures, k/M/B abbreviations.
- `reflex_fonts_to_reject` list (Inter, Roboto, default-system reaches).

## Out of scope (what's NOT here)

- Studio-CSS fonts — only `splunk.markdown` supports `fontFamily` (platform constraint).
- Text color — see `ds-ref-color`.
- Spacing between text elements — see `ds-ref-layout-grid`.

## Consults

- (none — typography stands alone).

## Consulted by

- `ds-couture` (typography decision after archetype).
- `ds-polish` (typography corrections).
- `ds-viz-markdown` (fontFamily picks).
- `ds-viz-singlevalue` (numberPrecision).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Typography & text" section + Slop Test typography checks.
- New content: font pairing recipes, type-scale-per-archetype, k/M/B abbreviations, reflex fonts list.

## Estimated size

M
