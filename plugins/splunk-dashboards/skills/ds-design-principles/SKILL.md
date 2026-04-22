---
name: ds-design-principles
description: >
  Standalone reference skill for Splunk dashboard design decisions. Covers the four canonical
  dashboard archetypes (executive summary, operational monitoring, analytical deep-dive, SOC
  overview), layout principles, KPI sizing rules, a chart-selection decision table for all 27
  Dashboard Studio viz types, color semantics, typography, and 10 common antipatterns. Invoked
  by ds-design / ds-create / ds-review at decision points, or directly when the user asks
  open-ended design questions: "what should my dashboard look like?", "which chart for X?",
  "how do I structure this?".
---

# ds-design-principles — Dashboard design reference

---

## When to use

- **Before `ds-design`** — choose the archetype and panel count that fits the audience before wireframing begins.
- **During `ds-create`** — pick the right viz type when the layout left it unspecified, and confirm color/sizing choices.
- **Standalone** — when the user asks open-ended design questions without invoking the full pipeline.

---

## Dashboard archetypes

Four canonical layouts. Pick one based on audience and primary question.

### Executive summary

**Audience:** Leadership, management  
**Panel count:** 6–8  
**Purpose:** "Is everything healthy right now?" — glance-readable in 5 seconds.  
**Typical panels:** 3–5 hero singlevalues, one trend line chart, one top-N bar or summary table.

```text
+----------------------------------------------------------+
| [Time Range]                                             |
+------------+------------+------------+------------------+
| KPI 1      | KPI 2      | KPI 3      | KPI 4            |
| big number | big number | big number | big number       |
+---------------------------+------------------------------+
| Primary Trend (line)      | Top-N Summary (bar/table)    |
|                           |                              |
+---------------------------+------------------------------+
```

---

### Operational monitoring

**Audience:** On-call engineers, NOC  
**Panel count:** 8–12  
**Purpose:** "What is happening right now?" — real-time status at a glance.  
**Typical panels:** Status KPI tiles, active incidents timeline, metric time-series, alert table.

```text
+----------------------------------------------------------+
| [Time Range] [Host Filter] [Severity]                    |
+--------+--------+--------+--------+--------------------+
| KPI    | KPI    | KPI    | KPI    | KPI (alert count)  |
+----------------------------+-----------------------------+
| Metric time-series (line)  | Status table (drilldown)    |
|                            |                             |
+----------------------------+-----------------------------+
| Alert history / timeline (full width)                    |
+----------------------------------------------------------+
```

---

### Analytical deep-dive

**Audience:** Analysts, investigators  
**Panel count:** 10–14 (use tabs to avoid overload)  
**Purpose:** "What caused this and what does the data show?" — detail-first, exploration-driven.  
**Typical panels:** Prominent multi-field filters, multi-series charts, large drilldown tables, scatter/bubble for correlation.

```text
+----------------------------------------------------------+
| [Time] [Field A] [Field B] [Field C] [Field D]           |
+-----------------------+----------------------------------+
| Distribution (bar)    | Correlation (scatter/bubble)     |
+-----------------------+----------------------------------+
| Time series (multi-series line / area)                   |
+----------------------------------------------------------+
| Detail table (all fields, drilldown to detail view)      |
| (large — 200-300px tall, paginated)                      |
+----------------------------------------------------------+
```

---

### SOC overview

**Audience:** SOC analysts  
**Panel count:** 7–10  
**Purpose:** "Where are threats, how severe, and what just happened?"  
**Typical panels:** 3–4 alert-count KPIs, geo-map of attack sources, severity breakdown pie, recent events timeline, top attacker IPs table.

```text
+----------------------------------------------------------+
| [Time Range] [Severity] [Source]                         |
+--------+--------+--------+--------------------------------+
| Total  | Crit   | High   | Avg Response Time              |
| Events | Alerts | Alerts |                                |
+----------------------------+-----------------------------+
| Attack geo-map             | Severity breakdown (pie)    |
| (choropleth.map)           | (max 5 categories)          |
+----------------------------+-----------------------------+
| Recent alerts table (full width, severity coloring)      |
+----------------------------------------------------------+
```

