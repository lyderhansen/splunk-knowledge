---
name: ds-viz-singlevalue
description: Reference skill for the `splunk.singlevalue` visualization in Dashboard Studio (v2). The default KPI tile - one big number, optional under-label, optional trend, optional sparkline. Triggers on 'splunk.singlevalue', 'KPI tile', 'big number', 'sparkline', 'majorValue', 'underLabel', 'trendDisplay'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-singlevalue — `splunk.singlevalue`

`splunk.singlevalue` is the default KPI tile: one big number with optional unit, under-label, trend delta, and inline sparkline. The single most-used visualization in any operational, executive, or SOC dashboard.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — the
>    *Single value options* section (line ~11206) is the verbatim option list,
>    types, and defaults.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every pattern
>    below was rendered and visually QA'd on Splunk Enterprise 10.2.1. Both
>    files are deployed to the `splunk-knowledge-testing` app as
>    `ds_viz_singlevalue_dark` and `ds_viz_singlevalue_light`.

---

## When to use

- **Use** when the message is *one number* (revenue, latency, error count, conversion %).
- **Use** the sparkline (`sparklineDisplay: "below"` is the default) when the headline is the value but the recent trend matters.
- **Use** dynamic colour (`majorColor` via `rangeValue`) for thresholded health metrics — green/amber/red is the universal SOC/ops vocabulary.
- **Don't use** for a categorical breakdown → that is `splunk.pie` (donut) or `splunk.bar`.
- **Don't use** for a number against a target/range → reach for `splunk.markergauge` (point-on-axis) or `splunk.fillergauge` (filled bar) instead.
- **Don't use** for a percentage of a known whole → `splunk.singlevalueradial` reads better as a filled ring.
- **Don't use** to display an icon next to the number → that is `splunk.singlevalueicon`.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

`splunk.singlevalue` is happy with **either** of these:

1. **One row, one column** — pure KPI. `majorValue` defaults to the first numeric cell.
2. **Time series** (`_time` + numeric column) — `majorValue` becomes `lastPoint()`, `trendValue` becomes `delta(-2)` (last vs. second-to-last point), and `sparklineValues` is the whole series. This is the most common shape.

```spl
| stats sum(revenue) as revenue
| timechart span=1h sum(revenue) as revenue
| makeresults | eval orders = 1247 | table orders
```

For dynamic colour via `rangeValue`, the value must reduce to a single number — same shape as above, with the DOS expression resolving the value.

---

## Option list (10.4 reference)

The 10.4 *Single value options* table lists exactly these 22 properties, grouped here by purpose. Anything not in this table does not apply to `splunk.singlevalue`.

### Major value (the headline number)

| Option            | Type                        | Default                                  | What it does                                                                                                  |
| ----------------- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `majorValue`      | `string` / `number` (DOS)   | `> sparklineValues \| lastPoint()`       | The headline number. Reads the last point of the sparkline series by default.                                 |
| `majorValueField` | `string`                    | `> majorValue \| getField()`             | Column name used for the major value when `majorValue` is not supplied directly.                              |
| `majorColor`      | `string` (hex / DOS)        | theme default font colour                | Colour of the headline number. Drive dynamically with `rangeValue` for thresholded colouring.                 |
| `majorFontSize`   | `number` (px)               | dynamic (fits panel)                     | Override the auto-sized headline font. Use for compact KPI strips with predictable spacing.                   |
| `numberPrecision` | `number`                    | `0`                                      | Decimal places (max 20). `2` → `1.23`, `4` → `1.2345`.                                                        |
| `unit`            | `string`                    | N/A                                      | Text shown next to the headline (`%`, `$`, `ms`, `/100`, `req/s`).                                            |
| `unitPosition`    | `"before"` / `"after"`      | `"after"`                                | `"before"` for currency (`$1,200`), `"after"` for percentages and SI units (`98.7%`, `45ms`).                 |
| `underLabel`      | `string`                    | N/A                                      | Caption below the headline. Almost always set this — without it the panel title is the only context.         |
| `underLabelFontSize` | `number` (px)            | `12`                                     | Override the under-label font size.                                                                           |

### Trend (delta indicator)

