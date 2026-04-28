---
name: ds-viz-area
description: Reference skill for the `splunk.area` visualization in Dashboard Studio (v2). Read when plotting cumulative or stacked metrics over time. Triggers on 'splunk.area', 'area chart', 'stacked area', 'cumulative trend', 'stacked100', 'share-of-traffic', 'stream graph'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-area — `splunk.area`

`splunk.area` is `splunk.line` with the region under each series filled. It excels at **part-to-whole** trends — when the *total* matters as much as the individual series.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) — the
>    *Area chart options* section (line ~5293) is the verbatim option list,
>    types, and defaults.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every
>    pattern below was rendered and visually QA'd on Splunk Enterprise 10.2.1.
>    Both files are deployed to the `splunk-knowledge-testing` app as
>    `ds_viz_area_dark` and `ds_viz_area_light`.

---

## When to use

- **Use** when the *total* is the question — share-of-traffic, cumulative
  load, infrastructure breakdown by tier.
- **Use** for 2–4 stacked series. With 5+, the bottom series visually flatlines.
- **Use** `stackMode: "stacked100"` when proportions matter and absolute
  values don't.
- **Don't use** for raw multi-series comparison → `splunk.line` (unstacked
  area is hard to read because filled regions overlap).
- **Don't use** when series can be negative — area charts assume non-negative
  inputs.
- **Don't use** for two series with very different magnitudes — the small
  one disappears. Use `splunk.line` with `showOverlayY2Axis: true`.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

One `_time` column plus one or more **non-negative** numeric series:

```spl
| timechart span=5m sum(bytes) as bytes by tier
| bin _time span=1h | stats sum(requests) as requests by _time, region
| makeresults count=24 | streamstats count as i
| eval _time = relative_time(now(), "-24h") + (i*3600)
| eval frontend = round(40 + 15*sin(i/4) + random()%8),
       backend  = round(60 + 20*sin(i/5+1) + random()%10),
       database = round(30 + 12*sin(i/3+2) + random()%6)
| table _time frontend backend database
```

For `stackMode: "stacked100"`, Splunk normalizes the numbers; you can pass raw counts.

---

## The time-axis convention (apply to every area panel)