---

## Layout principles

- **F-pattern reading** — users scan top-left first. Place the most important KPIs at top-left; supplementary detail below and right.
- **Visual hierarchy** — size signals importance. Primary chart larger than secondary; KPIs larger than table rows.
- **Grouping** — related panels stay adjacent. Use background rectangles (`splunk.rectangle`) or section markdown headers to delimit zones.
- **Whitespace** — minimum 20 px gutters and 20 px canvas margins. Crowded dashboards are unread dashboards.
- **Consistent column widths** — choose a grid (e.g., 2-column or 3-column) and stick to it. Avoid panels of arbitrary widths that break the visual rhythm.

### Recommended canvas zones (absolute layout, 1440 × 960 px)

```text
x=0                                               x=1440
y=0   +-------------------------------------------------+
      | Canvas margin (20 px)                           |
y=20  | [Input bar: time + filters]           h=40      |
y=80  | [KPI row — background rect]           h=160     |
      |  KPI1 | KPI2 | KPI3 | KPI4                      |
y=260 | [Primary chart zone]                  h=340     |
      |  Main chart (w=860) | Table (w=520)             |
y=620 | [Secondary / detail zone]             h=300     |
      |  Alert history / secondary chart               |
y=940 | [Footer / nav links]                  h=20      |
y=960 +-------------------------------------------------+
```

- **Panel minimum heights:** singlevalue 120 px, chart 240 px, table 200 px.
- **Gutter rule:** 20 px between every panel edge; 20 px from canvas edges.
- **KPI background card:** `splunk.rectangle` at `y=80, h=160` positioned behind KPI panels.

### Input bar guidelines

- Time range picker always first (leftmost), 300–350 px wide.
- Filter dropdowns 200–250 px wide each, ordered broadest → narrowest (Region → Site → Equipment).
- Keep inputs to a single row (h=40 px). Split onto a second row only if 5+ filters.
- Use user-facing labels: `"Site"` not `"site_id"`, `"Time Range"` not `"time_picker"`.

---

## KPI sizing rules

- **Minimum size:** 3×3 grid cells (absolute layout: ~300 px wide × 120 px tall). Below this, major values become unreadable at distance.
- **Recommended width:** 300–440 px for a 4-KPI row on a 1440 px canvas. Font size 36–56 px.
- **Max per row:** 6 KPIs. Above 6, shrink font to unreadable sizes or reduce column width below minimum.
- **Semantic rows:** Group KPIs by theme — availability metrics together, performance metrics together. Never mix unrelated KPIs in the same row.
- **Show a trend:** Add `trendValue` (vs previous period) or `sparklineDisplay` when the direction matters as much as the current value.
- **Keep units visible:** Always set the `unit` option (`"%"`, `"ms"`, `"°C"`). Never make users guess the unit.
- **`splunk.singlevalueicon`** — prefer over bare `splunk.singlevalue` when the KPI represents a binary or categorical status (healthy/critical, pass/fail); the icon communicates state without requiring threshold reading.
- **`splunk.markergauge`** — use when a hard SLA or threshold exists (e.g., p95 latency < 500 ms). Needle position communicates margin at a glance; `singlevalue` alone does not.
- **`splunk.fillergauge`** — use for percentage-completion metrics (disk usage, quota consumption). Avoid for time-series KPIs.
- **`splunk.singlevalueradial`** — alternative to fillergauge for percentage metrics; use when the circular form fits the layout better.
- **Dynamic `majorColor`** — status KPIs: `"> if(value < 90, '#F74B4A', if(value < 98, '#FFB300', '#00C853'))"`. Informational-only counts: static `"#00A4FD"`.

### KPI grouping with background cards (Dashboard Studio absolute layout)

```text
splunk.rectangle  x=20,  y=80,  w=1400, h=160   (card behind KPIs)
KPI 1             x=30,  y=90,  w=320,  h=140
KPI 2             x=370, y=90,  w=320,  h=140
KPI 3             x=710, y=90,  w=320,  h=140
KPI 4             x=1050,y=90,  w=350,  h=140
```

