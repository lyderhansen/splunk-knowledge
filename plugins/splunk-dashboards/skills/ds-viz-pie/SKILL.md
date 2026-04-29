---
name: ds-viz-pie
description: Splunk Dashboard Studio splunk.pie visualization — pie and donut charts for part-of-whole breakdowns with a small number of slices. Provides patterns for executive summaries, allow/block donuts, collapseThreshold for long-tail rollup, and chrome-stripped donuts paired with single-value KPI overlays. Use when the user asks about pie charts, donuts, share of total, slice colours, or breakdown by category in Splunk Dashboard Studio.
---

# splunk.pie — pie and donut

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_pie_dark` / `ds_viz_pie_light`.

`splunk.pie` is the dedicated chart for **part-of-whole** with a small
number of categories. The same visualization renders both pies and
donuts — toggle with `showDonutHole`.

## When to use

- The message is *share of total* and there are at most 3–5 meaningful
  categories.
- Donut variant (`showDonutHole: true`) for KPI-style breakdown panels
  — the eye reads arc length more accurately than slice area.
- `collapseThreshold` to bucket the long tail into a single `Other`
  slice — converts a 12-slice pie into a 4-slice pie without losing
  the total.

## When NOT to use

- **Trend over time** → `splunk.area` / `splunk.column` with
  `stackMode: "stacked100"`.
- **Ranking** — humans read **bars** much faster than pie slices.
  Reach for `splunk.bar` with a top-N sort.
- **>7 raw slices** — by then nothing is readable. Either
  `collapseThreshold` it down or switch chart family.

See `ds-pick-viz` for the full decision matrix.

## Quick start

```json
{
  "type": "splunk.pie",
  "title": "Revenue by region",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "showDonutHole": true,
    "collapseThreshold": 0.05,
    "collapseLabel": "Other",
    "labelDisplay": "valuesAndPercentage"
  }
}
```

```spl
| stats sum(revenue) as revenue by region | sort - revenue
```

Pie has **no built-in sort** — slice order = SPL output order. Always
`| sort - <value>`.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Sort SPL:** `\| sort - <value>` so largest slice is first. | Trust Splunk to sort — pie has no `sort` option. |
| **Executive default:** `labelDisplay: "valuesAndPercentage"` + donut + `collapseThreshold: 0.05`. | `labelDisplay: "values"` (counts only) for executive views — percentages are usually what executives want. |
| **Colours:** `seriesColorsByField` keyed by exact label (case-sensitive). | `seriesColors` array — survives SPL filter changes badly. |
| **Long tail:** `collapseThreshold: 0.05` (5%) folds <5% slices into `Other`. | `collapseThreshold: 5` — it's a fraction (0–1), not a percent. `5` collapses every slice. |
| **Two-slice donut:** `showDonutHole: true` with two semantic colours (allow=green, block=red). | Use a 2-slice pie for a binary metric — the donut hole gives the eye an anchor. |
| **Tiny panel + donut:** `labelDisplay: "off"` to defer to the legend. | Force on-slice labels in a panel <280 px wide — labels overlap. |
| **Background:** `backgroundColor: "transparent"` for KPI overlay (donut + singlevalue stacked). | Set `defaults.visualizations.global.backgroundColor` and expect pie to inherit — pie doesn't. |

## What pie does NOT have

(Don't invent options that aren't in the 10.4 PDF table.)

- **No axes**, ticks, grid lines, log scale, or `yAxis*` of any kind.
- **No `legendDisplay`** — the legend renders automatically and cannot
  be moved or hidden through dashboard options.
- **No annotations**, overlays, dual-axis, or stacking.
- **No `dataValuesDisplay`** — on-slice display is controlled by
  `labelDisplay`.

If you reach for any of those, you're in the wrong viz family — see
`ds-pick-viz`.

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: minimal,
  valuesAndPercentage, donut, semantic colours, collapseThreshold,
  two-slice, single-hue emphasis, chrome-stripped overlay, aggressive
  long-tail rollup.
- [OPTIONS.md](OPTIONS.md) — every documented pie option (the full list
  is short).
- [GOTCHAS.md](GOTCHAS.md) — sort, fraction-vs-percent, label
  case-sensitivity, panel-size traps.
- `ds-viz-bar` — better for ranking and >5 categories.
- `ds-viz-singlevalue` — pair with chrome-stripped donut for the "big
  number with breakdown ring" KPI pattern.
- `ds-ref-design-principles` — colour discipline, why bars beat pies most
  of the time.