Same as `splunk.line` — verified on Splunk 10.2.1:

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide"
}
```

| Option | Value | Why |
|---|---|---|
| `xAxisTitleVisibility` | `"hide"` | The literal `_time` is noise. Viewers know the x-axis is time. |
| `xAxisLabelVisibility` | `"auto"` | Keep timestamp labels; let Splunk thin them by panel width. |
| `xAxisMajorTickVisibility` | `"hide"` | Removes the small vertical tick marks under the axis line. |

Override only for sparkline panels (hide everything — see pattern 11).

---

## Required & common options

`splunk.area` shares almost all options with `splunk.line` and `splunk.column`.
The properties below are the **area-specific** ones. For shared axis tuning
(`yAxisScale`, `yAxisMin`, `yAxisAbbreviation`, `xAxisMaxLabelParts`,
`showYAxisExtendedRange`, `showYAxisWithZero`, `*AxisLineVisibility`) see
`ds-viz-line` — they behave identically.

### Area-specific

| Option | Values | Default | Notes |
|---|---|---|---|
| `stackMode` | `"auto" \| "stacked" \| "stacked100"` | `"auto"` | `auto` = no stacking (areas overlap with `areaOpacity` blending). `stacked` = cumulative. `stacked100` = each x-bucket sums to 100%. |
| `areaOpacity` | number `0`–`1` | `0.75` | Drop to `0.4`–`0.5` for unstacked overlapping areas; raise to `0.9`+ for stacked when the top edge needs to be crisp. |
| `showLines` | boolean | `true` | Draw the line on top of each filled region. Set `false` for the "stream graph" look. |
| `nullValueDisplay` | `"gaps" \| "zero" \| "connect"` | `"gaps"` | `"connect"` bridges nulls (best for sampling gaps). `"zero"` lies — never use for metrics that can legitimately be zero. With stacking, `"zero"` and `"gaps"` produce noticeably different totals. |

### Shared with `splunk.line`

| Option | Notes |
|---|---|
| `seriesColors` / `seriesColorsByField` | Use `seriesColorsByField` for refactor-safety. |
| `lineWidth` | Only matters when `showLines: true`. `2` is the default. |
| `dataValuesDisplay` | `"off" \| "all" \| "minmax"`. `"minmax"` is the only readable option for ≥10 data points. |
| `legendDisplay` | `"right" \| "left" \| "top" \| "bottom" \| "off"`. `"right"` is the documented default. |
| `legendMode` | `"standard" \| "seriesCompare"`. `seriesCompare` highlights all series on hover. |
| `overlayFields`, `showOverlayY2Axis`, `y2AxisTitleText`, `y2Fields` | Same dual-axis pattern as line. |
| `annotationX`, `annotationLabel`, `annotationColor` | Same secondary `annotation` dataSource pattern. |
| `showSplitSeries`, `showIndependentYRanges` | Same small-multiples pattern. |
| `resultLimit` | Hard cap (`50000`). Aggregate upstream if you hit it. |

---

## Eleven verified patterns

The test dashboard exercises one option group per panel.

### 1. Minimal — clean defaults applied

The recommended baseline for any single-series filled trend.

```json
{
  "type": "splunk.area",
  "title": "Requests per hour",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "areaOpacity": 0.85,
    "yAxisTitleText": "Requests / hour",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 2. Multi-series unstacked — overlapping areas

Default `stackMode: "auto"` does **not** stack. Each series is filled
independently. Drop `areaOpacity` to `0.4`–`0.5` so overlap is readable.

```json
{
  "type": "splunk.area",
  "title": "Regional traffic (overlapping)",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "areaOpacity": 0.45,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "bottom",
    "yAxisTitleText": "Requests / hour",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 3. Stacked — cumulative volume per tier

`stackMode: "stacked"` sums series vertically. Each colour band represents
the contribution of one series; the top edge is the *total*.

```json
{
  "type": "splunk.area",
  "title": "CPU load by tier (stacked)",
  "dataSources": { "primary": "ds_stacked" },
  "options": {
    "stackMode": "stacked",
    "seriesColorsByField": {
      "frontend": "#00D9FF",
      "backend":  "#7AA2FF",
      "database": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "CPU cores used",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 4. Stacked 100% — share of traffic

`stackMode: "stacked100"` normalizes each x-bucket to `100`. Y-axis becomes a
percentage. Best for "how is the mix shifting?" questions where absolute
volume is not the point. Set `yAxisAbbreviation: "off"` so Splunk doesn't
abbreviate `100` to `100`.

```json
{
  "type": "splunk.area",
  "title": "Traffic mix (mobile / desktop / tablet)",
  "dataSources": { "primary": "ds_pct" },
  "options": {
    "stackMode": "stacked100",
    "seriesColorsByField": {
      "mobile":  "#00D9FF",
      "desktop": "#7AA2FF",
      "tablet":  "#FFB627"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Traffic share (%)",
    "yAxisAbbreviation": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 5. Low opacity — translucent unstacked areas

When two series overlap heavily, drop `areaOpacity` to `0.3`. The eye reads
both. Useful for actual-vs-target comparisons.

```json
{
  "type": "splunk.area",
  "title": "Actual vs target",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "areaOpacity": 0.3,
    "seriesColors": ["#00D9FF", "#FF2D95"],
    "lineWidth": 2,
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 6. No top edge — stream-graph look

`showLines: false` removes the line on top of each filled region. The chart
becomes pure colour shape. Pair with `areaOpacity: 1` for solid bands or
`0.6` for hand-drawn feel.

```json
{
  "type": "splunk.area",
  "title": "Stacked stream",
  "dataSources": { "primary": "ds_stacked" },
  "options": {
    "stackMode": "stacked",
    "showLines": false,
    "areaOpacity": 0.9,
    "seriesColorsByField": {
      "frontend": "#00D9FF",
      "backend":  "#7AA2FF",
      "database": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 7. Dual y-axis — area on left, latency line on right

`overlayFields` moves the named field(s) to the right axis and renders them
as a line, not an area. Best when units differ (req/min vs ms).

```json
{
  "type": "splunk.area",
  "title": "Throughput vs p95 latency",
  "dataSources": { "primary": "ds_dualaxis" },
  "options": {
    "overlayFields": "p95_latency_ms",
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Latency (ms)",
    "yAxisTitleText": "Requests / min",
    "seriesColors": ["#00D9FF", "#FF2D95"],
    "areaOpacity": 0.8,
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 8. Event annotations — secondary `annotation` dataSource

Annotations require a separate dataSource with three fields: `_time`,
`annotationLabel`, `annotationColor`. Bind via DOS expressions.

```json
{
  "type": "splunk.area",
  "title": "Daily revenue (Black Friday → Boxing Day)",
  "dataSources": {
    "primary":    "ds_annotations_data",
    "annotation": "ds_annotations_marks"
  },
  "options": {
    "seriesColors": ["#7AA2FF"],
    "areaOpacity": 0.8,
    "yAxisTitleText": "Revenue ($)",
    "annotationX":     "> annotation | seriesByName('_time')",
    "annotationLabel": "> annotation | seriesByName('annotationLabel')",
    "annotationColor": "> annotation | seriesByName('annotationColor')",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

The annotation SPL produces exactly those three columns:

```spl
| makeresults count=2 | streamstats count as i
| eval _time = case(i=1, relative_time(now(), "-7d"), 1==1, relative_time(now(), "-2d")),
       annotationLabel = case(i=1, "Black Friday", 1==1, "Cyber Monday"),
       annotationColor = case(i=1, "#FF2D95", 1==1, "#FFB627")
| table _time annotationLabel annotationColor
```

### 9. Log scale + null handling

`yAxisScale: "log"` compresses orders of magnitude. **Always set
`showYMinorGridLines: false`** on log axes — the default emits one minor
gridline per log decade tick which produces visible noise.

```json
{
  "type": "splunk.area",
  "title": "Traffic vs errors (log)",
  "dataSources": { "primary": "ds_log_nulls" },
  "options": {
    "yAxisScale": "log",
    "yAxisMin": "1",
    "nullValueDisplay": "connect",
    "showYMinorGridLines": false,
    "seriesColors": ["#7AA2FF", "#FF2D95"],
    "areaOpacity": 0.6,
    "yAxisTitleText": "Events (log)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 10. Split series — independent y-ranges

Use when stacked series have wildly different magnitudes (cpu_pct vs
memory_gb vs disk_iops). Always pair `showSplitSeries: true` with
`showIndependentYRanges: true`.

```json
{
  "type": "splunk.area",
  "title": "Host telemetry (split)",
  "dataSources": { "primary": "ds_split" },
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "areaOpacity": 0.7,
    "legendDisplay": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 11. Sparkline (hidden chrome) — KPI tile

Strip every axis, label, gridline, legend. The shape is the only signal.
Use *inside* a KPI card.

```json
{
  "type": "splunk.area",
  "dataSources": { "primary": "ds_minimal" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "areaOpacity": 0.35,
    "lineWidth": 2,
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "hide",
    "xAxisMajorTickVisibility": "hide",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "hide",
    "yAxisMajorTickVisibility": "hide",
    "showYMajorGridLines": false,
    "legendDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

This is the **only** pattern where you also hide `xAxisLabelVisibility`.

### 12. Smart axis — recommended baseline

Codified target for every time-series area panel.

```json
{
  "options": {
    "areaOpacity": 0.8,
    "yAxisTitleText": "Signal",
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

---

## Trellis layout (Splunk 10.0.2503+, untested in test bench)

The 10.0.2503 changelog says trellis is available for area, line, column,
and bar — but the 10.4 *Trellis layout* page still says "Trellis is only
available for single value visualizations". Until we verify on real data,
prefer **`showSplitSeries: true`** (pattern 10) which has been stable since
well before 10.0.

Options if you experiment: `splitByLayout`, `trellisSplitBy`,
`trellisColumns`, `trellisMinColumnWidth`, `trellisRowHeight`,
`trellisPageCount`, `trellisBackgroundColor`. See `ds-viz-line` for the
shared option table.

---

## Dark + light variants

Build every area panel for both themes. The test bench ships paired files:

- `test-dashboard/dashboard.json` — neon high-saturation palette (dark theme)
- `test-dashboard/dashboard-light.json` — deeper print-friendly palette (light theme)

Palette remap (same as `ds-viz-line`):

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#0066B3` | Primary cyan / blue |
| `#FF2D95` | `#C62368` | Alert / negative |
| `#FFB627` | `#B36B00` | Warning / amber |
| `#7AA2FF` | `#4A6BD9` | Secondary / steel |
| `#33FF99` | `#1F8C5E` | Positive / green |
| `#B57BFF` | `#7B47CC` | Tertiary / purple |

Rule: never put a neon colour (>90% saturation) on a light background — it
vibrates. Fills are larger than line strokes so the rule matters more here
than for `splunk.line`.

When the dashboard envelope sets `theme: "dark"` Splunk inverts panel chrome
automatically; only the *series* fills need remapping.

---

## Gotchas (Splunk 10.2.1)

1. **Default `stackMode` is `"auto"` — that means *not* stacked.** Many
   people expect "auto" to detect overlap and stack. It does not. You must
   explicitly set `"stacked"` or `"stacked100"`.
2. **Negative values break stacking visually.** Area charts assume
   non-negative inputs. For ± deltas, use `splunk.column` with
   `showYAxisWithZero: true` (see `ds-viz-column`).
3. **`stacked100` requires non-zero inputs in *every* x-bucket** — a row
   with all zeros divides by zero and renders as a gap. Filter empty
   buckets in SPL.
4. **`areaOpacity: 1` on overlapping unstacked areas hides the back series
   completely.** Use `0.4`–`0.6` for unstacked, `0.8`–`0.9` for stacked.
5. **`nullValueDisplay: "zero"` is almost always wrong with stacking** —
   it injects fake bottom rows that swap the stack order.
6. **`showLines: false` + low opacity = invisible.** If you turn lines off,
   raise opacity to ≥`0.7` so the bands are still visible.
7. **`yAxisScale: "log"` + stacked = nonsense.** Log of a sum is not the
   sum of logs. Use `auto` (unstacked) or switch to line on a log axis.
8. **`seriesColors` is positional.** A SPL change that reorders fields
   silently swaps fills. Use `seriesColorsByField`.
9. **`resultLimit` (50 000 rows) drops points without warning.** Aggregate
   upstream.
10. **Field names starting with `_` (other than `_time`) aren't plotted.**

---

## Cross-references

- `ds-pick-viz` — when to use `splunk.area` vs `splunk.line`,
  `splunk.column`, `splunk.bar`.
- `ds-viz-line` — sibling for non-stacked time series (the shared axis,
  dual-axis, annotation, and split patterns are documented in detail there).
- `ds-viz-column` — categorical (non-time) cousin with the same stack modes.
- `ds-design-principles` — colour discipline, hierarchy, when *not* to
  stack at all.
- `ds-syntax` — JSON envelope, `dataSources`, defaults, Dynamic Options
  Syntax.
- `interactivity/ds-tokens`, `interactivity/ds-drilldown` — wiring filters
  and clicks.
- **`docs/SplunkCloud-10.4.2604-DashStudio.pdf`** — official reference.
  Grep the extracted `.txt` for `^Area chart options` (line ~5293) for the
  canonical, defaulted option list.

---

## Test bench

| File | Purpose |
|---|---|
| `test-dashboard/dashboard.json` | Dark, 12 panels, exercises every option above. |
| `test-dashboard/dashboard-light.json` | Light, palette-remapped twin of the dark dashboard. |

Deployed in Splunk as:

- `/app/splunk-knowledge-testing/ds_viz_area_dark`
- `/app/splunk-knowledge-testing/ds_viz_area_light`