Rule: card edge + 10 px = panel edge on all sides. Place the rectangle entry in `layout.structure` before the KPI entries so it renders behind them.

---

## Chart selection — decision table

| Question shape | Recommended viz | Why not X |
|---|---|---|
| What is the current value of one metric? | `splunk.singlevalue` + threshold coloring | Not bar: values aren't comparable across time |
| How has a metric changed over time? | `splunk.line` | Not bar: bars imply discrete categories, not continuous time |
| How does a cumulative total stack over time? | `splunk.area` (stacked) | Not line for cumulative: lines obscure part/whole |
| How do discrete categories compare? | `splunk.column` (vertical) | Not pie with > 6 cats: slices become unreadable |
| What are the top N (many categories)? | `splunk.bar` (horizontal, sorted) | Not column: long labels rotate unreadably on x-axis |
| What is the part-to-whole breakdown? | `splunk.pie` or `splunk.column` — pie ONLY if ≤ 6 slices | Pie with > 6 slices: use bar instead |
| How does a metric stand relative to a threshold? | `splunk.markergauge` | Not singlevalue alone: margin/headroom invisible |
| What percentage of capacity is consumed? | `splunk.fillergauge` | Not line: fill communicates fullness better |
| Is a status pass or fail? | `splunk.singlevalueicon` | Not singlevalue: numeric alone requires threshold reading |
| Correlation between two measures? | `splunk.scatter` | Not line: line implies time ordering |
| Three-variable correlation (x, y, volume)? | `splunk.bubble` | Not scatter: bubble adds dimension without extra chart |
| Event frequency by hour × weekday? | `splunk.punchcard` | Not table: punchcard reveals patterns tables hide |
| Geographic distribution of events? | `splunk.choropleth.map` (geo) or `splunk.choropleth.svg` (custom) | Not table: location patterns invisible in rows |
| Flow between sources and targets? | `splunk.sankey` | Not stacked bar: Sankey shows path, not just totals |
| Timeline of discrete events/incidents? | `splunk.timeline` | Not line: timeline handles categorical events, not metrics |
| Dense tabular detail with drilldown? | `splunk.table` | Not chart: exact values and drilldown require table |
| Multi-dimensional comparison across categories? | `splunk.parallelcoordinates` | Not scatter: parallel coords handles > 2 dimensions |
| Graph of nodes and links? | `splunk.linkgraph` | Not table: relationships invisible in rows |
| Context / section header / instructions? | `splunk.markdown` | Not table: table implies data, not prose |
| Logo or static image? | `splunk.image` | Not markdown: markdown cannot embed arbitrary images |
| Visual grouping / card background? | `splunk.rectangle` or `splunk.ellipse` | Not panel borders alone: shapes allow layering |

---

## Color principles

- **One or two accent colors maximum** per dashboard. Everything else neutral. Accent colors guide the eye to the most important element.
- **Semantic colors are not negotiable** — operators rely on instant recognition. Never swap green/amber/red for brand colors.
- **Colorblind safety** — never rely on red/green alone. Always pair color with a shape, icon, or label (e.g., "CRITICAL" text + red background, not just red).
- **Ordered data uses sequential gradients**, not rainbow. Rainbow palettes make ordered data appear categorical.
- **Consistent series colors** — if `service_a` is blue in chart 1, it must be blue in chart 2. Use `seriesColorsByField` to enforce this.
- **Never use status colors as series colors** — a green data series will be confused with "OK" status.
- **Custom accent colors** must meet WCAG AA contrast (4.5:1) against the canvas background. Avoid any color visually confusable with the status palette.

### Semantic status palette

| Status | Dark theme | Light theme | Use for |
|---|---|---|---|
| Critical / Error | `#F74B4A` | `#C0392B` | Alarms, failures, threshold breaches |
| Warning | `#FFB300` | `#D4820A` | Approaching limits, degraded |
| High / Elevated | `#F58F39` | `#C05C00` | Exceeding soft limit |
| OK / Healthy | `#00C853` | `#2B9E44` | Normal operating state |
| Info / Neutral | `#00A4FD` | `#2066C0` | Informational counts, no health semantics |
| Unknown / No data | `#B0B0BE` | `#9B99A0` | Missing or unavailable data |