| Option                        | Type                                 | Default       | What it does                                                                                                              |
| ----------------------------- | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `trendValue`                  | `number` (DOS)                       | `delta(-2)`   | The delta to show. Default = current vs. second-to-last point. Override for week-over-week, month-over-month, etc.        |
| `trendDisplay`                | `"absolute"` / `"percent"` / `"off"` | `"absolute"`  | `"percent"` for ratios and rates. `"off"` for static KPIs that have no time dimension.                                    |
| `trendColor`                  | `string` (hex / DOS)                 | theme default | Colour of the delta. Splunk does NOT auto-flip on positive vs. negative — use a DOS expression if you want red/green.     |
| `trendFontSize`               | `number` (px)                        | dynamic       | Override the auto-sized trend font.                                                                                       |
| `shouldAbbreviateTrendValue`  | `boolean`                            | `false`       | `true` rounds the trend to 2 decimals + magnitude unit (`+1.2K`, `-3.4M`). Use whenever the headline is also abbreviated. |

### Sparkline (inline trend chart)

| Option                          | Type                                           | Default                       | What it does                                                                              |
| ------------------------------- | ---------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `sparklineValues`               | `string` / `number` (DOS)                      | first numeric column          | Series powering the sparkline.                                                            |
| `sparklineDisplay`              | `"before"` / `"after"` / `"below"` / `"off"`   | `"below"`                     | Position. `"off"` removes the sparkline entirely.                                         |
| `sparklineStrokeColor`          | `string` (hex / DOS)                           | theme default                 | Line colour. Drive dynamically with `rangeValue` for thresholded sparklines.              |
| `sparklineAreaColor`            | `string` (hex / DOS)                           | inherits `sparklineStrokeColor` | Fill colour when `showSparklineAreaGraph: true`. Always rendered at 20% opacity.          |
| `showSparklineAreaGraph`        | `boolean`                                      | `false`                       | `true` fills the sparkline. Reads as more present than a pure line.                       |
| `showSparklineTooltip`          | `boolean`                                      | `false`                       | `true` exposes hover tooltips on the sparkline points.                                    |
| `sparklineHighlightDots`        | `number`                                       | `0`                           | Paints the last *N* sparkline points as filled markers. Use to draw the eye to "now".     |
| `sparklineHighlightSegments`    | `number`                                       | `0`                           | Emphasises the last *N* sparkline segments (lines). Combine with `Dots` for "fade-to-now".|
| `shouldSparklineAcceptNullData` | `boolean`                                      | `true`                        | `false` keeps null/non-numeric points as gaps instead of converting to 0.                  |

### Chrome (panel formatting)

| Option                         | Type                       | Default                            | What it does                                                                            |
| ------------------------------ | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| `backgroundColor`              | `string` (hex / DOS)       | `> themes.defaultBackgroundColor`  | Tile background. Drive dynamically for "whole-tile flips red" patterns. Use sparingly.  |
| `shouldUseThousandSeparators`  | `boolean`                  | `true`                             | `false` strips commas. Use for IDs, version numbers — anything that is not a quantity.  |

**Things `splunk.singlevalue` does NOT have** (do not invent options that are not in the 10.4 table):

- No `legendDisplay` — there is no legend; the under-label and trend value are the only labelled chrome.
- No axes of any kind (`xAxis*` / `yAxis*` are silently ignored).
- No `dataValuesDisplay` — the headline IS the value display.
- No `icon` — that is `splunk.singlevalueicon`.
- No `radialBackgroundColor` / `maxValue` — those are `splunk.singlevalueradial`.

---

## Verified patterns

Each pattern was rendered as a panel in the test bench and visually QA'd. The numbers refer to the matching panel in `ds_viz_singlevalue_dark` / `ds_viz_singlevalue_light`.

### 1. Minimal — all defaults

```json
{
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_revenue_trend" },
  "options": {}
}
```

`majorValue` defaults to `lastPoint()` of the first numeric series; `trendValue` to `delta(-2)`; sparkline below; absolute trend. Useful as a sanity check for new dashboards — if this renders, your data shape is correct.

### 2. `unit` + `unitPosition: "after"` + `underLabel` — the percentage default

```json
{
  "options": {
    "unit": "%",
    "unitPosition": "after",
    "underLabel": "Conversion rate",
    "numberPrecision": 2,
    "trendDisplay": "percent"
  }
}
```

The default for any rate or ratio metric. `numberPrecision: 2` keeps the headline at 2 decimal places (`2.34`, not `2`). `trendDisplay: "percent"` shows the delta as a percentage of the previous value.

### 3. `unitPosition: "before"` + thousand separators + abbreviated trend — the currency default

```json
{
  "options": {
    "unit": "$",
    "unitPosition": "before",
    "underLabel": "Monthly recurring revenue",
    "shouldUseThousandSeparators": true,
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent"
  }
}
```

The default for any currency or large-magnitude metric. `shouldAbbreviateTrendValue` keeps the trend tile compact (`+1.2K`, `+450K`). Pair with `shouldUseThousandSeparators: true` (default) so the headline reads `$1,245,000` instead of `$1245000`.

