---
name: ds-ref-design-principles
description: Standalone Splunk Dashboard Studio design reference — covers the four canonical archetypes (executive summary, operational monitoring, analytical deep-dive, SOC overview), reflex defaults to refuse, absolute bans (status colour misuse, red/green only, pie >6, unbounded searches, defaultless inputs), KPI sizing, the chart-selection decision table for all 27 viz types, semantic colour conventions, typography, and the Splunk Dashboard Slop Test. Use when the user asks open-ended design questions ("what should my dashboard look like?", "which chart for X?"), or for the Slop Test before shipping. Companion files cover the full palette and chart-selection matrix.
---

# ds-ref-design-principles — design reference

## The stance

A Splunk dashboard is not a report. It is a live surface that an
operator, analyst, or executive scans under time pressure. Every pixel
either earns its place or steals attention from the one that should
have had it.

The default output of any generative tool — including Claude — is
generic: four same-size KPIs in `#006D9C`, one line chart, one table,
default canvas grey, no semantic colour, no hierarchy. That output
passes a demo and fails a shift. This skill exists to refuse it.

**The commitment**: pick an archetype early, derive theme from
audience, apply semantic polarity to every status metric, treat
absolute bans as non-negotiable.

## Required context

Before designing, know:

1. **Audience** — executives, SREs, SOC analysts, field technicians?
2. **Viewing context** — 24/7 NOC wall, laptop at 09:00, printed PDF,
   on-call phone?
3. **Primary question** — what does the user need to answer in 5
   seconds?
4. **Decision consequence** — does a red KPI page someone, or inform
   a quarterly review?

Ask if any are unknown. The codebase cannot tell you these.

## Dashboard archetypes

See `ds-ref-archetypes` for the four canonical layouts (executive
summary, operational monitoring, analytical deep-dive, SOC overview)
with panel-mix fingerprints, audience profiles, and hybrid guidance.

## Reflex defaults to reject

See `ds-ref-anti-patterns` for the 8 reflex defaults to refuse.

## Absolute bans

See `ds-ref-anti-patterns` for the 5 absolute bans (BAN/PATTERN/WHY/REWRITE format).

## Chart selection — quick decision

For the full 27-viz decision table, see [CHART-SELECTION.md](CHART-SELECTION.md).

Short version:

| Question | Use |
|---|---|
| Current value of one metric? | `splunk.singlevalue` + threshold colouring |
| How has a metric changed over time? | `splunk.line` |
| How do discrete categories compare? | `splunk.column` (vertical) |
| Top N (many categories)? | `splunk.bar` (horizontal, sorted) |
| Part-to-whole ≤6 categories, one dominates? | `splunk.pie` (or donut) |
| Threshold position / margin? | `splunk.markergauge` |
| Geographic distribution? | `splunk.map` (real geo) / `splunk.choropleth.svg` (custom shapes) |
| Flow between sources / targets? | `splunk.sankey` |
| Event frequency by hour × weekday? | `splunk.punchcard` |
| Multi-dimensional comparison? | `splunk.parallelcoordinates` |
| Correlation between two measures? | `splunk.scatter` |
| Three-variable correlation (x, y, volume)? | `splunk.bubble` |
| Tabular detail with drilldown? | `splunk.table` |

## Layout, spacing, and depth

See `ds-ref-layout-grid` for layout principles (F-pattern, hierarchy,
grouping, whitespace), KPI sizing rules, spacing/radius scale tokens,
depth via layered rectangles, and per-archetype canvas-zone presets
with golden-ratio hero sizing.

## Color principles

See `ds-ref-color` for canonical palettes (categorical, sequential,
diverging, RAG, SOC severity), OKLCH theory, WCAG contrast tables,
colorblind-safe pairings, and the reflex_palettes_to_reject list.

## Typography & text

See `ds-ref-typography` for typography rules, font pairing recipes,
modular type scales per archetype, number formatting, casing rules,
and the reflex_fonts_to_reject list.

## Common antipatterns (10 most frequent)

1. >12 panels on one dashboard — split into tabs.
2. Pie >6 slices — sorted bar instead.
3. Stacked area for independent series — multi-series line.
4. Red/green as sole differentiator — add icon/shape/label.
5. Rainbow on ordered data — sequential gradient.
6. Tiny singlevalues (<3×3 cells).
7. Dropdowns without defaults.
8. Searches without `earliest` / `latest`.
9. Tables without drilldown.
10. Raw `_time` in tables.

## What Dashboard Studio cannot deliver

- Animations / keyframes / pulsing alerts / transitions.
- True glassmorphism / backdrop-blur.
- Gradient text on KPIs.
- Custom chart fonts (only `splunk.markdown` has `fontFamily`).
- Pan/zoom map overlays.
- Conditional viz visibility via expression — use
  `containerOptions.visibility` with conditions instead.

## The Splunk Dashboard Slop Test

See `ds-ref-anti-patterns` for the 13-item quality gate.

## See also

- [PALETTE.md](PALETTE.md) — full palettes (`SERIES_CATEGORICAL_10`,
  `SERIES_SOC_8`, `SERIES_STUDIO_20`), canvas tokens, spacing /
  radius / type scale.
- [CHART-SELECTION.md](CHART-SELECTION.md) — full 27-viz decision
  table.
- **`ds-couture`** — design-first companion. Adds the Design Context
  Protocol (audience / tone / anti-reference / brand), visual taste,
  hierarchy, depth, and the Slop Test rubric. **Pair this skill
  with ds-couture for every dashboard** — `ds-ref-design-principles`
  is the technical foundation, `ds-couture` is the visual judgement
  on top of it.
- **`ds-spl`** — SPL grammar reference for the queries that feed
  the visualisations described here.
- `ds-pick-viz` — viz selection router. Use first when picking
  charts; cross-references this skill's CHART-SELECTION.md.
- `ds-ref-syntax` — JSON envelope.
- `ds-ref-pitfalls` — cross-skill traps matrix (viz + interactivity + schema).
- `ds-viz-bar` / `ds-viz-singlevalue` etc. — per-viz reference.