### Dark theme canvas defaults

| Element | Hex |
|---|---|
| Canvas background | `#101014` |
| Panel / card fill | `#1A1A2E` |
| Card stroke | `#2C2C3A` |
| Primary text | `#FFFFFF` |
| Secondary text | `#B0B0BE` |

### Dark theme 8-color series palette (use in order)

| Series | Color | Hex |
|---|---|---|
| 1 | Blue | `#00A4FD` |
| 2 | Amber | `#FFB300` |
| 3 | Green | `#00C853` |
| 4 | Red | `#F74B4A` |
| 5 | Purple | `#9B59B6` |
| 6 | Teal | `#1FBAD6` |
| 7 | Orange | `#FB7428` |
| 8 | Pink | `#ED0080` |

Limit charts to 6–8 series. Beyond that, aggregate to Top N + "Other" or split into multiple charts.

### Theme selection guide

| Dashboard type | Recommended theme | Rationale |
|---|---|---|
| Operational / NOC / SOC | Dark | Reduces eye strain on 24/7 displays; status colors pop |
| Executive / report | Light | Familiar for print/PDF; professional for leadership |
| Analytical / investigation | Dark or light | Match existing team tooling |

---

## Typography & text

- **Panel titles** — 40 characters maximum; 3–5 words is ideal. Use title case. Example: `"Failed Logins by Host"`, not `"Chart showing failed login events grouped by hostname over the selected time range"`.
- **Descriptions** — only add when the metric is non-obvious to the audience. One sentence. Sentence case.
- **Section headers** — use `splunk.markdown` with `### Section Name` for long dashboards that need visual zones. Keep header text to 2–4 words. Font color `#B0B0BE` (secondary text), transparent background.
- **Avoid paragraphs** — dashboards are read at a glance. If you need more than two sentences, it belongs in a linked report or tooltip.
- **Capitalization** — Title Case for panel titles; Sentence case for descriptions and markdown body text.
- **Axis labels** — always label axes with human-readable names and units (`"Latency (ms)"`, `"Events per hour"`). Raw field names (`_time`, `count`) are acceptable only for internal dashboards.

---

## Common antipatterns

1. **More than 12 panels on one dashboard** — cognitive overload. Split into tabs or separate dashboards linked by drilldown.
2. **Pie chart with many slices** — unreadable above 6 categories. Replace with a sorted horizontal bar chart.
3. **Stacked area for independent series** — stacking implies cumulative totals; it hides individual series trends. Use a multi-series line chart instead.
4. **Red/green as the only differentiator** — excludes colorblind users (~8% of male users). Always add an icon, shape, or text label alongside color.
5. **Rainbow palette on ordered data** — implies categorical distinction where none exists. Use a sequential single-hue gradient for ordered values.
6. **Tiny singlevalues (smaller than 3×3 cells)** — major value font becomes unreadable at dashboard viewing distance. Enforce minimum 300 px × 120 px.
7. **Dropdowns without default values** — the dashboard renders empty on first load. Always set a sensible default; use `initialValue` in the input definition.
8. **Searches without `earliest`/`latest`** — triggers an unbounded full-index scan. Always bind time tokens from the global time range input via `defaults.dataSources`.
9. **Tables without drilldown** — tables that don't react to row clicks are dead ends. Every table should link to a detail view or set a filter token.
10. **Raw timestamps in tables** — `_time` values in epoch or ISO format are unreadable. Always format with `| eval _time=strftime(_time, "%Y-%m-%d %H:%M:%S")` or use a `columnFormat` display value.

---

## Working with the action skills

| Skill | When design principles applies |
|---|---|
| `ds-init` | Asks about audience and use case → use the archetypes to pick the right template before any files are created. |
| `ds-design` | Wireframes panels → apply layout principles (F-pattern, hierarchy, grouping, whitespace) and KPI sizing rules here. |
| `ds-create` | Builds JSON → apply the chart-selection decision table when the design left viz type unspecified; `--theme` flag enforces semantic colors automatically. |
| `ds-review` | Audits a finished dashboard → flags violations of the antipatterns list above; cross-references color and typography rules. |
