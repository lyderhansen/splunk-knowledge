# splunk.pie — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Pie chart options* (line ~9117). The full list is short — the entire
table is reproduced here.

| Option | Type | Default | What it does |
|---|---|---|---|
| `label` | string \| string[] | `> primary \| seriesByIndex(0)` | DOS expression supplying slice labels. Default reads column 0. |
| `labelField` | string | `> label \| getField()` | Column name used for slice labels when not using `label` directly. |
| `value` | number[] | `> primary \| seriesByIndex(1)` | DOS expression supplying slice numeric values. Default reads column 1. |
| `valueField` | string | `> value \| getField()` | Column name used for slice values. |
| `labelDisplay` | `"values"` \| `"valuesAndPercentage"` \| `"off"` | `"values"` | Controls on-slice label. `"off"` keeps only the legend. |
| `showDonutHole` | boolean | `false` | `true` cuts a centre hole — turns chart into a donut. |
| `collapseLabel` | string | `"other"` | Label for the bucket slice produced by `collapseThreshold`. |
| `collapseThreshold` | number 0–1 | `0.01` | Slices strictly below this share of total fold into a single `collapseLabel` slice. **Fraction, not percent.** |
| `seriesColors` | string[] | Splunk default palette | Ordered slice colours. Index `i` paints slice `i`. |
| `seriesColorsByField` | object `{ label: hex }` | n/a | Pin colour to slice **label** instead of position. **Recommended.** Case-sensitive. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | Panel background. Use `"transparent"` for KPI overlay. |
| `resultLimit` | number | `50000` | Max rows pulled from primary search before slicing. |

## What pie does NOT have

- **No axes**, ticks, gridlines, log scale, `yAxis*` of any kind.
- **No `legendDisplay`** — legend renders automatically; cannot be
  moved or hidden via options.
- **No annotations**, overlays, dual-axis, stacking.
- **No `dataValuesDisplay`** — on-slice display is `labelDisplay`.
- **No `sort`** — slice order = SPL output order.
- **No trellis** — pie is not in the trellis-eligible list.

If you reach for any of those, you're in the wrong viz family.

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Grep for `^Pie chart
options` (line ~9117).
