---
name: ds-viz-bar
description: Reference skill for the `splunk.bar` visualization in Dashboard Studio (v2). Read when comparing values across discrete categories with **horizontal** bars — long labels, top-N rankings, country / region / hostname comparisons. Triggers on 'splunk.bar', 'bar chart', 'horizontal bars', 'top N', 'top sources', 'long labels'. Cross-checked against the official Splunk Cloud 10.4.2604 Dashboard Studio reference; visually verified on Splunk Enterprise 10.2.1.
---

# ds-viz-bar — `splunk.bar`

`splunk.bar` is `splunk.column` rotated 90°. **Horizontal bars** make long category labels readable without rotation, which is why bar is almost always the right choice for top-N tables of hostnames, URLs, error messages, regions, etc.

**Axis direction:** category on the y-axis, value on the x-axis. The opposite of `splunk.column`. So `xAxis*` controls the **value** axis and `yAxis*` controls the **category** axis.

> **Sources of truth used to write this skill:**
>
> 1. `docs/SplunkCloud-10.4.2604-DashStudio.pdf` (extracted as `.txt`) —
>    *Bar chart options* section starts at line ~5784.
> 2. `test-dashboard/dashboard.json` and `dashboard-light.json` — every
>    pattern below was rendered and visually QA'd on Splunk Enterprise
>    10.2.1. Both files are deployed to the `splunk-knowledge-testing`
>    app as `ds_viz_bar_dark` and `ds_viz_bar_light`.

---

## When to use

- **Use** when category labels are long enough to clip / overlap on a
  column chart (hostnames, URLs, error messages, country names).
- **Use** for **top-N rankings** sorted descending — the visual answer
  is "who's tallest" in column charts and "who's longest" in bar charts;
  the second is easier to scan.
- **Use** for ≤ ~25 categories. More than that, paginate or aggregate.
- **Use** stacked bars (`stackMode: "stacked"`) for cumulative breakdowns.
- **Use** stacked100 for share-of-mix.
- **Don't use** for time-series → `splunk.line` / `splunk.area` /
  `splunk.column`. Bar inverts time intuition (older items appear at
  bottom or top depending on sort).
- **Don't use** for short labels that fit horizontally — `splunk.column`
  is more conventional and reads slightly faster.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

Statistics-table format. **First column = y-axis** (category). Remaining
columns = x-axis values per series.

```spl
... | stats sum(revenue) as revenue by region | sort - revenue
... | top limit=10 url | sort - count
| makeresults count=8 | streamstats count as i
| eval country = case(i=1,"United Kingdom", i=2,"United States", ...),
       revenue = round(50000 + 30000*sin(i/2) + random()%20000)
| sort - revenue | table country revenue
```

**Always `| sort` the data in SPL** — bar charts render rows in the order
SPL emits them. Random order is unreadable.

---

## The axis convention (apply to every bar panel)

Inverted from `splunk.column` because the axes are swapped:

```json
{
  "yAxisTitleVisibility": "hide",
  "yAxisLabelVisibility": "auto",
  "yAxisMajorTickVisibility": "hide"
}
```

| Option | Value | Why |
|---|---|---|
| `yAxisTitleVisibility` | `"hide"` | The category name is already in the labels — title duplicates noise. |
| `yAxisLabelVisibility` | `"auto"` | Keep category labels visible; let Splunk thin them by panel height. |
| `yAxisMajorTickVisibility` | `"hide"` | The category position is obvious from the bar centre. |

For the value axis (x), keep it visible — that's the data:

```json
{
  "xAxisTitleText": "Revenue ($)",
  "xAxisTitleVisibility": "show",
  "xAxisLabelVisibility": "auto"
}
```

---

## Required & common options

`splunk.bar` shares almost every option with `splunk.column`. The two
notable **bar-only constraints** (cross-checked against the 10.4 PDF
options table at line ~5784):

