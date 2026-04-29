# splunk.scatter — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`.

## DOS bindings


| Option          | Type       | Default                        | Notes                          |
| --------------- | ---------- | ------------------------------ | ------------------------------ |
| `x`             | DOS string | `> primary | seriesByIndex(0)` | Numeric x-axis values.         |
| `y`             | DOS string | `> primary | seriesByIndex(1)` | Numeric y-axis values.         |
| `category`      | DOS string | `> primary | seriesByIndex(2)` | Optional — splits into series. |
| `xField`        | string     | `> x | getField()`             | Field label for x.             |
| `yField`        | string     | `> y | getField()`             | Field label for y.             |
| `categoryField` | string     | `> category | getField()`      | Field label for category.      |


## Markers


| Option        | Default | Notes                                               |
| ------------- | ------- | --------------------------------------------------- |
| `markerSize`  | `4`     | Increase for low point counts; `6`–`10` reads well. |
| `resultLimit` | `50000` | Hard cap.                                           |


## Colour


| Option                | Default                | Notes                                                            |
| --------------------- | ---------------------- | ---------------------------------------------------------------- |
| `seriesColors`        | Splunk default palette | Maps to series in **alphabetical** category order.               |
| `seriesColorsByField` | n/a                    | `{ "value": "#hex" }` — locks colour to specific category value. |
| `backgroundColor`     | theme default          | Panel background.                                                |


## Legend


| Option             | Default         | Values                                                                     |
| ------------------ | --------------- | -------------------------------------------------------------------------- |
| `legendDisplay`    | `"right"`       | `"right"` | `"left"` | `"top"` | `"bottom"` | `"off"`                      |
| `legendTruncation` | `"ellipsisEnd"` | `"ellipsisEnd"` | `"ellipsisMiddle"` | `"ellipsisStart"` | `"ellipsisOff"` |


## Axes (mirrored x and y)


| Option                                              | Default    | Notes                                      |
| --------------------------------------------------- | ---------- | ------------------------------------------ |
| `xAxisMin` / `yAxisMin`                             | `"auto"`   | Lock floor.                                |
| `xAxisMax` / `yAxisMax`                             | `"auto"`   | Lock ceiling.                              |
| `xAxisScale` / `yAxisScale`                         | `"linear"` | `"log"` for orders of magnitude.           |
| `xAxisAbbreviation`                                 | `"off"`    | `"auto"` enables `1.2k` / `3M`.            |
| `yAxisAbbreviation`                                 | `"auto"`   | —                                          |
| `showXAxisExtendedRange` / `showYAxisExtendedRange` | `true`     | Breathing room beyond min/max.             |
| `showXAxisWithZero` / `showYAxisWithZero`           | `false`    | Force include zero.                        |
| `showRoundedXAxisLabels`                            | `false`    | Round x-axis tick labels.                  |
| `showYMajorGridLines`                               | `true`     | —                                          |
| `showXMinorGridLines` / `showYMinorGridLines`       | `false`    | Set `true` only on log scales when needed. |
| `xAxisLabelRotation`                                | `0`        | `-90 | -45 | 0 | 45 | 90` (only).          |
| `xAxisLabelVisibility` / `yAxisLabelVisibility`     | `"auto"`   | `"auto"` | `"show"` | `"hide"`.            |
| `xAxisLineVisibility` / `yAxisLineVisibility`       | `"hide"`   | `"show"` | `"hide"` (axis line itself).    |
| `xAxisMajorTickInterval` / `yAxisMajorTickInterval` | `"auto"`   | —                                          |
| Tick sizes (`Major` / `Minor` × `x` / `y`)          | `6`        | —                                          |
| Tick visibilities                                   | `"auto"`   | `"auto"` | `"show"` | `"hide"`.            |
| `xAxisTitleText` / `yAxisTitleText`                 | —          | —                                          |
| `xAxisTitleVisibility` / `yAxisTitleVisibility`     | `"show"`   | `"show"` | `"hide"`.                       |


## What scatter does NOT have

- No annotations.
- No stacking.
- No dual axis.
- No marker size encoding (use `splunk.bubble`).

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Scatter options table.