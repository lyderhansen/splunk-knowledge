---
name: ds-viz-parallelcoordinates
description: Splunk Dashboard Studio splunk.parallelcoordinates visualization — multi-axis line chart for high-dimensional data exploration. Provides patterns for correlation discovery, cluster identification, anomaly detection, and workload signatures across 4-8 numeric variables. Use when the user asks about parallel coordinates, multi-dimensional data, correlation analysis, cluster visualization, or anomaly fingerprints in Splunk Dashboard Studio.
---

# splunk.parallelcoordinates — multi-axis correlation chart

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_parallelcoordinates_dark` /
`ds_viz_parallelcoordinates_light`.

A **parallel coordinates** chart draws one vertical axis per field
and one line per row. The line crosses every axis, hitting it at the
row's value for that field. Workhorse for **high-dimensional data
exploration** — 4–8 numeric variables at once.

> "Each axis is a magnifying glass; each line is a fingerprint."

## When to use

- Correlations / clusters across 4–8 numeric fields.
- Anomalous rows in a multi-feature dataset.
- Workload signatures across services (cpu, mem, latency, errors).

## When NOT to use

| You want to show... | Use instead |
|---|---|
| 1–2 dimensions only | `splunk.scatter` / `splunk.line` |
| Time series | `splunk.line` / `splunk.area` |
| Ranked categories | `splunk.bar` / `splunk.column` |
| Exact row inspection | `splunk.table` |

## Quick start

```json
{
  "type": "splunk.parallelcoordinates",
  "title": "Workload signatures",
  "dataSources": { "primary": "ds_signatures" },
  "options": {
    "lineColor": "#00D9FF",
    "lineOpacity": 0.4,
    "showNullAxis": true
  }
}
```

```spl
| stats avg(cpu) as cpu, avg(memory) as memory,
        avg(latency) as latency, sum(errors) as errors by service
| table service cpu memory latency errors
```

**Field order in SPL = axis order.** Reorder with `| table` before
sending to the viz.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Axis order:** `\| table fieldA fieldB fieldC` to control axis sequence. | Trust SPL emit order — `\| stats` and `\| chart` reorder unpredictably. |
| **First column:** allowed to be a categorical label (renders as categorical axis). | Try multiple categorical columns — only one categorical axis renders cleanly (typically first). |
| **Opacity:** drop to `0.1`–`0.2` when rows >50; raise to `0.95` only for <20 rows. | Default `0.5` blindly with 200 rows — chart becomes a solid block. |
| **Colour:** `lineColor` is **global** — single colour for all lines. | Expect per-row colouring — parallel coordinates does not support data-driven colour. For cohort comparison, render separate panels filtered by cohort. |
| **Axes:** ≤8 axes. | Stuff in 12+ axes — labels and lines crush. Use two stacked panels with overlapping axes instead. |
| **Read pattern:** parallel/horizontal lines = strong correlation; X-shape = inverse correlation. | Read it like a line chart left-to-right — each axis is independent. |
| **Nulls:** `showNullAxis: true` (default) exposes a null tick — visible drop-out. | `showNullAxis: false` for "cleaner" look — affected rows silently disappear from that axis, misleading consumers. |

## Four options total

| Option | Type | Default |
|---|---|---|
| `backgroundColor` | string (hex) | theme default |
| `lineColor` | string (hex) | `#7B56DB` |
| `lineOpacity` | number 0–1 OR string `"50%"` | `0.5` |
| `showNullAxis` | boolean | `true` |

## Drilldown

```json
"eventActions": {
  "actions": [
    {
      "type": "openSearch",
      "search": "index=app sourcetype=metrics service=$row.service$"
    }
  ]
}
```

Available tokens:

- `$click.value$` — clicked row's primary value (often categorical label).
- `$row.<field>$` — any field from the underlying row.

## Gotchas

- **Axis order = column order.** Use `| table` to control.
- **>8 axes crushes labels.** Split into two panels.
- **High opacity + many rows = solid block.** Drop opacity.
- **`lineColor` is global.** No per-row tinting from data.
- **`showNullAxis: false` hides drop-outs**, which can mislead.
- **Mixing categorical + numeric:** only one categorical axis (first column) renders cleanly.

## See also

- `ds-viz-bubble` / `ds-viz-scatter` — 2-3 dimension exploration.
- `ds-viz-line` — time series.
- `ds-viz-table` — exact row inspection.
- `ds-design-principles` — when high-dimensional viz beats summary stats.
