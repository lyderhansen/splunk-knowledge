---
name: ds-viz-column
description: Reference skill for the `splunk.column` visualization in Dashboard Studio (v2). Read when comparing values across discrete categories with vertical bars, or for time-on-x bucketed counts. Triggers on 'splunk.column', 'column chart', 'vertical bars', 'histogram', 'bucketed count', 'sparkbar', 'grouped columns', 'overlay columns'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-column — `splunk.column`

`splunk.column` renders **vertical bars**: categories on the x-axis, values on the y-axis. Use it for categorical comparisons and for time-on-x where each x-position is a discrete bucket (per-day counts, per-hour signups). Its horizontal twin is `splunk.bar` (`ds-viz-bar`).

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) —
>    *Column chart options* section starts at line ~6188.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every
>    pattern below was rendered and visually QA'd on Splunk Enterprise
>    10.2.1. Both files are deployed to the `splunk-knowledge-testing`
>    app as `ds_viz_column_dark` and `ds_viz_column_light`.

---

## When to use

- **Use** for comparing values across a small set of categories (≤ ~15).
- **Use** for time-bucketed counts where bars communicate "discrete event
  per bucket" better than a line (daily signups, hourly errors).
- **Use** `stackMode: "stacked"` when totals matter as much as breakdown.
- **Use** `stackMode: "stacked100"` when proportions matter, totals don't.
- **Use** `columnGrouping: "overlay"` only when comparing *target vs actual*
  side-by-side per category.
- **Don't use** for continuous trends → `splunk.line` / `splunk.area`.
- **Don't use** for many categories with long labels → switch to
  `splunk.bar` (horizontal — labels read naturally).
- **Don't use** with > 30 categories — bars get too thin to read.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

Statistics-table format. **First column = x-axis** (category or `_time`),
remaining columns = y-axis values per series.

```spl
... | chart count over status by host
... | timechart span=1h count by host
... | stats sum(revenue) as revenue by region | sort - revenue
| makeresults count=8 | streamstats count as i
| eval region = case(i=1,"US-East", i=2,"US-West", i=3,"EU-West", ...),
       revenue = round(50000 + 30000*sin(i/2) + random()%20000)
| table region revenue
```

Splunk needs at least two columns. Single-column SPL (e.g. `| stats count`)
won't render — wrap with `| eval label="Total"` first.

---

## The axis convention (apply to every column panel)

