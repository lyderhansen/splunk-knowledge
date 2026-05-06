# splunk.area — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Area chart options* (line ~5293).

## Time-axis convention

Same as `splunk.line`:

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide"
}
```

## Area-specific options

| Option | Values | Default | Notes |
|---|---|---|---|
| `stackMode` | `"auto"` \| `"stacked"` \| `"stacked100"` | `"auto"` | `auto` = no stacking (overlap with `areaOpacity` blending). `stacked` = cumulative. `stacked100` = each x-bucket sums to 100%. |
| `areaOpacity` | number 0–1 | `0.75` | Drop to `0.4`–`0.5` for unstacked overlap; raise to `0.9`+ for stacked. |
| `showLines` | boolean | `true` | Line on top of each filled region. `false` for stream graph look. |
| `nullValueDisplay` | `"gaps"` \| `"zero"` \| `"connect"` | `"gaps"` | `"connect"` bridges sampling gaps. **`"zero"` lies and changes stacked totals.** |

## Shared with `splunk.line`

For full detail on these, see `ds-viz-line` OPTIONS.md.

| Option | Notes |
|---|---|
| `seriesColors` | Positional array. Brittle. |
| `seriesColorsByField` | `{ "field": "#hex" }`. Refactor-safe. |
| `legendDisplay` | 5-position legend. |
| `legendMode` / `legendLabels` / `legendTruncation` | Same as line. |
| `dataValuesDisplay` | `"off"` \| `"all"` \| `"minmax"`. |
| `markerDisplay` | `"off"` \| `"filled"` \| `"outlined"`. |
| `lineWidth` | px. |
| `lineDashStyle` / `lineDashStylesByField` | Same 11 values as line. |
| `overlayFields` / `showOverlayY2Axis` / `y2AxisTitleText` | Dual-axis pattern (rare for area; the second filled region overlaps badly). |
| `annotationX` / `annotationLabel` / `annotationColor` | Secondary `dataSources.annotation` keyed `_time, annotationLabel, annotationColor`. |
| `showSplitSeries` / `showIndependentYRanges` | Small multiples per series. |
| `yAxisScale` (`"linear"` \| `"log"`) | Log rejects ≤ 0; pair `yAxisMin: "1"`. |
| `yAxisMin` / `yAxisMax` | String. Pin range across panels. |
| `yAxisAbbreviation` | `"on"` \| `"off"`. |
| `yAxisMajorTickInterval` | Number. |
| `showYAxisExtendedRange` / `showYAxisWithZero` | Booleans. |
| `xAxisLineVisibility` / `yAxisLineVisibility` | `"show"` \| `"hide"`. |
| `xAxisMaxLabelParts` | 1–3. |
| `showYMinorGridLines` | Set `false` on log axes. |
| `showXMajorGridLines` / `showYMajorGridLines` | Booleans. |
| `backgroundColor` | Hex or `"transparent"`. |
| `resultLimit` | `50000` cap. |

## Trellis (10.0.2503+, untested)

Same caveat as line/column — changelog enables it, 10.4 *Trellis layout*
contradicts. Until verified, prefer `showSplitSeries: true`.

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Grep for `^Area chart
options` (line ~5293).