### 4. Static KPI — `trendDisplay: "off"` + `sparklineDisplay: "off"`

```json
{
  "options": {
    "underLabel": "Orders today",
    "trendDisplay": "off",
    "sparklineDisplay": "off"
  }
}
```

Single-row data source with no time dimension. Disable both `trendDisplay` and `sparklineDisplay` so the panel doesn't try to render a delta or chart from a single point.

### 5. Dynamic `majorColor` via `rangeValue` — thresholded health

```json
{
  "options": {
    "underLabel": "System health",
    "unit": "/100",
    "unitPosition": "after",
    "trendDisplay": "absolute",
    "majorColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)"
  },
  "context": {
    "thresholds": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  }
}
```

The DOS expression resolves the current value, then `rangeValue` picks a colour based on the `thresholds` array in `context`. With these buckets the headline turns red below 60, amber from 60 up to (but not including) 80, and green at 80 or above — universal SOC/ops vocabulary.

> **Threshold semantics — read this once, then every time.** `from` is **inclusive** (`>=`), `to` is **exclusive** (`<`), and `rangeValue` evaluates buckets **top-down** (first match wins). That makes overlapping buckets a silent footgun:
>
> - **Bug:** `[{to:70}, {from:70, to:90}, {from:90}]` — looks like RAG but the value 65 hits the first bucket (red) and the second bucket only fires for `>=70`, so the boundary case 70 itself is amber, not red. If your demo data is 65 you never see amber.
> - **Fix (canonical RAG):** `[{to:60}, {from:60, to:80}, {from:80}]` — disjoint, gap-free, top-down-safe. The value 60 lands in amber, 80 lands in green, anything below 60 is red.
>
> **Verify with at least one value per bucket** (e.g. health = 20 / 60 / 95 against thresholds 60 / 80) — otherwise you're not actually exercising the middle bucket on render.

### 6. Dynamic `backgroundColor` — whole tile flips red

```json
{
  "options": {
    "underLabel": "Errors / hour",
    "trendDisplay": "absolute",
    "backgroundColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(bgThresholds)",
    "majorColor": "#FFFFFF"
  },
  "context": {
    "bgThresholds": [
      { "to": 10,             "value": "#152034" },
      { "from": 10, "to": 20, "value": "#A85A1F" },
      { "from": 20,           "value": "#8B1F3A" }
    ]
  }
}
```

Same DOS pattern, applied to the whole-tile background. Lock `majorColor` to a high-contrast value (white in dark theme, black in light theme) so the headline stays readable when the tile flips. Use **sparingly** — whole-tile red is jarring; usually `majorColor` colouring is enough.

### 7. Sparkline as area + tooltip

```json
{
  "options": {
    "underLabel": "p95 latency",
    "unit": "ms",
    "unitPosition": "after",
    "trendDisplay": "percent",
    "showSparklineAreaGraph": true,
    "showSparklineTooltip": true,
    "sparklineStrokeColor": "#00D9FF",
    "sparklineAreaColor": "#00D9FF",
    "sparklineDisplay": "below"
  }
}
```

`showSparklineAreaGraph: true` fills the sparkline (always at 20% opacity). `showSparklineTooltip: true` exposes hover values for triage. Reads as more present than a pure line and works well for latency/throughput KPIs where the shape of recent history is part of the message.

### 8. `sparklineDisplay: "before"` — sparkline above the value

```json
{
  "options": {
    "underLabel": "Revenue (24h)",
    "unit": "$",
    "unitPosition": "before",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent",
    "sparklineDisplay": "before",
    "showSparklineAreaGraph": true
  }
}
```

`sparklineDisplay: "before"` puts the chart above the headline. Use when the trend is the headline and the number supports it — the eye lands on the shape first, then on the number.

### 9. `sparklineDisplay: "after"` — sparkline to the right

```json
{
  "options": {
    "underLabel": "Revenue (24h)",
    "unit": "$",
    "unitPosition": "before",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent",
    "sparklineDisplay": "after"
  }
}
```

Puts the sparkline to the right of the value. Layout choice for wide, short panels — a horizontal KPI strip with `[number | sparkline]` on each tile.

### 10. `sparklineHighlightDots` + `sparklineHighlightSegments`

```json
{
  "options": {
    "underLabel": "Recent activity",
    "showSparklineAreaGraph": true,
    "sparklineHighlightDots": 3,
    "sparklineHighlightSegments": 6,
    "sparklineStrokeColor": "#FFB627",
    "sparklineAreaColor": "#FFB627",
    "trendDisplay": "off"
  }
}
```

