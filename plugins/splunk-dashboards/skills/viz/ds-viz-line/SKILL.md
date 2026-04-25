---
name: ds-viz-line
description: Reference skill for the `splunk.line` visualization in Dashboard Studio (v2). Read when plotting a metric over time as a continuous line — single series, multi-series, dual y-axis, event annotations, log scale, sparkline, or split sub-charts. Triggers on 'splunk.line', 'line chart', 'trend', 'time series', 'sparkline', 'overlay y2', 'annotation on chart'. Verified against Splunk Enterprise 10.2.1.
---

# ds-viz-line — `splunk.line`

`splunk.line` plots one or more numeric series against a continuous x-axis (almost always `_time`). It is the default choice for trend-over-time questions.

> **Tested:** every option pattern in this skill is exercised in the
> companion test dashboard at `test-dashboard/dashboard.json` (and the
> mirrored `dashboard-light.json`). Both are deployed to the
> `splunk-knowledge-testing` Splunk app as `ds_viz_line_dark` and
> `ds_viz_line_light` and visually verified on Splunk 10.2.1.

---

## When to use

- **Use** for ordered, continuous data — typically `_time` on x.
- **Use** when the *trend* (slope, direction, inflection) matters more than the absolute snapshot.
- **Use** for two to ~six series. Above that, switch to `splunk.area` (stacked) or split each series into its own sparkline tile.
- **Don't use** for categorical comparisons → `splunk.column` / `splunk.bar`.
- **Don't use** for distributions or relationships → `splunk.scatter` / `splunk.bubble`.
- **Don't use** for snapshots without trend → `splunk.singlevalue` / `splunk.singlevalueradial`.

See `ds-pick-viz` for the full decision matrix.

---

## Required data shape

One `_time` column plus one or more numeric series.

```spl
... | timechart span=5m count by status
... | bin _time span=1h | stats avg(latency_ms) as latency by _time
| makeresults count=24 | streamstats count as i
| eval _time = relative_time(now(), "-24h") + (i*3600)
| eval requests = round(100 + 30*sin(i/3) + random()%20)
| table _time requests
```

Output must include `_time` (epoch seconds) and at least one numeric field. Fields starting with `_` other than `_time` are not plotted (Splunk treats them as internal).

---

## The time-axis convention (apply to every line panel)

Verified default for time-series line charts. Codified after visual QA on Splunk 10.2.1:

```json
{
  "xAxisTitleVisibility": "hide",
  "xAxisLabelVisibility": "auto",
  "xAxisMajorTickVisibility": "hide"
}
```

| Option | Value | Why |
|---|---|---|
| `xAxisTitleVisibility` | `"hide"` | The literal string `_time` carries zero information — every viewer already knows the x-axis is time. |
| `xAxisLabelVisibility` | `"auto"` | Keep timestamp labels visible. `auto` lets Splunk thin them based on panel width. |
| `xAxisMajorTickVisibility` | `"hide"` | Removes the small vertical tick marks under the axis. They add visual noise without explaining what they tick. |

**Override only when the chart breaks the convention deliberately:**

- Sparkline / KPI tile → hide *everything* (see pattern 9 below).
- A non-time x-axis (rare for `splunk.line`) → set `xAxisTitleText` and let labels show.

---

## Required & common options

`splunk.line` shares most of its options with `splunk.area` / `splunk.column`. The properties listed here are the ones unique to (or critical for) line charts.