| Removed vs. column | Notes |
|---|---|
| `columnGrouping` | Not in the bar options table. Bar charts can't be drawn with overlay grouping; `stackMode` is the only multi-series layout choice. |
| `xAxisLabelRotation` | Not in the bar options table. Splunk does not rotate value-axis labels (numbers fit horizontally), and category labels are already horizontal. |
| `showTooltip` | Not in the bar options table. Tooltips appear by default and can't be disabled. |
| Annotations (`annotationX/Label/Color`) | Bar's option table does **not** list annotations as supported. Some 10.4 reference text mentions annotations on bar — but the option table is authoritative. **Don't rely on annotations for bar charts.** |

### Bar-specific (or differently named)

| Option | Values | Default | Notes |
|---|---|---|---|
| `xField` | string | `> x \| getField()` | The category column. |
| `yFields` | string | `> y \| getField()` | The value column(s). |
| `barSpacing` | number (px) | `n/a` | Gap **between categories** (vertical gap, since bars are horizontal). Larger = more breathing room between rows. |
| `seriesSpacing` | number (px) | `n/a` | Gap **between series within a category**. Only meaningful with grouped (non-stacked) bars. |
| `stackMode` | `"auto" \| "stacked" \| "stacked100"` | `"auto"` | `auto` = grouped (one bar per series, side-by-side per category). `stacked` = horizontal sum. `stacked100` = each row sums to 100%. |
| `dataValuesDisplay` | `"off" \| "all" \| "minmax"` | `"off"` | `all` writes the value at the end of each bar — clean for ≤8 rows; cluttered above that. |

### Shared with `splunk.column` / `splunk.area` / `splunk.line`

| Option | Notes |
|---|---|
| `seriesColors` / `seriesColorsByField` | Use `seriesColorsByField` for refactor safety. |
| `legendDisplay` / `legendMode` / `legendLabels` / `legendTruncation` | Same five-position legend system. |
| `overlayFields`, `showOverlayY2Axis`, `y2AxisTitleText` | Dual axis pattern (rare for bar; the second value axis stacks below the first). |
| `showSplitSeries`, `showIndependentYRanges` | Small multiples per series. |
| `showXAxisWithZero` | **Critical for ± deltas** — keeps zero in the value range so positive and negative bars share a baseline. |
| `xAxisScale: "log"` | Use when ranking spans orders of magnitude. |
| `resultLimit` | Hard cap (`50000`). |

---

## Twelve verified patterns

### 1. Minimal — clean defaults applied

Single series, sorted descending, axis convention applied.

