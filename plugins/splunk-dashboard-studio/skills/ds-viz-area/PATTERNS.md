# splunk.area — verified patterns

12 patterns rendered and visually QA'd on Splunk Enterprise 10.2.1 in
`ds_viz_area_dark`. Data shape:

```spl
| timechart span=5m sum(bytes) as bytes by tier
```

Output: `_time` + ≥ 1 non-negative numeric series.

## 1. Minimal — single series

```json
{
  "type": "splunk.area",
  "title": "Total requests",
  "dataSources": { "primary": "ds_basic" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "areaOpacity": 0.5,
    "yAxisTitleText": "Requests / sec",
    "xAxisTitleVisibility": "hide",
    "xAxisLabelVisibility": "auto",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 2. Stacked — 3 tiers

```json
{
  "options": {
    "stackMode": "stacked",
    "areaOpacity": 0.85,
    "seriesColorsByField": {
      "frontend": "#00D9FF",
      "backend":  "#7AA2FF",
      "database": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Requests/sec",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 3. Stacked 100% — share-of-traffic

```json
{
  "options": {
    "stackMode": "stacked100",
    "areaOpacity": 0.85,
    "seriesColorsByField": {
      "frontend": "#00D9FF",
      "backend":  "#7AA2FF",
      "database": "#B57BFF"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Mix (%)",
    "yAxisAbbreviation": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 4. Stream graph — `showLines: false`

```json
{
  "options": {
    "stackMode": "stacked",
    "showLines": false,
    "areaOpacity": 0.95,
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF", "#FFB627"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 5. Unstacked overlap — comparison view

`stackMode: "auto"` is unstacked. Drop `areaOpacity` so regions blend.

```json
{
  "options": {
    "stackMode": "auto",
    "areaOpacity": 0.4,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 6. Allow / block stacked — security

```json
{
  "options": {
    "stackMode": "stacked",
    "areaOpacity": 0.85,
    "seriesColorsByField": {
      "allowed": "#33FF99",
      "blocked": "#FF2D95"
    },
    "legendDisplay": "bottom",
    "yAxisTitleText": "Requests/sec",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 7. Min/max axis pinning

```json
{
  "options": {
    "stackMode": "stacked",
    "yAxisMin": "0",
    "yAxisMax": "1000",
    "yAxisMajorTickInterval": 200,
    "yAxisTitleText": "Requests/sec (pinned)",
    "areaOpacity": 0.85,
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 8. Log scale

```json
{
  "options": {
    "yAxisScale": "log",
    "yAxisMin": "1",
    "showYMinorGridLines": false,
    "areaOpacity": 0.5,
    "seriesColors": ["#7AA2FF", "#FF2D95"],
    "legendDisplay": "bottom",
    "yAxisTitleText": "Events (log)",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 9. Connect nulls — sampling gaps

```json
{
  "options": {
    "stackMode": "stacked",
    "areaOpacity": 0.85,
    "nullValueDisplay": "connect",
    "seriesColors": ["#00D9FF", "#7AA2FF"],
    "legendDisplay": "bottom",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 10. Sparkarea — KPI tile (no chrome)

```json
{
  "type": "splunk.area",
  "dataSources": { "primary": "ds_minimal" },
  "options": {
    "seriesColors": ["#00D9FF"],
    "areaOpacity": 0.5,
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

## 11. Split sub-charts — independent y-ranges

```json
{
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "areaOpacity": 0.5,
    "seriesColors": ["#00D9FF", "#FF2D95", "#FFB627"],
    "legendDisplay": "off",
    "xAxisTitleVisibility": "hide",
    "xAxisMajorTickVisibility": "hide"
  }
}
```

## 12. Dark / light palette remap

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#1F77B4` | Primary cyan / blue |
| `#FF2D95` | `#C2185B` | Alert / negative |
| `#FFB627` | `#E89A2C` | Warning / amber |
| `#7AA2FF` | `#3F6FB7` | Secondary / steel |
| `#33FF99` | `#2E8B57` | Positive / green |
| `#B57BFF` | `#7B49B7` | Tertiary / purple |

Filled areas cover more pixels than line strokes — neon on light is
even worse than on lines. Always remap.