| Option | Values | Default | Notes |
|---|---|---|---|
| `lineWidth` | number (px) | `2` | `2.5–3` reads better on dark themes; ≤ `2` for light themes. |
| `lineDashStyle` | `"solid" \| "dash" \| "dot" \| "shortDash" \| "longDash" \| "dashDot"` | `"solid"` | Global dash style. |
| `lineDashStylesByField` | `{ field: dashStyle }` | — | Per-field map. Survives SPL field reorder. **Preferred over `lineDashStyle`**. |
| `markerDisplay` | `"off" \| "filled" \| "outlined"` | `"off"` | Dot at every value. Use sparingly — clutters dense series. |
| `nullValueDisplay` | `"gaps" \| "zero" \| "connect"` | `"gaps"` | `"connect"` bridges nulls (best for sampling gaps). `"zero"` lies — never use for numeric metrics that can legitimately be zero. |
| `dataValuesDisplay` | `"off" \| "all" \| "minmax"` | `"off"` | `"minmax"` is the only readable option for ≥ 10 data points. |
| `legendMode` | `"standard" \| "seriesCompare"` | `"standard"` | `seriesCompare` highlights all series on hover — useful with 4+ series. |
| `resultLimit` | number | `50000` | Hard cap. If you hit it, aggregate in SPL. |

**Color & series binding** (shared with all charts):

| Option | Notes |
|---|---|
| `seriesColors` | Positional array. Order in SPL output = order in array. Brittle if you reorder fields. |
| `seriesColorsByField` | `{ "allowed": "#33FF99", "blocked": "#FF2D95" }`. **Preferred** — semantic, refactor-safe. |

**Dual y-axis** (shared `[OVERLAY]`):

| Option | Notes |
|---|---|
| `overlayFields` | Field name(s) to overlay. Accepts string or array. |
| `showOverlayY2Axis` | `true` to render a right y-axis with its own scale. |
| `y2AxisTitleText` | Right-axis title. Always set when `showOverlayY2Axis: true`. |

**Annotations** (shared `[ANNOTATIONS]`):

Requires a *second* dataSource keyed `annotation` on the visualization, with three fields: `_time`, `annotationLabel`, `annotationColor`.

| Option | Notes |
|---|---|
| `annotationX` | DOS expression: `"> annotation \| seriesByName('_time')"` |
| `annotationLabel` | DOS expression: `"> annotation \| seriesByName('annotationLabel')"` |
| `annotationColor` | DOS expression: `"> annotation \| seriesByName('annotationColor')"` |

**Split sub-charts** (shared `[SPLIT]`):

| Option | Notes |
|---|---|
| `showSplitSeries` | `true` stacks each series in its own panel-within-panel. |
| `showIndependentYRanges` | `true` gives each split series its own y-range. Almost always desired with `showSplitSeries`. |

For the full shared option list (axes, gridlines, ticks, legend, datasource binding) see `ds-viz` (legacy reference) or the per-group skills in `interactivity/`.

---

## Twelve verified patterns

The test dashboard exercises one option group per panel. Copy a pattern, change the dataSource, ship.

### 1. Minimal — clean defaults applied

The recommended baseline for every time-series line panel.

