# splunk.singlevalueradial — full options reference

Cross-checked against the 10.4 PDF, *Single value radial options*
(line ~11463). 16 documented options.

## Major value (the headline number)

| Option | Type | Default | Notes |
|---|---|---|---|
| `majorValue` | string \| number (DOS) | `> sparklineValues \| lastPoint()` | The headline number. |
| `majorValueField` | string | `> majorValue \| getField()` | Column name when `majorValue` not supplied directly. |
| `majorColor` | string (hex \| DOS) | theme primary text | Number colour. Use DOS for thresholds. |
| `majorFontSize` | number (px) | dynamic | Lock for tile consistency. |
| `numberPrecision` | number | `0` | Decimal places. |
| `unit` | string | — | `%`, `$`, `ms`, `/100`. |
| `unitPosition` | `"before"` \| `"after"` | `"after"` | Side of number. |
| `underLabel` | string | — | Caption below headline. **Almost always set this.** |

## Radial-specific

| Option | Type | Default | Notes |
|---|---|---|---|
| `maxValue` | number | `100` | The fill ceiling. Set explicitly when ceiling isn't 100 (orders, GB, ticket count). |
| `value` | string \| number (DOS) | `> majorValue` | Source value for the arc fill (separate from `majorValue` for advanced cases). |
| `radialStrokeColor` | string (hex \| DOS) | theme primary | The arc fill colour. Drive dynamically with `rangeValue` for traffic-light arcs. |
| `radialBackgroundColor` | string (hex \| DOS) | theme low-alpha | The unfilled track behind the arc. |

## Trend

| Option | Type | Default | Notes |
|---|---|---|---|
| `trendValue` | number (DOS) | `delta(-2)` | Delta vs second-to-last point. |
| `trendDisplay` | `"absolute"` \| `"percent"` \| `"off"` | `"absolute"` | `"off"` for static KPIs. |
| `trendColor` | string (hex \| DOS) | theme | Splunk does NOT auto-flip on +/-. |
| `shouldAbbreviateTrendValue` | boolean | `false` | `true` → `+1.2K`, `-3.4M`. |

## Chrome

| Option | Type | Default | Notes |
|---|---|---|---|
| `backgroundColor` | string (hex \| DOS \| `"transparent"`) | theme | Tile background. Drive dynamically for "whole-tile flips" patterns. |
| `shouldUseThousandSeparators` | boolean | `true` | `false` strips commas. |

## What singlevalueradial does NOT have

- **No `sparkline*` options** — silently ignored. Use
  `splunk.singlevalue` if you need sparklines.
- **No `icon`** — that's `splunk.singlevalueicon`.
- **No `gaugeRanges`** — that's `splunk.markergauge`.
- **No legend, axes, `dataValuesDisplay`.**

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Single value radial
options (line ~11463).
