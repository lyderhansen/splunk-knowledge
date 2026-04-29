# splunk.column — verified patterns

12 patterns rendered and visually QA'd on Splunk Enterprise 10.2.1 in
`ds_viz_column_dark`. Data shape is statistics-table:

```spl
... | timechart span=1d count by host
... | stats sum(revenue) as revenue by region
| table region revenue
```

First column = x-axis category (or `_time`). Remaining columns = y-axis
values per series.

## 1. Minimal — single series, clean defaults

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

## 2. Multi-series grouped

`stackMode: "auto"` is grouped (default).

```json
{
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "columnSpacing": 12,
    "seriesSpacing": 2,
    "legendDisplay": "bottom",
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 3. Stacked — cumulative

```json
{
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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 4. Stacked 100% — share

```json
{
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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 5. Overlay — target vs actual

`columnGrouping: "overlay"` draws series on top of each other. Stacking
is silently ignored when overlay is set.

```json
{
  "options": {
    "columnGrouping": "overlay",
    "seriesColorsByField": {
      "target": "#7AA2FF",
      "actual": "#00D9FF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Revenue ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 6. Negative values — diverging around zero

`showYAxisWithZero: true` locks `0` into the range.

```json
{
  "options": {
    "showYAxisWithZero": true,
    "seriesColors": ["#FF2D95"],
    "yAxisTitleText": "Variance ($)",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 7. Min / max axis pinning

```json
{
  "options": {
    "yAxisMin": "0",
    "yAxisMax": "500",
    "yAxisMajorTickInterval": 100,
    "yAxisTitleText": "p95 (ms)",
    "seriesColors": ["#FFB627"],
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 8. Rotated x-axis labels

`xAxisLabelRotation` accepts `-90 | -45 | 0 | 45 | 90` only. `-45` is
the most readable non-zero value.

```json
{
  "options": {
    "xAxisLabelRotation": -45,
    "seriesColors": ["#FF2D95"],
    "yAxisTitleText": "Errors / hour",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 9. Annotations — secondary data source

Available on column (NOT on bar). Second `dataSources.annotation` keyed
with `_time, annotationLabel, annotationColor`.

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
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 10. Dual y-axis — count + average

```json
{
  "options": {
    "overlayFields": "avg_order_value",
    "showOverlayY2Axis": true,
    "y2AxisTitleText": "Avg order value ($)",
    "yAxisTitleText": "Orders",
    "seriesColors": ["#00D9FF", "#FFB627"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 11. Sparkbar — KPI tile (no chrome)

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

## 12. Split sub-charts — independent y-ranges

Always pair `showSplitSeries: true` with `showIndependentYRanges: true`.

```json
{
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## Dark / light palette remap


| Dark (neon) | Light (deep) | Role                |
| ----------- | ------------ | ------------------- |
| `#00D9FF`   | `#0066B3`    | Primary cyan / blue |
| `#FF2D95`   | `#C62368`    | Alert / negative    |
| `#FFB627`   | `#B36B00`    | Warning / amber     |
| `#7AA2FF`   | `#4A6BD9`    | Secondary / steel   |
| `#33FF99`   | `#1F8C5E`    | Positive / green    |
| `#B57BFF`   | `#7B47CC`    | Tertiary / purple   |


Filled bars cover more area than line strokes — always remap for light.