```json
{
  "type": "splunk.line",
  "title": "Requests per hour",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 2. Multi-series with explicit colors (positional)

```json
{
  "type": "splunk.line",
  "title": "Requests by region",
  "dataSources": { "primary": "ds_multiseries" },
  "options": {
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "lineWidth": 2,
    "legendDisplay": "bottom",
    "yAxisTitleText": "Requests / sec",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 3. Named colors (refactor-safe) — `seriesColorsByField`

Use this whenever colors carry meaning (allowed=green, blocked=red).

```json
{
  "type": "splunk.line",
  "title": "Allowed / blocked / suspicious",
  "dataSources": { "primary": "ds_byfield" },
  "options": {
    "seriesColorsByField": {
      "allowed":   "#33FF99",
      "blocked":   "#FF2D95",
      "suspicious":"#FFB627"
    },
    "legendDisplay": "right",
    "yAxisTitleText": "Events",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 4. Dual y-axis — count + latency on one chart

`overlayFields` moves the named field to the right axis. Use when units differ (req/min vs ms).

```json
{
  "type": "splunk.line",
  "title": "Throughput vs p95 latency",
  "dataSources": { "primary": "ds_dualaxis" },
  "options": {
    "overlayFields": "p95_latency_ms",
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Latency (ms)",
    "yAxisTitleText": "Requests/min",
    "seriesColors": ["#00D9FF", "#FF2D95"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 5. Event annotations — secondary `annotation` dataSource

Annotations come from a *separate* dataSource with three required fields. Bind them with DOS expressions.

```json
{
  "type": "splunk.line",
  "title": "Daily revenue (Black Friday → Boxing Day)",
  "dataSources": {
    "primary":    "ds_annotations_data",
    "annotation": "ds_annotations_marks"
  },
  "options": {
    "seriesColors": ["#7AA2FF"],
    "lineWidth": 2,
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

The annotation SPL must produce exactly those three columns:

```spl
| makeresults count=3 | streamstats count as i
| eval _time = case(i=1, relative_time(now(), "-21d@d"), ...),
       annotationLabel = case(i=1, "Black Friday", ...),
       annotationColor = case(i=1, "#FF2D95", ...)
| table _time annotationLabel annotationColor
```

### 6. Log scale + null handling

`yAxisScale: "log"` compresses orders of magnitude. **Always set `showYMinorGridLines: false`** on log axes — Splunk's default emits one gridline per log decade tick which produces visible noise.

```json
{
  "type": "splunk.line",
  "title": "Traffic vs errors (log)",
  "dataSources": { "primary": "ds_log_nulls" },
  "options": {
    "yAxisScale": "log",
    "yAxisMin": "1",
    "nullValueDisplay": "connect",
    "showYMinorGridLines": false,
    "seriesColors": ["#7AA2FF", "#FF2D95"],
    "lineWidth": 2,
    "yAxisTitleText": "Events (log)",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 7. Per-field dash styles + value markers

Dashed = derived/predicted, solid = actual, dotted = reference. `dataValuesDisplay: "minmax"` labels only the extremes.

```json
{
  "type": "splunk.line",
  "title": "Target vs actual vs forecast",
  "dataSources": { "primary": "ds_dashstyles" },
  "options": {
    "lineDashStylesByField": {
      "target":   "dot",
      "forecast": "dash",
      "actual":   "solid"
    },
    "seriesColorsByField": {
      "target":   "#7AA2FF",
      "actual":   "#33FF99",
      "forecast": "#FFB627"
    },
    "markerDisplay": "filled",
    "lineWidth": 2,
    "legendDisplay": "bottom",
    "dataValuesDisplay": "minmax",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 8. Split sub-charts — independent y-ranges

Use when series have wildly different scales (cpu_pct vs disk_iops vs memory_gb). Always pair `showSplitSeries: true` with `showIndependentYRanges: true`.

```json
{
  "type": "splunk.line",
  "title": "Host telemetry",
  "dataSources": { "primary": "ds_split" },
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "off",
    "lineWidth": 2,
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 9. Sparkline (hidden chrome) — KPI-tile pattern

Strip every axis, label, gridline, and legend. The line becomes pure shape. Use *inside* a KPI card or executive cell.

```json
{
  "type": "splunk.line",
  "dataSources": { "primary": "ds_minimal" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "lineWidth": 2.5,
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

This is the **only** pattern where you also hide `xAxisLabelVisibility`. Title hiding still applies.

### 10. Multi-overlay — 4 fields, mixed axes, mixed dash

Two latency fields go to y2; two utilization fields stay on y. Combine `seriesColorsByField` + `lineDashStylesByField` for full control.

```json
{
  "options": {
    "overlayFields": ["latency_p50", "latency_p95"],
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Latency (ms)",
    "yAxisTitleText": "Utilization (%)",
    "seriesColorsByField": {
      "cpu_pct":     "#00D9FF",
      "memory_pct":  "#7AA2FF",
      "latency_p50": "#FFB627",
      "latency_p95": "#FF2D95"
    },
    "lineDashStylesByField": {
      "latency_p50": "dash",
      "latency_p95": "solid",
      "cpu_pct":     "solid",
      "memory_pct":  "dot"
    },
    "lineWidth": 2,
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

### 11. All six dash styles — visual reference

Every supported `lineDashStyle` value side by side. Use this panel as the lookup when picking a dash.

| Value | Look |
|---|---|
| `solid` | unbroken line (default) |
| `dash`  | medium dashes |
| `dot`   | small dots, evenly spaced |
| `shortDash` | shorter dashes |
| `longDash`  | long dashes |
| `dashDot`   | dash–dot–dash repeating |

### 12. Smart axis — recommended baseline (codified)

This is the convention — the same as pattern 1, restated as a target.

```json
{
  "options": {
    "lineWidth": 2,
    "yAxisTitleText": "Signal level",
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

---

## Dark + light variants

Build every line panel for both themes. The test bench ships paired files:

- `test-dashboard/dashboard.json` — neon high-saturation palette (dark theme)
- `test-dashboard/dashboard-light.json` — deeper print-friendly palette (light theme)

The light variant is generated by remapping the dark palette:

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#1F77B4` | Primary cyan / blue |
| `#FF2D95` | `#C2185B` | Alert / negative |
| `#FFB627` | `#E89A2C` | Warning / amber |
| `#7AA2FF` | `#3F6FB7` | Secondary / steel |
| `#33FF99` | `#2E8B57` | Positive / green |
| `#B57BFF` | `#7B49B7` | Tertiary / purple |

Rule: never put a neon color (>90% saturation) on a light background — it vibrates. Never put a deep desaturated color on a dark background — it disappears.

When the dashboard envelope sets `theme: "dark"` Splunk inverts panel chrome automatically; only the *series* colors need remapping.

---

## Gotchas (Splunk 10.2.1)

1. **`stackMode` does NOT exist on `splunk.line`.** It belongs to `splunk.area` / `splunk.column` / `splunk.bar`. If you want a stacked time chart, switch to `splunk.area` (`ds-viz-area`).
2. **`xAxisLabelRotation` is allowed but rarely useful** on a time axis — Splunk's default thinning works better. Use rotation only on `splunk.column` with long category labels.
3. **Annotations need a *second* dataSource keyed `annotation`** on the visualization. Without it, the `annotationX` / `annotationLabel` / `annotationColor` expressions return null and no marks render.
4. **`yAxisScale: "log"` rejects values ≤ 0.** Set `yAxisMin: "1"` (or higher) explicitly, otherwise series with zero values vanish.
5. **`nullValueDisplay: "zero"` is almost always wrong.** It conflates "no data" with "the metric was zero". Use `"gaps"` (default) or `"connect"`.
6. **`seriesColors` is positional and brittle.** A SPL change that reorders fields silently swaps your colors. Use `seriesColorsByField`.
7. **`resultLimit` is a hard cap (50 000 rows).** Beyond that, points are dropped without warning. Aggregate upstream with `| timechart span=...`.
8. **Field names starting with `_` (other than `_time`) are not plotted.** If a series disappears, check it isn't named `_anything`.

---

## Cross-references

- `ds-pick-viz` — when to use `splunk.line` vs `splunk.area`, `splunk.column`, `splunk.scatter`.
- `ds-design-principles` — color discipline, hierarchy, when *not* to use a chart at all.
- `ds-syntax` — JSON envelope, `dataSources`, defaults, Dynamic Options Syntax.
- `ds-viz-area` — sibling for filled / stacked / cumulative time series.
- `ds-viz-column` — sibling for categorical (non-time) bars.
- `interactivity/ds-tokens`, `interactivity/ds-drilldown` — making the chart respond to filters and clicks.

---

## Test bench

| File | Purpose |
|---|---|
| `test-dashboard/dashboard.json` | Dark, 12 panels, exercises every option above. |
| `test-dashboard/dashboard-light.json` | Light, palette-remapped twin of the dark dashboard. |

Deployed in Splunk as:

- `/app/splunk-knowledge-testing/ds_viz_line_dark`
- `/app/splunk-knowledge-testing/ds_viz_line_light`

Re-deploy after editing:

```bash
python3 splunk-skills/scripts/validate_dashboard.py \
  plugins/splunk-dashboards/skills/viz/ds-viz-line/test-dashboard/dashboard.json
# then call splunk_create_dashboard via the user-splunk-CUSTOM MCP server
```
