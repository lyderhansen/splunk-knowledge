# splunk.line — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Line chart options* (line ~4962).

## Time-axis convention

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide"
}
```

Override only for sparkline (hide everything) or non-time x-axis
(rare).

## Line-specific options

| Option | Values | Default | Notes |
|---|---|---|---|
| `lineWidth` | number (px) | `2` | `2.5–3` reads better on dark; ≤ `2` for light. |
| `lineDashStyle` | 11 values (see PATTERNS.md pattern 11) | `"solid"` | Most useful: `solid`, `dash`, `dot`, `dashDot`. |
| `lineDashStylesByField` | `{ field: dashStyle }` | — | Per-field map. **Preferred over `lineDashStyle`.** |
| `markerDisplay` | `"off"` \| `"filled"` \| `"outlined"` | `"off"` | Dot at every value. Use sparingly. |
| `nullValueDisplay` | `"gaps"` \| `"zero"` \| `"connect"` | `"gaps"` | `"connect"` bridges nulls (best for sampling gaps). `"zero"` lies. |
| `dataValuesDisplay` | `"off"` \| `"all"` \| `"minmax"` | `"off"` | `"minmax"` is the only readable option for ≥ 10 data points. |
| `legendMode` | `"standard"` \| `"seriesCompare"` | `"standard"` | `seriesCompare` highlights all series on hover — useful with 4+ series. |
| `resultLimit` | number | `50000` | Hard cap. Aggregate upstream if exceeded. |

## Axis tuning

| Option | Values | Default | Notes |
|---|---|---|---|
| `yAxisScale` / `y2AxisScale` | `"linear"` \| `"log"` | `"linear"` | Log rejects ≤ 0; pair with `yAxisMin: "1"`. |
| `yAxisMin` / `yAxisMax` (and `y2*`) | string \| number | `"auto"` | Force a fixed range when comparing across panels. |
| `yAxisAbbreviation` / `y2AxisAbbreviation` | `"off"` \| `"auto"` | `"auto"` | SI prefixes (`1.2k`, `5M`). |
| `yAxisMajorTickInterval` / `y2*` | `"auto"` \| number | `"auto"` | Force whole-number gridlines. |
| `xAxisMaxLabelParts` | number 1–3 | `3` | Max time parts per label. Drop to `2` on dense charts. |
| `showYAxisExtendedRange` | boolean | `true` | Extend to next tick. |
| `showYAxisWithZero` | boolean | `false` | Force `0` into y-range. **Always `true` for delta/error charts.** |
| `xAxisLineVisibility` / `yAxisLineVisibility` / `y2*` | `"show"` \| `"hide"` | `"hide"` | Default-hidden axis line. |
| `showYMinorGridLines` | boolean | `true` | **Set `false` on log axes** (decade noise). |

## Colour and series binding

| Option | Notes |
|---|---|
| `seriesColors` | Positional array. Brittle. |
| `seriesColorsByField` | `{ "allowed": "#33FF99" }`. **Preferred** — semantic, refactor-safe. |

## Dual y-axis

| Option | Notes |
|---|---|
| `overlayFields` | Field name(s) to overlay. String or array. |
| `showOverlayY2Axis` | `true` to render right y-axis with own scale. |
| `y2AxisTitleText` | Right-axis title. Always set when `showOverlayY2Axis: true`. |

## Annotations

Requires `dataSources.annotation` keyed `_time, annotationLabel,
annotationColor`.

| Option | Expression |
|---|---|
| `annotationX` | `"> annotation \| seriesByName('_time')"` |
| `annotationLabel` | `"> annotation \| seriesByName('annotationLabel')"` |
| `annotationColor` | `"> annotation \| seriesByName('annotationColor')"` |

## Split sub-charts

| Option | Notes |
|---|---|
| `showSplitSeries` | `true` stacks each series in its own panel-within-panel. |
| `showIndependentYRanges` | `true` gives each split its own y-range. **Almost always desired.** |

## Trellis (10.0.2503+, untested)

10.0.2503 changelog enables trellis for line; 10.4 *Trellis layout*
contradicts. Until verified, prefer `showSplitSeries: true`.

| Option | Default | Notes |
|---|---|---|
| `splitByLayout` | `"off"` | `"trellis"` to enable. |
| `trellisSplitBy` | — | Field to split on. |
| `trellisColumns` | `auto` | Columns per row. |
| `trellisMinColumnWidth` | `100` | Min sub-chart width. |
| `trellisRowHeight` | `70` | **Increase for line** — single-value sized by default. |
| `trellisPageCount` | `20` | Sub-charts per page. |
| `trellisBackgroundColor` | theme | Background of trellis container. |

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Grep extracted `.txt` for
`^Line chart options` (line ~4962).
