---
name: ds-design-principles
description: Standalone Splunk Dashboard Studio design reference — covers the four canonical archetypes (executive summary, operational monitoring, analytical deep-dive, SOC overview), reflex defaults to refuse, absolute bans (status colour misuse, red/green only, pie >6, unbounded searches, defaultless inputs), KPI sizing, the chart-selection decision table for all 27 viz types, semantic colour conventions, typography, and the Splunk Dashboard Slop Test. Use when the user asks open-ended design questions ("what should my dashboard look like?", "which chart for X?"), or for the Slop Test before shipping. Companion files cover the full palette and chart-selection matrix.
---

# ds-design-principles — design reference

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

## Four archetypes

| Archetype | Audience | Panels | Primary question |
|---|---|---|---|
| **Executive summary** | Leadership | 6–8 | Is everything healthy right now? |
| **Operational monitoring** | On-call, NOC | 8–12 | What is happening right now? |
| **Analytical deep-dive** | Analysts, investigators | 10–14 (use tabs) | What caused this and what does the data show? |
| **SOC overview** | SOC analysts | 7–10 | Where are threats, how severe, what just happened? |

Each archetype has a canvas-zone template — see [PALETTE.md](PALETTE.md).

## REFLEX defaults to refuse

| # | Reflex | Why bad | Rewrite |
|---|---|---|---|
| 1 | **Uniform-colour KPI row** — all `majorColor: #006D9C`. | Loses semantic polarity; everything reads "neutral". | Classify each KPI's polarity. Use DOS threshold-colouring for status; static `#006D9C` only for true counts. |
| 2 | **Uniform-size KPI row** — flat hierarchy. | Eye has no anchor. | One anchor KPI hero-sized (≥ 1.5× others). For SOC/analytical, rank by criticality. |
| 3 | **Default Splunk canvas** — no `backgroundColor` set. | Signals untouched AI output. | Always set `layout.options.backgroundColor` per archetype. |
| 4 | **"4 KPIs + 1 line + 1 table" autotemplate** — same composition regardless of archetype. | Fine for exec summary, wrong for everything else. | Archetype drives layout. SOC = geo + timeline + severity. Analytical = filter bar + scatter + multi-series + detail table. |
| 5 | **Rainbow on ordered data** — severity as red/orange/yellow/green/blue/purple. | "Different kinds" not "more or less". | Sequential single-hue gradient (red → amber for severity). |
| 6 | **Tables without drilldown** — `splunk.table` with no event handler. | Dead end. | Every table links to detail / sets a token / opens a search. |
| 7 | **Raw `_time`** in tables. | Operators can't read epoch / ISO at a glance. | `\| eval _time=strftime(_time, "%Y-%m-%d %H:%M:%S")` in SPL. |
| 8 | **Pie by default for breakdown** — `splunk.pie` regardless of cardinality. | Pie >6 slices unreadable. | `splunk.bar` (sorted), or `splunk.pie` ONLY if ≤6 categories AND one dominates. |

## ABSOLUTE bans (never acceptable)

| # | Pattern | Why | Rewrite |
|---|---|---|---|
| 1 | **Status colours as series colours** — `#DC4E41` etc. in `seriesColors`. | Operator muscle memory. Green line in time series reads as "OK" even when crashing. | Use `SERIES_CATEGORICAL_10` or `SERIES_STUDIO_20`. Reserve semantic palette for `majorColor` only. |
| 2 | **Red/green as sole differentiator** — colour-only pass/fail. | ~8% of men colourblind. Excludes them entirely. | `splunk.singlevalueicon` (icon + colour). For tables, severity label column. |
| 3 | **Pie >6 slices** — slice angles indistinguishable. | Pie fails its job. | `splunk.bar` (horizontal sorted). Aggregate to Top 5 + "Other" upstream. |
| 4 | **Searches without `earliest` / `latest`** — full-index scans. | Single dashboard with 5 unbounded searches saturates indexer. | Bind `defaults.dataSources.ds.search.options.queryParameters.earliest` to `$global_time.earliest$`. |
| 5 | **Inputs without `defaultValue`** — empty render. | User assumes dashboard broken. | Always set `defaultValue` (`"*"` for open filters). |

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

