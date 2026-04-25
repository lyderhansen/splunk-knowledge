---
name: ds-pick-viz
description: Router skill — pick the right Splunk Dashboard Studio visualization type from an intent description. Use when the user describes WHAT they want to show ("fordeling per region", "trend over time", "status per service") but has not yet specified which visualization. Outputs one recommendation, a one-line rationale, and the next skill to load (ds-viz-<type>). Read before any specific ds-viz-* skill when the viz type is not yet decided.
---

# ds-pick-viz — Choose the right Dashboard Studio visualization

A short routing skill. It does **one thing**: take a description of what the user wants to display and output the single best visualization type to use, plus the next skill to read for full options.

## When to use

Read this skill when:

- The user describes intent ("show fill rate per warehouse", "trend of failures over the last 24 h") without specifying a viz type.
- An upstream skill (`ds-create`, `ds-update`, `ds-design`) needs to bind data to a panel and the viz type is not chosen yet.
- A user asks "which chart should I use for X?".

Skip this skill (read `ds-viz-<type>` directly) when:

- The user already named a viz type ("legg til en sankey", "make this a markergauge").
- The decision is already locked in `requirements.md` or `layout.json`.

For deeper rationale (archetype context, color/typography, antipatterns as philosophy), see `ds-design-principles`. This skill is the **fast path** — it answers the question and gets out of the way.

## How to use

1. Map the user's intent to one row in the decision table below.
2. State the recommended viz in one line.
3. State the *why-not* reason for the closest alternative, in one line.
4. Tell the agent: `Read plugins/splunk-dashboards/skills/viz/ds-viz-<type>/SKILL.md` for full option detail.

If two rows could fit, prefer the one with the **lower data-cardinality requirement** (e.g., `column` before `bar` when label length is unknown; `singlevalue` before `markergauge` when no threshold is given).

## Decision table

| User intent | Use | Required SPL columns | Why not the closest alternative |
|---|---|---|---|
| Latest single number, big and bold | `singlevalue` | one numeric field | Not `markergauge`: gauge implies a threshold context |
| Latest number + status icon (pass/fail/warn) | `singlevalueicon` | numeric + status string | Not `singlevalue` alone: numeric requires manual threshold reading |
| Single number on a radial dial | `singlevalueradial` | numeric + min + max | Not `markergauge`: radial is decorative; gauge is functional |
| Trend over time, 1–6 series | `line` | `_time` + value(s) per series | Not `column`: column implies discrete categories, not continuous time |
| Trend with stacked composition | `area` (stacked) | `_time` + multiple series | Not `line`: stacked area shows part-of-whole evolving over time |
| Compare discrete categories, vertical bars | `column` | category + numeric | Not `bar`: column is for short labels and time-on-X |
| Compare categories, long category labels | `bar` (horizontal) | category + numeric | Not `column`: long x-axis labels rotate and become unreadable |
| Part-of-whole, ≤5 slices | `pie` | category + numeric | With > 5 slices use `bar` — slices become unreadable |
| Tabular data with per-row formatting / drilldown | `table` | any | Not chart: exact values + drilldown require table |
| Geographic distribution by country/state polygon | `choropleth-svg` | region code + value | Not `map`: needs lat/lon; choropleth fills polygons |
| Geographic distribution with point markers | `map` | `lat` + `lon` (+ optional value) | Not `choropleth-svg`: map shows individual points, not regions |
| Geographic distribution by US state | `choropleth-map` | state code + value | Not `choropleth-svg`: built-in US-only; svg is for any region |
| Flow between stages (funnel, attribution, network paths) | `sankey` | source + target + value | Not stacked bar: Sankey shows path, stacked bar shows totals |
| Metric vs threshold, headroom matters | `markergauge` | numeric + thresholds | Not `singlevalue`: marker shows distance to threshold |
| 0–100 % progress / capacity fullness | `fillergauge` | numeric (0–100) | Not `markergauge`: filler implies a continuum, marker implies a target |
| Activity by hour-of-day × day-of-week | `punchcard` | hour + weekday + count | Not heatmap-as-table: punchcard reveals temporal pattern |
| Network / dependency graph | `linkgraph` | source + target (+ value) | Not `sankey`: linkgraph shows topology, sankey shows flow |
| Multi-dimensional comparison (>2 numeric axes) | `parallelcoordinates` | several numeric fields per row | Not `scatter`: scatter handles 2 dims, parallel coords handles many |
| Correlation between two measures | `scatter` | two numeric fields | Not `line`: line implies an order, scatter does not |
| Three-variable correlation (x, y, volume) | `bubble` | three numeric fields | Not `scatter`: bubble encodes magnitude in radius |
| Discrete events on a timeline (incidents, deploys) | `timeline` | `_time` + event label | Not `line`: line is for continuous metrics, timeline for categorical events |
| Raw event stream | `events` | _raw | Not `table`: events preserves the original event view |
| Section header / instructions / static prose | `markdown` | none | Not `table`: text content is not data |
| Logo / static image | `image` | none (static URL) | Not `markdown`: markdown cannot embed arbitrary images |
| Visual grouping, card background, depth layer | `rectangle` | none | Layer behind viz panels for depth and grouping |
| Decorative dot, status indicator, legend swatch | `ellipse` | none | Use sparingly — most uses are better as a labeled `singlevalueicon` |

## Anti-patterns — block these before recommending

If the user asks for something that maps to one of these, push back instead of recommending:

- **Pie with > 5 slices** → recommend `bar` (sorted, top-N) and explain that slices become unreadable.
- **Line with > 6 series** → recommend top-N filter in SPL plus `line`, or `table` with sparkline columns.
- **3D pie / 3D column / any 3D effect** → never. There is no 3D option in Dashboard Studio and emulating it via skewed shapes is bad practice.
- **Map of countries with `lat`/`lon` coordinates only** → if the user wants country-level shading, recommend `choropleth-svg`. `map` is for individual point distributions.
- **Singlevalue + threshold without color/icon** → upgrade to `singlevalueicon` or `markergauge`; numeric alone forces the operator to do mental threshold math.
- **Stacked bar to show flow** → recommend `sankey` instead; stacked bar shows category totals, not movement.

## Output format for the agent

When invoked, reply in this exact shape (one paragraph, no preamble):

```
Recommend: <viz-type>
Why: <one sentence>
Why not <closest alt>: <one sentence>
Next: Read plugins/splunk-dashboards/skills/viz/ds-viz-<type>/SKILL.md for options and a working JSON example.
```

If the intent is ambiguous, ask **one** clarifying question instead of guessing. Examples:

- "Är det fordeling per kategori (én sum per kategori) eller fordeling over tid (sum per kategori per time)?" → first → `column` / `pie`; second → `line` / stacked `area`.
- "Trenger du å se den eksakte verdien per rad, eller bare mønsteret?" → exact → `table`; pattern → chart of choice.

## Related skills

- `ds-design-principles` — full archetype + chart-selection rationale (read when designing a whole dashboard, not picking one viz).
- `ds-syntax` — Dashboard Studio JSON schema (dataSources, layout, tokens, drilldowns).
- `ds-viz-<type>` — per-type option reference (one skill per visualization).
