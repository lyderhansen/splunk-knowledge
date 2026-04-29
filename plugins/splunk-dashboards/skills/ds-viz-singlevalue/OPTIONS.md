# splunk.singlevalue — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf`,
*Single value options* (line ~11206). 22 documented options total.

## Major value (the headline number)


| Option               | Type                   | Default                           | Notes                                                                 |
| -------------------- | ---------------------- | --------------------------------- | --------------------------------------------------------------------- |
| `majorValue`         | string | number (DOS)  | `> sparklineValues | lastPoint()` | The headline number. Reads last point of sparkline series by default. |
| `majorValueField`    | string                 | `> majorValue | getField()`       | Column name when `majorValue` not supplied directly.                  |
| `majorColor`         | string (hex | DOS)     | theme default                     | Drive dynamically with `rangeValue` for thresholded colouring.        |
| `majorFontSize`      | number (px)            | dynamic (fits panel)              | Override auto-sized headline font.                                    |
| `numberPrecision`    | number                 | `0`                               | Decimal places (max 20).                                              |
| `unit`               | string                 | —                                 | `%`, `$`, `ms`, `/100`, `req/s`.                                      |
| `unitPosition`       | `"before"` | `"after"` | `"after"`                         | `"before"` for currency, `"after"` for percentages and SI units.      |
| `underLabel`         | string                 | —                                 | Caption below headline. **Almost always set this.**                   |
| `underLabelFontSize` | number (px)            | `12`                              | —                                                                     |


## Trend (delta indicator)


| Option                       | Type                                 | Default       | Notes                                                                                 |
| ---------------------------- | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------- |
| `trendValue`                 | number (DOS)                         | `delta(-2)`   | Current vs second-to-last point. Override for week-over-week, etc.                    |
| `trendDisplay`               | `"absolute"` | `"percent"` | `"off"` | `"absolute"`  | `"percent"` for ratios. `"off"` for static KPIs.                                      |
| `trendColor`                 | string (hex | DOS)                   | theme default | Splunk does NOT auto-flip on positive vs negative — use DOS expression for red/green. |
| `trendFontSize`              | number (px)                          | dynamic       | —                                                                                     |
| `shouldAbbreviateTrendValue` | boolean                              | `false`       | `true` → `+1.2K`, `-3.4M`. Use whenever headline is also abbreviated.                 |


## Sparkline (inline trend chart)


| Option                          | Type                                         | Default                         | Notes                                                                                |
| ------------------------------- | -------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| `sparklineValues`               | string | number (DOS)                        | first numeric column            | Series powering the sparkline.                                                       |
| `sparklineDisplay`              | `"before"` | `"after"` | `"below"` | `"off"` | `"below"`                       | Position. `"off"` removes entirely.                                                  |
| `sparklineStrokeColor`          | string (hex | DOS)                           | theme default                   | Drive dynamically with `rangeValue`.                                                 |
| `sparklineAreaColor`            | string (hex | DOS)                           | inherits `sparklineStrokeColor` | Fill colour when `showSparklineAreaGraph: true`. **Always rendered at 20% opacity.** |
| `showSparklineAreaGraph`        | boolean                                      | `false`                         | `true` fills the sparkline.                                                          |
| `showSparklineTooltip`          | boolean                                      | `false`                         | Hover tooltips on sparkline points.                                                  |
| `sparklineHighlightDots`        | number                                       | `0`                             | Last *N* points as filled markers.                                                   |
| `sparklineHighlightSegments`    | number                                       | `0`                             | Last *N* segments emphasised. Combine with `Dots` for fade-to-now.                   |
| `shouldSparklineAcceptNullData` | boolean                                      | `true`                          | `false` keeps nulls as gaps instead of converting to 0.                              |


## Chrome (panel formatting)


| Option                        | Type               | Default                           | Notes                                                  |
| ----------------------------- | ------------------ | --------------------------------- | ------------------------------------------------------ |
| `backgroundColor`             | string (hex | DOS) | `> themes.defaultBackgroundColor` | Drive dynamically for "whole-tile flips red" patterns. |
| `shouldUseThousandSeparators` | boolean            | `true`                            | `false` strips commas. Use for IDs / version numbers.  |


## What singlevalue does NOT have

- **No `legendDisplay*`* — there is no legend.
- **No axes** — `xAxis*` / `yAxis*` are silently ignored.
- **No `dataValuesDisplay`** — the headline IS the value display.
- **No `icon`** — that's `splunk.singlevalueicon`.
- **No `radialBackgroundColor` / `maxValue`** — those are
`splunk.singlevalueradial`.

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Grep for `^Single value options` (line ~11206).