```json
{
  "type": "splunk.bar",
  "title": "Revenue by country",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 2. Multi-series grouped — three quarters side-by-side

`stackMode: "auto"` is grouped (not stacked). Three series per row.
Tighten `seriesSpacing` so bars within a group cluster visually.

```json
{
  "type": "splunk.bar",
  "title": "Revenue by country (Q1 / Q2 / Q3)",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "barSpacing": 12,
    "seriesSpacing": 2,
    "legendDisplay": "bottom",
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 3. Stacked — cumulative per row

`stackMode: "stacked"` sums series horizontally. The bar length is the
*total*; each colour band is a contribution.

```json
{
  "type": "splunk.bar",
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
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 4. Stacked 100% — share per row

Each row normalized to `100`. Best for "what's the mix per category?".
Set `xAxisAbbreviation: "off"` so `100` doesn't print as `100`.

```json
{
  "type": "splunk.bar",
  "title": "Revenue mix per country (%)",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "stackMode": "stacked100",
    "seriesColorsByField": {
      "q1": "#00D9FF",
      "q2": "#7AA2FF",
      "q3": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "xAxisTitleText": "Mix (%)",
    "xAxisAbbreviation": "off",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 5. Negative values — diverging bars around zero

Variance / delta data. `showXAxisWithZero: true` (the **x-axis** is the
value axis on bar charts) locks zero into the range so positive and
negative bars share a baseline.

```json
{
  "type": "splunk.bar",
  "title": "Revenue variance vs target",
  "dataSources": { "primary": "ds_negative" },
  "options": {
    "showXAxisWithZero": true,
    "seriesColors": ["#FF2D95"],
    "xAxisTitleText": "Variance ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 6. Min / max axis pinning

When comparing across panels, force the value range so bar lengths are
visually comparable.

```json
{
  "type": "splunk.bar",
  "title": "Latency p95 (pinned 0–500 ms)",
  "dataSources": { "primary": "ds_latency" },
  "options": {
    "xAxisMin": "0",
    "xAxisMax": "500",
    "xAxisMajorTickInterval": 100,
    "xAxisTitleText": "p95 (ms)",
    "seriesColors": ["#FFB627"],
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 7. Data labels — value at end of each bar

`dataValuesDisplay: "all"` writes the numeric value at the end of each
bar. Clean for ≤ 8 rows; cluttered above that. Use `"minmax"` to label
just the longest and shortest bars.

```json
{
  "type": "splunk.bar",
  "title": "Top 8 by revenue",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "dataValuesDisplay": "all",
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 8. Logarithmic value axis — orders-of-magnitude top-N

When the top item is 1000× the bottom item, log scale prevents the long
tail from disappearing.

```json
{
  "type": "splunk.bar",
  "title": "Events by source (log)",
  "dataSources": { "primary": "ds_log" },
  "options": {
    "xAxisScale": "log",
    "xAxisMin": "1",
    "seriesColors": ["#7AA2FF"],
    "xAxisTitleText": "Events (log)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 9. Tight bar spacing — packed top-N density

For dense top-N (15+ rows), drop `barSpacing` to `1`–`2` so rows feel
like a list, not a chart.

```json
{
  "type": "splunk.bar",
  "title": "Top 15 URLs by 5xx errors",
  "dataSources": { "primary": "ds_dense" },
  "options": {
    "barSpacing": 2,
    "seriesColors": ["#FF2D95"],
    "xAxisTitleText": "5xx errors",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 10. Grouped legend at top — multi-quarter top-N

When series are quarters / years / cohorts, a top-positioned legend
makes the time relationship explicit.

```json
{
  "type": "splunk.bar",
  "title": "Top regions by quarter",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "legendDisplay": "top",
    "barSpacing": 14,
    "seriesSpacing": 2,
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

### 11. Sparkbar (hidden chrome) — KPI tile

Strip every axis, label, gridline, legend. Bar shape is the only signal.
**Both `showXMajorGridLines` and `showYMajorGridLines` must be set to
`false`** — `showYMajorGridLines` defaults to `true` on bar charts even
though the y-axis is the category axis. Forgetting this leaves
horizontal lines striping the panel and the "sparkbar" looks busy.

```json
{
  "type": "splunk.bar",
  "dataSources": { "primary": "ds_sparkbar" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "barSpacing": 1,
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "hide",
    "xAxisMajorTickVisibility": "hide",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "hide",
    "yAxisMajorTickVisibility": "hide",
    "showXMajorGridLines": false,
    "showYMajorGridLines": false,
    "legendDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

### 12. Split sub-charts — one bar chart per series

When grouped series have wildly different magnitudes (revenue 0–1M,
errors 0–50), split them. Always pair `showSplitSeries: true` with
`showIndependentYRanges: true`.

```json
{
  "type": "splunk.bar",
  "title": "Revenue / orders / errors by region (split)",
  "dataSources": { "primary": "ds_split" },
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FFB627", "#FF2D95"],
    "legendDisplay": "off",
    "yAxisTitleVisibility": "hide",
    "yAxisLabelVisibility": "auto",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

---

## Trellis layout (Splunk 10.0.2503+, untested in test bench)

The 10.0.2503 changelog enables trellis for bar charts; the 10.4
*Trellis layout* page contradicts and says single-value only. Until
verified, prefer **`showSplitSeries: true`** (pattern 12). Options if you
experiment: `splitByLayout`, `trellisSplitBy`, `trellisColumns`,
`trellisMinColumnWidth`, `trellisRowHeight`, `trellisPageCount`,
`trellisBackgroundColor` (see `ds-viz-line` for the shared option table).

---

## Dark + light variants

Same palette remap as the rest of the chart family:

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#0066B3` | Primary cyan / blue |
| `#FF2D95` | `#C62368` | Alert / negative |
| `#FFB627` | `#B36B00` | Warning / amber |
| `#7AA2FF` | `#4A6BD9` | Secondary / steel |
| `#33FF99` | `#1F8C5E` | Positive / green |
| `#B57BFF` | `#7B47CC` | Tertiary / purple |

**Bar-specific palette rule:** filled horizontal bars carry colour over
a wide horizontal band — the eye locks onto saturated colours strongly.
Always remap for light themes.

---

## Gotchas (Splunk 10.2.1)

1. **Axes are flipped.** `xAxis*` is the **value** axis, `yAxis*` is the
   **category** axis. Coming from column, this is the #1 source of
   confusion. The convention table above hides `yAxis*Visibility`, not
   `xAxis*Visibility`.
2. **No `columnGrouping` option.** Bar charts can't draw overlapping
   bars; `stackMode` is your only multi-series layout choice. If you
   need overlay, use `splunk.column`.
3. **No `xAxisLabelRotation`.** Numbers fit horizontally; categories are
   already horizontal — rotation isn't useful.
4. **Annotations are NOT in the option table.** The 10.4 prose may
   mention them, but the option table at line ~5784 doesn't list
   `annotationX / annotationLabel / annotationColor`. **Don't rely on
   annotations on bar charts.** Switch to `splunk.column` (`ds-viz-column`
   pattern 9) if you need them.
5. **Bars render in SPL output order.** Always `| sort - <value>` (or
   `| sort + <value>`) before the `| table`. Random order = unreadable.
6. **Default `stackMode` is `"auto"` = *grouped*, not stacked.** Same as
   column.
7. **Negative values + `stackMode: "stacked"` is undefined.** Use `auto`
   (grouped) and `showXAxisWithZero: true`.
8. **`xAxisScale: "log"` rejects `<= 0`.** Set `xAxisMin: "1"` or
   higher.
9. **`seriesColors` is positional.** A SPL `| eval` reordering swaps
   colours silently. Use `seriesColorsByField`.
10. **`resultLimit` (50 000) drops bars without warning.** For top-N
    work, always limit upstream with `| head 25` or similar.
11. **First column controls the y-axis (category).** If your SPL puts
    the value first, Splunk renders bars-by-value. Always end with
    `| table category value`.

---

## Cross-references

- `ds-pick-viz` — when to use `splunk.bar` vs `splunk.column`,
  `splunk.line`, `splunk.area`.
- `ds-viz-column` — vertical twin (the place where annotations and
  `columnGrouping` live; same option set otherwise).
- `ds-viz-line` — continuous time series (the place where shared options
  like axis tuning, dual axis, splits are documented in detail).
- `ds-viz-area` — sibling for stacked filled trends.
- `ds-design-principles` — colour discipline, when *not* to use a chart.
- `ds-syntax` — JSON envelope, `dataSources`, defaults, Dynamic Options
  Syntax.
- `interactivity/ds-tokens`, `interactivity/ds-drilldown` — wiring
  filters and clicks.
- **`docs/SplunkCloud-10.4.2604-DashStudio.pdf`** — official reference.
  Grep the extracted `.txt` for `^Bar chart options` (line ~5784).

---

## Test bench

| File | Purpose |
|---|---|
| `test-dashboard/dashboard.json` | Dark, 12 panels, exercises every option above. |
| `test-dashboard/dashboard-light.json` | Light, palette-remapped twin of the dark dashboard. |

Deployed in Splunk as:

- `/app/splunk-knowledge-testing/ds_viz_bar_dark`
- `/app/splunk-knowledge-testing/ds_viz_bar_light`
