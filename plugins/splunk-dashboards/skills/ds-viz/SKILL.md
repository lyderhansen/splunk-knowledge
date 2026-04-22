---
name: ds-viz
description: Reference skill documenting every Splunk Dashboard Studio (v2) visualization type and the options each one accepts. Covers splunk.singlevalue, splunk.line, splunk.column, splunk.bar, splunk.pie, splunk.area, splunk.table, splunk.timeline, splunk.choropleth, splunk.markergauge. Use this skill when picking or configuring a visualization for a panel, when ds-create needs per-type option detail, or when answering standalone questions about viz options.
---

# ds-viz — Visualization reference

Each section covers one Dashboard Studio visualization type: required fields, common options, and a minimal example. All examples show only the contents of the `visualizations.<key>` object.

## splunk.singlevalue

Displays a single number. Best for KPIs.

**Data shape:** one row, one column (use `| stats count` or similar).

**Common options:**

- `majorColor` — hex color for the number
- `sparklineDisplay` — `"off"`, `"above"`, `"below"`
- `unit` — string shown next to the value (e.g., `"ms"`, `"%"`)
- `majorValue` — field name to display (defaults to first numeric column)

```json
{
  "type": "splunk.singlevalue",
  "title": "Failed Logins",
  "dataSources": { "primary": "ds_1" },
  "options": { "majorColor": "#d13d3d", "unit": "" }
}
```

## splunk.line

Line chart. Best for trends over time.

**Data shape:** `_time` + one or more numeric series (usually produced by `| timechart`).

**Common options:**

- `xAxisTitle`, `yAxisTitle` — axis labels
- `yAxisMin`, `yAxisMax` — numeric bounds (auto if omitted)
- `lineWidth` — 1–4
- `showLegend` — boolean

```json
{
  "type": "splunk.line",
  "title": "Latency Trend",
  "dataSources": { "primary": "ds_2" },
  "options": { "showLegend": true, "yAxisTitle": "ms" }
}
```

## splunk.column

Vertical bar chart (categorical x-axis).

**Data shape:** one categorical field + one or more numeric series (e.g., `| stats count by category`).

**Common options:**

- `stackMode` — `"default"`, `"stacked"`, `"stacked100"`
- `showLegend` — boolean

```json
{
  "type": "splunk.column",
  "title": "Counts by Service",
  "dataSources": { "primary": "ds_3" },
  "options": { "stackMode": "default" }
}
```

## splunk.bar

Horizontal bar chart (categorical y-axis). Same data shape and options as `splunk.column`, rotated 90 degrees.

```json
{
  "type": "splunk.bar",
  "title": "Top Source IPs",
  "dataSources": { "primary": "ds_4" },
  "options": {}
}
```

## splunk.pie

Pie chart. Use sparingly — only for a small number of categories (≤ 6).

**Data shape:** one categorical field + one numeric (e.g., `| top limit=5 severity`).

**Common options:**

- `showDonut` — boolean (renders as a donut with a hole)
- `showLabels` — boolean
- `showPercent` — boolean

```json
{
  "type": "splunk.pie",
  "title": "Severity Breakdown",
  "dataSources": { "primary": "ds_5" },
  "options": { "showDonut": true, "showPercent": true }
}
```

## splunk.area

Filled-area time series. Same data shape as `splunk.line`; use for cumulative / stacked visuals.

**Common options:**

- `stackMode` — `"default"`, `"stacked"`, `"stacked100"`
- `opacity` — 0.0–1.0

```json
{
  "type": "splunk.area",
  "title": "Throughput by Service",
  "dataSources": { "primary": "ds_6" },
  "options": { "stackMode": "stacked" }
}
```

## splunk.table

Tabular display of all returned columns.

**Data shape:** any tabular result.

**Common options:**

- `rowNumbers` — boolean
- `columnFormat` — object keyed by column name for per-column formatting
- `drilldown` — `"row"` / `"cell"` / `"none"` (see `ds-syntax` for drilldown details)

```json
{
  "type": "splunk.table",
  "title": "Slowest Endpoints",
  "dataSources": { "primary": "ds_7" },
  "options": { "rowNumbers": true, "drilldown": "row" }
}
```

## splunk.timeline

Shows discrete events on a timeline. Useful for incident overlays.

**Data shape:** `_time` + `label` (or equivalent).

**Common options:**

- `axisTitle` — timeline axis label
- `colorField` — field whose value drives per-event color

```json
{
  "type": "splunk.timeline",
  "title": "Deploy Markers",
  "dataSources": { "primary": "ds_8" },
  "options": { "colorField": "env" }
}
```

## splunk.choropleth

Geographic heatmap.

**Data shape:** a geographic key (e.g., `country`, `featureIdField` value) + a numeric.

**Common options:**

- `map` — base map (e.g., `"world"`, `"us"`)
- `featureIdField` — field in the data that matches the map's feature id

```json
{
  "type": "splunk.choropleth",
  "title": "Attacks by Country",
  "dataSources": { "primary": "ds_9" },
  "options": { "map": "world", "featureIdField": "country" }
}
```

## splunk.markergauge

Gauge with a needle/marker. Good for SLA indicators.

**Data shape:** one row, one numeric.

**Common options:**

- `min`, `max` — gauge range
- `majorColor` — color of the needle
- `ranges` — array of threshold bands (`[{ "value": 95, "color": "#ff0" }, ...]`)

```json
{
  "type": "splunk.markergauge",
  "title": "p95 Latency",
  "dataSources": { "primary": "ds_10" },
  "options": { "min": 0, "max": 1000, "ranges": [ { "value": 500, "color": "#f90" }, { "value": 1000, "color": "#d00" } ] }
}
```

## Picking a viz type

| Question shape | Recommended viz |
|---|---|
| "What's the current <metric>?" | `splunk.singlevalue` |
| "How has <metric> changed over time?" | `splunk.line` or `splunk.area` |
| "Top N <thing> by <metric>" | `splunk.bar` (horizontal) or `splunk.column` |
| "Breakdown of <categorical>" | `splunk.pie` (only if ≤ 6 categories) or `splunk.bar` |
| "List of events / rows" | `splunk.table` |
| "When did X events happen?" | `splunk.timeline` |
| "Geographic distribution" | `splunk.choropleth` |
| "Is <metric> above threshold?" | `splunk.markergauge` |
