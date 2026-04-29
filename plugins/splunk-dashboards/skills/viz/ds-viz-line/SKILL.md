---
name: ds-viz-line
description: Splunk Dashboard Studio splunk.line visualization — continuous trend lines over time. Provides configuration patterns for single/multi-series time charts, dual y-axis (count + latency), event annotations, log scale, sparklines, and split sub-charts. Use when the user asks about line charts, trend over time, sparklines, time series, dual axis, latency p95, or annotation overlays in Splunk Dashboard Studio.
---

# splunk.line — continuous trend chart

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_line_dark` / `ds_viz_line_light`.

`splunk.line` plots one or more numeric series against a continuous
x-axis (almost always `_time`). It is the default choice for
trend-over-time questions.

## When to use

- Ordered, continuous data — typically `_time` on x.
- The *trend* (slope, direction, inflection) matters more than the
  absolute snapshot.
- Two to ~6 series. Above that, switch to `splunk.area` (stacked) or
  split each series into its own sparkline tile.

## When NOT to use

- **Categorical comparisons** → `splunk.column` / `splunk.bar`.
- **Distributions or relationships** → `splunk.scatter` / `splunk.bubble`.
- **Snapshots without trend** → `splunk.singlevalue` /
  `splunk.singlevalueradial`.
- **Stacked time series** → `splunk.area` (line has no `stackMode`).

See `ds-pick-viz` for the full decision matrix.

## Quick start

```json
{
  "type": "splunk.line",
  "title": "Requests per hour",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

```spl
| ... | timechart span=5m count by status
```

Output must include `_time` (epoch seconds) and ≥ 1 numeric field.
Fields starting with `_` (other than `_time`) are not plotted.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Time axis:** `xAxisTitleVisibility: "hide"` (the literal string `_time` carries zero info — viewers know x is time). | Set `xAxisTitleText: "Time"` — pure noise. |
| **Colours:** `seriesColorsByField: { allowed: "#33FF99", blocked: "#FF2D95" }`. | `seriesColors: ["#33FF99", "#FF2D95"]` — positional, breaks on SPL `\| eval` reordering. |
| **Nulls:** `nullValueDisplay: "gaps"` (default) or `"connect"` for sampling holes. | `nullValueDisplay: "zero"` — conflates "no data" with "metric was zero". |
| **Log scale:** pair `yAxisScale: "log"` with `yAxisMin: "1"` and `showYMinorGridLines: false`. | Use log without `yAxisMin` — log rejects ≤ 0 silently and series vanish. |
| **Annotations:** secondary `dataSources.annotation` keyed `_time, annotationLabel, annotationColor`. | Use `annotationX/Label/Color` without the second data source — DOS expressions return null and no marks render. |
| **Stacking:** switch to `splunk.area` (line has no `stackMode`). | Try to add `stackMode: "stacked"` — silently ignored on line. |
| **Splits:** always pair `showSplitSeries: true` with `showIndependentYRanges: true` when ranges differ. | Use split without independent ranges — small-range series get squashed. |
| **Drilldown:** `eventHandlers.setToken` reads `row.<field>.value` for table drilldown, `click.value` for click events. | Read `$click.value2$` — that's scatter/bubble territory. |

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: minimal, multi-series,
  named colours, dual axis, annotations, log + nulls, dash styles,
  splits, sparkline, multi-overlay, dash style reference.
- [OPTIONS.md](OPTIONS.md) — line-specific + shared options reference.
- [GOTCHAS.md](GOTCHAS.md) — version-specific traps.
- `ds-viz-area` — stacked / cumulative trends.
- `ds-viz-column` / `ds-viz-bar` — categorical bars + the place where
  annotation usage on bars is contraindicated.
- `ds-design-principles` — colour discipline.