`Dots: 3` paints the last 3 data points as filled markers. `Segments: 6` emphasises the most recent 6 line segments. Combined with `showSparklineAreaGraph` produces a "fade to recent" effect — older history is muted, recent activity pops.

### 11. `numberPrecision: 4` + `shouldUseThousandSeparators: false`

```json
{
  "options": {
    "underLabel": "Conversion (4dp)",
    "unit": "%",
    "unitPosition": "after",
    "numberPrecision": 4,
    "shouldUseThousandSeparators": false,
    "trendDisplay": "percent"
  }
}
```

`numberPrecision: 4` displays 4 decimals — useful for very small ratios where `0.00` would round away the signal. `shouldUseThousandSeparators: false` strips commas — use for IDs, version numbers, sequence numbers, anything that is not a quantity.

### 12. Chrome-stripped — transparent + custom font sizes

```json
{
  "options": {
    "backgroundColor": "transparent",
    "underLabel": "MRR",
    "unit": "$",
    "unitPosition": "before",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent",
    "majorFontSize": 56,
    "underLabelFontSize": 14,
    "sparklineDisplay": "below"
  }
}
```

`backgroundColor: "transparent"` lets the dashboard background show through — useful when stacking the singlevalue on top of a custom rectangle/icon. `majorFontSize` + `underLabelFontSize` override the dynamic sizing for predictable visual weight inside compact KPI strips.

---

## Gotchas

- **`trendColor` does NOT auto-flip on positive vs. negative.** The default is the theme font colour for both directions. If you want red-down / green-up, drive `trendColor` with a DOS expression or accept the monochrome look.
- **`majorValue` and `sparklineValues` are independent options** — `majorValue` controls the headline, `sparklineValues` controls the chart. By default they read from the same series, but you CAN drive them from different fields/searches if you need (rare).
- **`shouldAbbreviateTrendValue` does NOT abbreviate the major value.** The headline keeps full precision; only the trend number is abbreviated. If you want the headline abbreviated too, do it in SPL (`| eval mrr_label = ...`).
- **`sparklineAreaColor` blends at 20% opacity** with the background. Pick a saturated stroke colour and let the engine handle the fill — manually picking a faded fill colour usually looks muddier than the default behaviour.
- **`numberPrecision: 0` does not round the headline** if the underlying value is already a fractional number — it just suppresses the decimal display. The trend delta IS rounded by `numberPrecision`.
- **Single-row data sources need both `trendDisplay: "off"` and `sparklineDisplay: "off"`.** Otherwise the engine tries to compute `delta(-2)` from a one-point series, which renders as `--` or empty.
- **Dynamic `backgroundColor` requires explicit `majorColor`** — when the tile flips dark, the default theme font colour is unchanged, so a dark-on-dark tile becomes unreadable. Always lock `majorColor` to a high-contrast value when driving `backgroundColor` dynamically.
- **`rangeValue` thresholds are top-down with `from` inclusive and `to` exclusive.** Overlapping buckets silently break: `[{to:70}, {from:70, to:90}, {from:90}]` looks like RAG but the value 65 hits the **first** bucket (red), and 70 lands in amber (not red), because evaluation is top-down and `to` is exclusive. Always design **disjoint, gap-free** buckets like `[{to:60}, {from:60, to:80}, {from:80}]` and verify with at least one demo value per bucket. See pattern 5 above.
- **`majorFontSize` ignores panel resize.** Once you set an explicit pixel size, the engine will NOT resize on panel resize. Skip it unless you have a fixed-size KPI strip.

---

## Cross-references

- `ds-pick-viz` — when *not* to use singlevalue (most non-KPI cases).
- `ds-viz-singlevalueicon` — for KPI tiles with a leading icon.
- `ds-viz-singlevalueradial` — for percentage of a known whole, rendered as a filled ring.
- `ds-viz-markergauge` / `ds-viz-fillergauge` — for value-on-axis or value-in-range with explicit min/max.
- `ds-viz-pie` (chrome-stripped donut, panel 10) — pair with a singlevalue overlay for the "big number with breakdown ring" pattern.
- `ds-design-principles` — colour discipline for thresholded KPI tiles, when to use whole-tile colour vs. number-only colour.

---

## Test bench

- `test-dashboard/dashboard.json` (dark) — deployed as `ds_viz_singlevalue_dark` in the `splunk-knowledge-testing` app.
- `test-dashboard/dashboard-light.json` (light) — deployed as `ds_viz_singlevalue_light` in the `splunk-knowledge-testing` app.

Every pattern in this skill corresponds 1:1 to a numbered panel in the test bench. When in doubt, open the dashboards and inspect the live JSON via the source editor.
