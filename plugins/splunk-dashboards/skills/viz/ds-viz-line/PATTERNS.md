# splunk.line — verified patterns

12 patterns rendered and visually QA'd on Splunk Enterprise 10.2.1 in
`ds_viz_line_dark`. Data shape:

```spl
... | timechart span=5m count by status
```

Output: `_time` (epoch seconds) + ≥ 1 numeric series.

## 1. Minimal — clean defaults

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

## 2. Multi-series with explicit colours (positional)

```json
{
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

## 3. Named colours — `seriesColorsByField` (refactor-safe)

Use this whenever colours carry meaning.

```json
{
  "options": {
    "seriesColorsByField": {
      "allowed":   "#33FF99",
      "blocked":   "#FF2D95",
      "suspicious":"#FFB627"
    },
    "legendDisplay": "right",
    "yAxisTitleText": "Events",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 4. Dual y-axis — count + latency

`overlayFields` moves the named field to the right axis. Use when units
differ (req/min vs ms).

```json
{
  "options": {
    "overlayFields": "p95_latency_ms",
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Latency (ms)",
    "yAxisTitleText": "Requests/min",
    "seriesColors": ["#00D9FF", "#FF2D95"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 5. Event annotations — secondary data source

Requires a *second* `dataSources.annotation` with three columns:
`_time, annotationLabel, annotationColor`.

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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

Annotation SPL must produce exactly those three columns:

```spl
| makeresults count=3 | streamstats count as i
| eval _time = case(i=1, relative_time(now(), "-21d@d"), ...),
       annotationLabel = case(i=1, "Black Friday", ...),
       annotationColor = case(i=1, "#FF2D95", ...)
| table _time annotationLabel annotationColor
```

## 6. Log scale + null handling

Always pair `yAxisScale: "log"` with `yAxisMin: "1"`. Set
`showYMinorGridLines: false` — log decade ticks emit visible noise.

```json
{
  "options": {
    "yAxisScale": "log",
    "yAxisMin": "1",
    "nullValueDisplay": "connect",
    "showYMinorGridLines": false,
    "seriesColors": ["#7AA2FF", "#FF2D95"],
    "yAxisTitleText": "Events (log)",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 7. Per-field dash styles + value markers

Dashed = derived/predicted, solid = actual, dotted = reference.
`dataValuesDisplay: "minmax"` labels only extremes.

```json
{
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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 8. Split sub-charts — independent y-ranges

Always pair `showSplitSeries: true` with `showIndependentYRanges: true`.

```json
{
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "off",
    "lineWidth": 2,
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 9. Sparkline — KPI-tile pattern (no chrome)

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

## 10. Multi-overlay — 4 fields, mixed axes, mixed dash

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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 11. Dash style reference

`lineDashStyle` accepts 11 values per the 10.4 PDF:

| Value | Look |
|---|---|
| `solid` | unbroken (default) |
| `shortDash` | short dashes |
| `shortDot` | tight dots |
| `shortDashDot` | short dash–dot |
| `shortDashDotDot` | short dash–dot–dot |
| `dot` | small dots, evenly spaced |
| `dash` | medium dashes |
| `longDash` | long dashes |
| `dashDot` | dash–dot–dash repeating |
| `longDashDot` | long dash–dot |
| `longDashDotDot` | long dash–dot–dot |

In practice: `solid`, `dash`, `dot`, `dashDot` cover most needs.

## 12. Dark / light palette remap

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#1F77B4` | Primary cyan / blue |
| `#FF2D95` | `#C2185B` | Alert / negative |
| `#FFB627` | `#E89A2C` | Warning / amber |
| `#7AA2FF` | `#3F6FB7` | Secondary / steel |
| `#33FF99` | `#2E8B57` | Positive / green |
| `#B57BFF` | `#7B49B7` | Tertiary / purple |
