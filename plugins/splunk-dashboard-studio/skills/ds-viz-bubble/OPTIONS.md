# splunk.bubble — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`.

## DOS bindings

| Option | Type | Default | Notes |
|---|---|---|---|
| `x` | string \| number | `> primary \| seriesByIndex(0)` | Numeric x-axis values. |
| `y` | string \| number | `> primary \| seriesByIndex(1)` | Numeric y-axis values. |
| `size` | number | `> primary \| seriesByIndex(2)` | Marker size encoding. |
| `category` | string \| number | n/a | Optional — splits points into coloured series. |
| `xField` | string | `> x \| getField()` | Field label for x; auto from binding. |
| `yField` | string | `> y \| getField()` | Field label for y. |
| `sizeField` | string | `> size \| getField()` | Field label for size. |
| `categoryField` | string | `> category \| getField()` | Field label for category. |

## Bubble sizing

| Option | Type | Default | Notes |
|---|---|---|---|
| `bubbleSizeMin` | number (px) | `10` | Smallest rendered marker. |
| `bubbleSizeMax` | number (px) | `50` | Largest rendered marker. |
| `bubbleSizeMethod` | `"area"` \| `"diameter"` | `"area"` | `area` is perceptually correct; `diameter` exaggerates. |
| `resultLimit` | number | `50000` | Hard cap. |

## Colour

| Option | Type | Default | Notes |
|---|---|---|---|
| `seriesColors` | string[] | Splunk default palette | Maps to series in **alphabetical** category order. |
| `seriesColorsByField` | object | n/a | `{ "value": "#hex" }` — locks colour to specific category value. |
| `backgroundColor` | string | theme default | Panel background. |

## Legend

| Option | Default | Values |
|---|---|---|
| `legendDisplay` | `"right"` | `"right"` \| `"left"` \| `"top"` \| `"bottom"` \| `"off"` |
| `legendTruncation` | `"ellipsisEnd"` | `"ellipsisEnd"` \| `"ellipsisMiddle"` \| `"ellipsisStart"` \| `"ellipsisOff"` |

## Axes (mirrored x / y)

Same surface as `splunk.scatter`.

| Option | Default | Notes |
|---|---|---|
| `xAxisMin` / `yAxisMin` | `"auto"` | Lock floor. |
| `xAxisMax` / `yAxisMax` | `"auto"` | Lock ceiling. |
| `xAxisScale` / `yAxisScale` | `"linear"` | `"log"` for orders of magnitude. |
| `xAxisAbbreviation` / `yAxisAbbreviation` | x: `"off"`, y: `"auto"` | `"auto"` enables `1.2k` / `3M`. |
| `showXAxisExtendedRange` / `showYAxisExtendedRange` | `true` | Breathing room beyond min/max. |
| `showXAxisWithZero` / `showYAxisWithZero` | `false` | Force include zero. |
| `showRoundedXAxisLabels` | `false` | — |
| `showYMajorGridLines` | `true` | — |
| `showXMinorGridLines` / `showYMinorGridLines` | `false` | Set `true` only on log scales when needed. |
| `xAxisLabelRotation` | `0` | `-90 \| -45 \| 0 \| 45 \| 90` (only). |
| `xAxisLabelVisibility` / `yAxisLabelVisibility` | `"auto"` | `"auto"` \| `"show"` \| `"hide"`. |
| `xAxisLineVisibility` / `yAxisLineVisibility` | `"hide"` | `"show"` \| `"hide"`. |
| `xAxisMajorTickInterval` / `yAxisMajorTickInterval` | `"auto"` | — |
| `xAxisMajorTickSize` / `yAxisMajorTickSize` | `6` | — |
| `xAxisMinorTickSize` / `yAxisMinorTickSize` | `6` | — |
| `xAxisMajorTickVisibility` / `yAxisMajorTickVisibility` | `"auto"` | — |
| `xAxisMinorTickVisibility` / `yAxisMinorTickVisibility` | `"auto"` | — |
| `xAxisTitleText` / `yAxisTitleText` | — | Title under x or beside y. |
| `xAxisTitleVisibility` / `yAxisTitleVisibility` | `"show"` | — |

## What bubble does NOT have

- **No annotation overlay.** Unlike line/area/column, bubble has no
  annotation support. Place context off-panel.
- **No stacking.**
- **No dual axis** — only one x and one y.

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Bubble options table.