Same axis-tidying convention as `splunk.line` and `splunk.area`:

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide"
}
```

| Option | Value | Why |
|---|---|---|
| `xAxisTitleVisibility` | `"hide"` | The category name is already in the labels — repeating it as a title doubles the noise. |
| `xAxisLabelVisibility` | `"auto"` | Keep category labels visible; let Splunk thin them by panel width. |
| `xAxisMajorTickVisibility` | `"hide"` | The category position is obvious from the bar centre — tick marks are noise. |

Override for the **rotated-label** pattern (long category names) — see
pattern 8.

---

## Required & common options

`splunk.column` shares every shared option with `splunk.area` /
`splunk.line` (axis tuning, colour binding, legend, dual axis, annotations,
split series). Documented here are the **column-specific** options. For
shared properties (`yAxisScale`, `yAxisMin`, `yAxisAbbreviation`,
`*AxisLineVisibility`, `xAxisMaxLabelParts`) see `ds-viz-line` —
behaviour is identical.

### Column-specific

| Option | Values | Default | Notes |
|---|---|---|---|
| `xField` | string | `> x \| getField()` | The category column. Defaults to first SPL field. Override when the SPL emits multiple categorical columns. |
| `yFields` | string | `> y \| getField()` | The value column(s). Defaults to all numeric columns after `xField`. |
| `y2Fields` | array \| string | `> y2 \| getField()` | Series routed to the right y-axis (used with `showOverlayY2Axis: true`). |
| `stackMode` | `"auto" \| "stacked" \| "stacked100"` | `"auto"` | `auto` = grouped (one bar per series, side-by-side per category). `stacked` = vertical sum. `stacked100` = each category sums to 100%. |
| `columnGrouping` | `"auto" \| "overlay"` | `"auto"` | `overlay` draws series **on top of each other** (semi-transparent), useful for target-vs-actual. Mutually exclusive with stacking — Splunk silently ignores `stackMode` when `columnGrouping: "overlay"`. |
| `columnSpacing` | number (px) | `n/a` | Gap **between categories**. Larger gap = more breathing room between groups. |
| `seriesSpacing` | number (px) | `n/a` | Gap **between series within a category** (only meaningful with grouped, non-stacked bars). |
| `xAxisLabelRotation` | `-90 \| -45 \| 0 \| 45 \| 90` | `0` | Rotate long category labels. `-45` is the most-readable non-zero value. |
| `dataValuesDisplay` | `"off" \| "all" \| "minmax"` | `"off"` | `all` writes the value above each bar — clean for ≤8 bars; cluttered above that. |
| `showTooltip` | boolean | `true` | Hover tooltip. Disable only on print exports. |

### Shared with `splunk.area` / `splunk.line`

| Option | Notes |
|---|---|
| `seriesColors` / `seriesColorsByField` | Use `seriesColorsByField` for refactor safety. |
| `legendDisplay` / `legendMode` / `legendLabels` / `legendTruncation` | Same five-position legend system. |
| `overlayFields`, `showOverlayY2Axis`, `y2AxisTitleText` | Dual axis: pulls the overlay field(s) onto a right y-axis. |
| `annotationX`, `annotationLabel`, `annotationColor` | Secondary `annotation` dataSource pattern (see `ds-viz-line` pattern 5). |
| `showSplitSeries`, `showIndependentYRanges` | Small multiples per series. |
| `showYAxisWithZero`, `showYAxisExtendedRange` | Force `0` into y-range or extend to whole tick. **Always `showYAxisWithZero: true` for delta/error bars.** |
| `resultLimit` | Hard cap (`50000`). |

---

## Twelve verified patterns

The test dashboard exercises one option group per panel.

### 1. Minimal — clean defaults applied

Single series, single colour, axis convention applied.

```json
{
  "type": "splunk.column",
  "title": "Revenue by region",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 2. Multi-series grouped (default `stackMode: "auto"`)

Default `auto` is **grouped, not stacked.** Three series → three bars per
category, side-by-side. Tighten `seriesSpacing` to avoid mistaking the gap
between series for a gap between categories.

```json
{
  "type": "splunk.column",
  "title": "Revenue by region (Q1 / Q2 / Q3)",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "columnSpacing": 12,
    "seriesSpacing": 2,
    "legendDisplay": "bottom",
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 3. Stacked — cumulative per category

`stackMode: "stacked"` sums series vertically. The bar height is the
*total*, each colour band is a contribution.

```json
{
  "type": "splunk.column",
  "title": "Revenue stacked by quarter",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "stackMode": "stacked",
    "seriesColorsByField": {
      "q1": "#00D9FF",
      "q2": "#7AA2FF",
      "q3": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 4. Stacked 100% — share per category

Each bar normalized to `100`. Best for "how is the mix shifting across
categories?". Set `yAxisAbbreviation: "off"` so `100` doesn't print as
`100`.

```json
{
  "type": "splunk.column",
  "title": "Revenue mix per region (%)",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "stackMode": "stacked100",
    "seriesColorsByField": {
      "q1": "#00D9FF",
      "q2": "#7AA2FF",
      "q3": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Mix (%)",
    "yAxisAbbreviation": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 5. Overlay (target vs actual)

`columnGrouping: "overlay"` draws series on top of each other with
transparency. Use for two-series comparisons where shape matters more
than absolute difference. **Stacking is silently ignored** with `overlay`.

```json
{
  "type": "splunk.column",
  "title": "Target vs actual",
  "dataSources": { "primary": "ds_target_actual" },
  "options": {
    "columnGrouping": "overlay",
    "seriesColorsByField": {
      "target": "#7AA2FF",
      "actual": "#00D9FF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 6. Negative values — diverging bars around zero

Variance or delta data has negative values. `showYAxisWithZero: true`
locks `0` into the range so positive and negative bars share a baseline.
Pair with a positive/negative colour split:

```json
{
  "type": "splunk.column",
  "title": "Revenue variance vs target",
  "dataSources": { "primary": "ds_negative" },
  "options": {
    "showYAxisWithZero": true,
    "seriesColors": ["#FF2D95"],
    "yAxisTitleText": "Variance ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 7. Min / max axis pinning

When comparing across panels, force the y-range so column heights are
visually comparable. Combine with `yAxisMajorTickInterval` for
whole-number gridlines.

```json
{
  "type": "splunk.column",
  "title": "Latency p95 (pinned 0–500 ms)",
  "dataSources": { "primary": "ds_latency" },
  "options": {
    "yAxisMin": "0",
    "yAxisMax": "500",
    "yAxisMajorTickInterval": 100,
    "yAxisTitleText": "p95 (ms)",
    "seriesColors": ["#FFB627"],
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 8. Rotated x-axis labels — long category names

`xAxisLabelRotation` accepts `-90 | -45 | 0 | 45 | 90`. **`-45` is the
most readable non-zero value** — labels slope up-right and don't overlap.
Use only when categories are long enough to clip horizontally. Reserve
`-90` for extremely long labels (URLs, full hostnames).

```json
{
  "type": "splunk.column",
  "title": "Top error sources",
  "dataSources": { "primary": "ds_long_labels" },
  "options": {
    "xAxisLabelRotation": -45,
    "seriesColors": ["#FF2D95"],
    "yAxisTitleText": "Errors / hour",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 9. Annotations — Black Friday on a daily-count column chart

Same pattern as `splunk.line` annotations: a *second* dataSource keyed
`annotation` with `_time`, `annotationLabel`, `annotationColor`. Bind via
DOS expressions.

```json
{
  "type": "splunk.column",
  "title": "Daily orders (Black Friday → Boxing Day)",
  "dataSources": {
    "primary":    "ds_annotations_data",
    "annotation": "ds_annotations_marks"
  },
  "options": {
    "seriesColors": ["#7AA2FF"],
    "yAxisTitleText": "Orders",
    "annotationX":     "> annotation | seriesByName('_time')",
    "annotationLabel": "> annotation | seriesByName('annotationLabel')",
    "annotationColor": "> annotation | seriesByName('annotationColor')",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 10. Dual y-axis — count + average

`overlayFields` moves the named field to the right axis. Use when units
differ (orders count vs avg order value).

```json
{
  "type": "splunk.column",
  "title": "Orders & avg order value",
  "dataSources": { "primary": "ds_dualaxis" },
  "options": {
    "overlayFields": "avg_order_value",
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Avg order value ($)",
    "yAxisTitleText": "Orders",
    "seriesColors": ["#00D9FF", "#FFB627"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 11. Sparkbar (hidden chrome) — KPI tile

Strip every axis, label, gridline, legend. The bar shape is the only
signal. Use *inside* a KPI card.

```json
{
  "type": "splunk.column",
  "dataSources": { "primary": "ds_sparkbar" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "columnSpacing": 1,
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

### 12. Split sub-charts — independent y-ranges

Use when grouped series have wildly different magnitudes (orders 0–1k,
errors 0–50). Always pair `showSplitSeries: true` with
`showIndependentYRanges: true`.

```json
{
  "type": "splunk.column",
  "title": "Orders / errors / latency by region (split)",
  "dataSources": { "primary": "ds_split" },
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

---

## Trellis layout (Splunk 10.0.2503+, untested in test bench)

The 10.0.2503 changelog enables trellis for column charts; the 10.4
*Trellis layout* page contradicts and says single-value only. Until
verified, prefer **`showSplitSeries: true`** (pattern 12). Options if you
experiment: `splitByLayout`, `trellisSplitBy`, `trellisColumns`,
`trellisMinColumnWidth`, `trellisRowHeight`, `trellisPageCount`,
`trellisBackgroundColor` (see `ds-viz-line`).

---

## Dark + light variants

Same palette remap as `ds-viz-line` / `ds-viz-area`:

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#0066B3` | Primary cyan / blue |
| `#FF2D95` | `#C62368` | Alert / negative |
| `#FFB627` | `#B36B00` | Warning / amber |
| `#7AA2FF` | `#4A6BD9` | Secondary / steel |
| `#33FF99` | `#1F8C5E` | Positive / green |
| `#B57BFF` | `#7B47CC` | Tertiary / purple |

**Column-specific palette rule:** filled bars cover more area than line
strokes — neon colours on a light theme are even more eye-watering than
they are on lines. Always remap.

---

## Gotchas (Splunk 10.2.1)

1. **Default `stackMode` is `"auto"` = *grouped*, not stacked.** If you
   want vertical sums, set `"stacked"` explicitly.
2. **`columnGrouping: "overlay"` silently disables `stackMode`.** No
   warning, no error. Pick one.
3. **`columnSpacing` and `seriesSpacing` are absolute pixels, not
   ratios.** Splunk doesn't enforce a minimum bar width, so on narrow
   panels with many categories you can end up with bars that are 1 px
   wide. Test on the smallest panel size you intend to ship.
4. **`xAxisLabelRotation` only accepts five values: `-90 / -45 / 0 / 45 /
   90`.** Other numbers are silently ignored (no rotation applied). Use
   `-45` for most "long label" cases.
5. **`dataValuesDisplay: "all"` becomes unreadable above ~8 bars.** Use
   `"minmax"` or turn it off and rely on tooltip.
6. **Negative values + `stackMode: "stacked"` is undefined.** Splunk
   stacks them above zero anyway, producing a misleading total. Use
   `auto` (grouped) and `showYAxisWithZero: true`.
7. **`yAxisScale: "log"` rejects `<= 0`.** Combined with bars-near-zero,
   bars vanish.
8. **`seriesColors` is positional.** A SPL `| eval` reordering silently
   swaps colours. Use `seriesColorsByField`.
9. **`resultLimit` (50 000) drops bars without warning.** Aggregate
   upstream.
10. **First column controls the x-axis.** If your SPL puts the value
    first (e.g. `| stats sum(x) as total by region`), Splunk renders
    bars-by-`total` (numeric x) instead of by `region`. Reorder with
    `| table region total`.

---

## Cross-references

- `ds-pick-viz` — when to use `splunk.column` vs `splunk.bar`,
  `splunk.line`, `splunk.area`.
- `ds-viz-bar` — horizontal twin (same options, swapped axes — use when
  category labels are long).
- `ds-viz-line` — continuous time series (the place where shared options
  like axis tuning, dual axis, annotations, splits are documented in
  detail).
- `ds-viz-area` — sibling for stacked filled trends; same `stackMode`
  semantics.
- `ds-design-principles` — colour discipline, when *not* to use a chart.
- `ds-syntax` — JSON envelope, `dataSources`, defaults, Dynamic Options
  Syntax.
- `interactivity/ds-tokens`, `interactivity/ds-drilldown` — wiring filters
  and clicks.
- **`docs/SplunkCloud-10.4.2604-DashStudio.pdf`** — official reference.
  Grep the extracted `.txt` for `^Column chart options` (line ~6188).

---

## Test bench

| File | Purpose |
|---|---|
| `test-dashboard/dashboard.json` | Dark, 12 panels, exercises every option above. |
| `test-dashboard/dashboard-light.json` | Light, palette-remapped twin of the dark dashboard. |

Deployed in Splunk as:

- `/app/splunk-knowledge-testing/ds_viz_column_dark`
- `/app/splunk-knowledge-testing/ds_viz_column_light`