## KPI sizing rules

- **Minimum:** 3×3 grid cells (~300×120 px). Below this, major value
  unreadable at distance.
- **Recommended:** 300–440 px wide, font 36–56 px, 4-KPI row on 1440
  canvas.
- **Max per row:** 6.
- **Show trend or sparkline** when direction matters.
- **Always set `unit`** (`"%"`, `"ms"`, `"°C"`).
- Use `splunk.singlevalueicon` for binary status, `splunk.markergauge`
  for SLA thresholds, `splunk.fillergauge` for percentage-completion.
- Status KPIs: dynamic `majorColor` via `rangeValue`. Informational
  counts: static `#006D9C`.

## Layout principles

- **F-pattern reading** — most important KPIs at top-left.
- **Visual hierarchy** — size signals importance.
- **Grouping** — related panels adjacent. `splunk.rectangle`
  backgrounds delimit zones.
- **Whitespace** — minimum 20 px gutters and canvas margins.
- **Consistent column widths** — 2-column or 3-column grid; stick to
  it.

## Typography

- **Panel titles** — 40 char max, 3–5 words, Title Case.
- **Descriptions** — only when non-obvious. One sentence.
- **Section headers** — `splunk.markdown` `### Section`. 2–4 words.
- **Avoid paragraphs** — dashboards read at a glance.
- **Axis labels** — human-readable + units (`"Latency (ms)"`).

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

## Spacing, radius, type scale

| Token | px | Use |
|---|---|---|
| `S_2_5` | 20 | **Default gutter between panels** |
| `R_CARD` | 8 | **Default card radius** |
| `FS_KPI_MAJOR` | 48 | **Standard KPI majorValue** |

Full scale tables in [PALETTE.md](PALETTE.md).

## Depth and layering

Dashboard Studio has no box-shadow, no backdrop-blur. Depth comes from
**layered rectangles** — `splunk.rectangle` first in
`layout.structure` (renders behind), KPIs after.

**Array-order rule:** earlier = behind, later = in front. No
`z-index`.

**Shape layouts only:** `splunk.rectangle` / `splunk.ellipse` require
`layout.type: "absolute"`. Silently ignored on grid / tabs.

## What Dashboard Studio cannot deliver

- Animations / keyframes / pulsing alerts / transitions.
- True glassmorphism / backdrop-blur.
- Gradient text on KPIs.
- Custom chart fonts (only `splunk.markdown` has `fontFamily`).
- Pan/zoom map overlays.
- Conditional viz visibility via expression — use
  `containerOptions.visibility` with conditions instead.

## The Splunk Dashboard Slop Test

> *If I showed this dashboard to an SRE, a SOC analyst, or a VP of
> Engineering and said "an AI made this" — would they nod without
> hesitation?*

If yes, the dashboard has failed. A well-made Splunk dashboard makes
an operator ask "who built this?" not "which model generated this?"

Run before completion. A single NO means rewrite:

- [ ] Archetype committed (one of four).
- [ ] Theme derived from audience (NOC=dark, exec PDF=light).
- [ ] Canvas `backgroundColor` set explicitly.
- [ ] KPI row has semantic polarity (status ≠ informational).
- [ ] KPI row has visual hierarchy (anchor KPI hero-sized).
- [ ] Every table has a drilldown.
- [ ] Every input has a `defaultValue`.
- [ ] Every search is time-bounded.
- [ ] Series colours from categorical palette (semantic never leaks).
- [ ] Colour paired with icon / label / shape.
- [ ] Pie ≤6 slices (or replaced with bar).
- [ ] Panel titles ≤40 chars, Title Case.
- [ ] Depth from layered rectangles where archetype calls for them.

## See also

- [PALETTE.md](PALETTE.md) — full palettes (`SERIES_CATEGORICAL_10`,
  `SERIES_SOC_8`, `SERIES_STUDIO_20`), canvas tokens, spacing /
  radius / type scale.
- [CHART-SELECTION.md](CHART-SELECTION.md) — full 27-viz decision
  table.
- `ds-syntax` — JSON envelope.
- `ds-viz-pitfalls` — cross-skill viz-specific traps.
- `ds-viz-bar` / `ds-viz-singlevalue` etc. — per-viz reference.
