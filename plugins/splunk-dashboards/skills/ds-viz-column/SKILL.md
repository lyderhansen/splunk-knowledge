---
name: ds-viz-column
description: Splunk Dashboard Studio splunk.column visualization — vertical bar charts. Provides configuration patterns for time-bucketed counts, categorical comparisons, stacked breakdowns, target-vs-actual overlay, and annotated columns. Use when the user asks about column charts, vertical bars, time-bucketed histograms, daily/hourly counts, or stacked breakdowns in Splunk Dashboard Studio.
---

# splunk.column — vertical bar chart

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_column_dark` / `ds_viz_column_light` in
`splunk-knowledge-testing`.

`splunk.column` renders **vertical bars**: categories on the x-axis,
values on the y-axis. Horizontal twin is `splunk.bar` (`ds-viz-bar`).

## When to use

- Comparing values across a small set of categories (≤ ~15).
- Time-bucketed counts where bars communicate "discrete event per
bucket" better than a line (daily signups, hourly errors).
- `stackMode: "stacked"` when totals matter as much as breakdown.
- `stackMode: "stacked100"` when proportions matter, totals don't.
- `columnGrouping: "overlay"` only for *target vs actual* per category.

## When NOT to use

- **Continuous trends** → `splunk.line` / `splunk.area`.
- **Many categories with long labels** → switch to `splunk.bar`
(horizontal — labels read naturally).
- **>30 categories** — bars get too thin to read.

See `ds-pick-viz` for the full decision matrix.

## Quick start

```json
{
  "type": "splunk.column",
  "title": "Daily signups (30d)",
  "dataSources": { "primary": "ds_signups" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "yAxisTitleText": "Signups",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

```spl
| ... | timechart span=1d count
```

## Do / Don't


| ✅ Do                                                                                                                   | ❌ Don't                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Binding:** SPL emits `category, value` columns; viz auto-binds first as x-axis category.                             | Add `"x":` or `"y":` DOS options (those are scatter/bubble-only).                                           |
| **Axes:** hide `xAxis*Title` and `MajorTick`; keep `yAxisTitleText` set on the value axis.                             | Show both axis titles — duplicates the chart title and the labels.                                          |
| **Stacking:** `stackMode: "stacked"` for totals, `"stacked100"` for share.                                             | Mix `stackMode` with `columnGrouping: "overlay"` — Splunk silently ignores `stackMode` when overlay is set. |
| **Overlay:** `columnGrouping: "overlay"` for target-vs-actual; bars are semi-transparent so both visible.              | Use overlay for >2 series — overlapping fills become unreadable.                                            |
| **columnGrouping valid values:** `"auto"` (default), `"overlay"`, or a DOS string (`"> ..."`).                          | Set `columnGrouping: "stacked"` — that's `stackMode`, not `columnGrouping`. Causes schema rejection: `must match pattern`. |
| **Long labels:** `xAxisLabelRotation: -45` (the most readable non-zero value).                                         | Leave labels at `0` rotation when categories are long enough to clip.                                       |
| **Negative deltas:** `showYAxisWithZero: true` + `seriesColors` per sign.                                              | Default y-range — bars rebase on min, hiding the zero line.                                                 |
| **Annotations:** secondary `annotation` data source + `annotationX/Label/Color`. **Available on column** (NOT on bar). | Try to put annotations on `splunk.bar` — option not in bar's PDF table.                                     |
| **Drilldown:** `eventHandlers` with `drilldown.setToken`, read `row.<field>.value`.                                    | Read `$click.value$` / `$click.value2$` (those are scatter/bubble events).                                  |


## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: minimal, grouped,
stacked, stacked100, overlay, sparkline, log scale, rotated labels,
data labels, dual axis, annotations, split series.
- [OPTIONS.md](OPTIONS.md) — full column-specific + shared options.
- [GOTCHAS.md](GOTCHAS.md) — column-specific gotchas + cross-version
warnings.
- `ds-viz-bar` — horizontal twin (use when labels are long).
- `ds-viz-line` — continuous trends and shared option detail (axis
tuning, dual axis, annotations).
- `ds-pick-viz` — viz selection router.

