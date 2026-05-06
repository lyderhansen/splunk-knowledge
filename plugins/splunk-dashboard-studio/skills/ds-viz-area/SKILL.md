---
name: ds-viz-area
description: Splunk Dashboard Studio splunk.area visualization — filled time series for cumulative or part-to-whole trends. Provides patterns for stacked time charts, stacked100 share-of-traffic, stream graphs, opacity tuning, and combining with line styling. Use when the user asks about area charts, stacked area, cumulative trend, share of traffic over time, or stream graphs in Splunk Dashboard Studio.
---

# splunk.area — filled trend chart

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_area_dark` / `ds_viz_area_light`.

`splunk.area` is `splunk.line` with the region under each series
filled. It excels at **part-to-whole** trends — when the *total*
matters as much as the individual series.

## When to use

- The *total* is the question — share-of-traffic, cumulative load,
  infrastructure breakdown by tier.
- 2–4 stacked series. With 5+, the bottom series visually flatlines.
- `stackMode: "stacked100"` when proportions matter and absolute values
  don't.

## When NOT to use

- **Raw multi-series comparison** → `splunk.line`. Unstacked area is
  hard to read because filled regions overlap.
- **Negative values** — area assumes non-negative inputs.
- **Two series with very different magnitudes** — the small one
  disappears. Use `splunk.line` with `showOverlayY2Axis: true`.
- **Categorical comparisons** → `splunk.column` / `splunk.bar`.

See `ds-pick-viz` for the full decision matrix.

## Quick start

```json
{
  "type": "splunk.area",
  "title": "Traffic by tier",
  "dataSources": { "primary": "ds_stacked" },
  "options": {
    "stackMode": "stacked",
    "areaOpacity": 0.85,
    "seriesColorsByField": {
      "frontend": "#00D9FF",
      "backend":  "#7AA2FF",
      "database": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Requests/sec",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

```spl
| timechart span=5m sum(bytes) as bytes by tier
```

For `stackMode: "stacked100"`, Splunk normalises; pass raw counts.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Stacking:** explicit `stackMode: "stacked"` for cumulative, `"stacked100"` for share. | Rely on default `"auto"` for stacking — `"auto"` is unstacked overlap (regions blend through `areaOpacity`). |
| **Opacity:** `0.85`–`0.9` for stacked (crisp top edge); `0.4`–`0.5` for unstacked overlap. | Use the default `0.75` blindly — too transparent for stacked, too opaque for overlap. |
| **Colours:** `seriesColorsByField` for refactor safety. | `seriesColors` array — area's bottom series is the one most affected by SPL `\| eval` reordering. |
| **Sort series:** `\| sort` to put largest series at the bottom of the stack. | Random order — small series at the bottom flatlines visually. |
| **Nulls:** `nullValueDisplay: "gaps"` (default) or `"connect"`. | `nullValueDisplay: "zero"` — with stacking, this changes totals. |
| **Stream graph look:** `showLines: false`. | Mix `showLines: false` with thin stacks — no edge to delineate adjacent series. |
| **Time axis:** `xAxisTitleVisibility: "hide"`. | Set `xAxisTitleText: "Time"` — pure noise. |
| **Drilldown:** `eventHandlers.setToken` reads `row.<field>.value`. | Read `$click.value2$` (scatter/bubble territory). |

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: stacked, stacked100,
  stream graph, allow/block, dual axis (rare), sparkline.
- [OPTIONS.md](OPTIONS.md) — area-specific + shared options.
- [GOTCHAS.md](GOTCHAS.md) — area-specific traps.
- `ds-viz-line` — unstacked time series + the place where shared
  options (axes, splits, dual axis) are documented in detail.
- `ds-viz-column` — stacked categorical.
- `ds-ref-design-principles` — colour discipline.
