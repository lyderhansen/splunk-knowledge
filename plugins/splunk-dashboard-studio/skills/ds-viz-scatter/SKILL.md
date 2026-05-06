---
name: ds-viz-scatter
description: Splunk Dashboard Studio splunk.scatter visualization — relationship plot for two numeric dimensions with optional category split. Provides patterns for cluster identification, outlier detection, correlation analysis, and cohort comparison via category colour. Use when the user asks about scatter plots, X-Y plots, correlation visualization, cluster analysis, or two-numeric relationship in Splunk Dashboard Studio.
---

# splunk.scatter — two-dimension scatter

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_scatter_dark` / `ds_viz_scatter_light`.

A scatter chart plots discrete points across two numeric axes. A third
categorical field optionally splits the points into series, each with
its own colour.

## When to use

- Both x and y are **numeric** (not time, not categorical text).
- Looking for **clusters, outliers, or correlations**.
- Third field as **category colour** is useful (status, service,
  segment).

## When NOT to use

| Story | Pick instead |
|---|---|
| Same, but third dimension as marker size | `splunk.bubble` |
| Density / categorical heatmap by hour | `splunk.punchcard` |
| Many dimensions per row | `splunk.parallelcoordinates` |
| Time on x-axis | `splunk.line` (preferred) |

## Quick start

```json
{
  "type": "splunk.scatter",
  "title": "Latency vs throughput",
  "dataSources": { "primary": "ds_perf" },
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "category": "> primary | seriesByName('service')",
    "markerSize": 6,
    "xAxisTitleText": "Throughput",
    "yAxisTitleText": "Latency (ms)"
  }
}
```

```spl
... | stats avg(throughput) as throughput, avg(latency_p95) as latency by service
| table service throughput latency
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Bind explicitly:** `seriesByName(...)` for x/y/category. | Default `seriesByIndex(0/1/2)` without `\| table` — column order can shift between SPL runs. |
| **Marker size:** `markerSize: 6`–`10` for low point counts; default `4` for dense. | Increase `markerSize` blindly with 1000+ points — markers overlap completely. |
| **Time on x:** switch to `splunk.line`. | Use scatter with `_time` on x — scatter axes are linear/log numeric only. |
| **Colour-by-value:** `seriesColorsByField`. | `seriesColors` array — palette maps **alphabetically** to categories. |
| **Log scale:** filter zero/negative values upstream. | `xAxisScale: "log"` with ≤ 0 values — silently fails. |
| **Drilldown:** `eventHandlers` reads `row.<field>.value`. | Read `$click.value$` / `$click.value2$` outside scatter/bubble — those are scatter-/bubble-specific tokens. |
| **Annotations:** put context elsewhere on dashboard. | Try to use `annotation*` options — scatter has none. |

## Verified patterns

13 panels in the test bench. Inspect `ds_viz_scatter_dark` for live
JSON. Patterns: default, explicit bindings, three-series with category,
larger markers, custom palette, lock colour to category, log y, tight
axes, hide titles + keep labels, stripped editorial style, legend
bottom + truncation, canonical PDF example, `backgroundColor` tint.

## Options summary

DOS bindings: `x`, `y`, `category`, `xField`, `yField`, `categoryField`.

Markers: `markerSize` (default `4`), `resultLimit` (default `50000`).

Colour: `seriesColors`, `seriesColorsByField`, `backgroundColor`.

Legend: `legendDisplay` (default `"right"`), `legendTruncation`
(default `"ellipsisEnd"`).

Axes (mirrored x and y): `xAxisMin`/`Max`, `yAxisMin`/`Max`,
`xAxisScale` / `yAxisScale` (linear|log), `xAxisAbbreviation` /
`yAxisAbbreviation`, `showXAxisExtendedRange` / `showYAxisExtendedRange`,
`showXAxisWithZero` / `showYAxisWithZero`, `showRoundedXAxisLabels`,
`showYMajorGridLines`, `showXMinorGridLines` /
`showYMinorGridLines`, `xAxisLabelRotation`, `xAxisLabelVisibility` /
`yAxisLabelVisibility`, `xAxisLineVisibility` / `yAxisLineVisibility`,
`xAxisMajorTickInterval` / `yAxisMajorTickInterval`, tick sizes and
visibilities, axis title text and visibility.

For full table, see [OPTIONS.md](OPTIONS.md).

## What scatter does NOT have

- **No annotations** — unlike line/area/column.
- **No stacking, no dual axis, no marker size encoding** (use bubble).

## Drilldown

```json
"eventHandlers": [
  {
    "type": "drilldown.customUrl",
    "options": { "url": "/app/myapp/service?name=$row.service$" }
  }
]
```

## See also

- `ds-viz-bubble` — same shape with size as third dimension.
- `ds-viz-line` — when x is `_time`.
- `ds-viz-punchcard` — categorical x and y with intensity.
- `ds-viz-parallelcoordinates` — more than three dimensions.
- `ds-ref-design-principles` — chart selection table.
