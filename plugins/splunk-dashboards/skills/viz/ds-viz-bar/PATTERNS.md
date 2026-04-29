# splunk.bar — verified patterns

12 patterns rendered and visually QA'd on Splunk Enterprise 10.2.1 in
`ds_viz_bar_dark`. All patterns assume the data shape:

```spl
... | stats <agg> as <value> by <category>
| sort - <value>
| head 25
| table <category> <value>
```

Always `| sort` and `| table` — bars render in SPL emission order. Random
order is unreadable.

## 1. Minimal — clean defaults

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

## 2. Multi-series grouped — quarters side-by-side

`stackMode: "auto"` is grouped (not stacked).

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

## 3. Stacked — cumulative per row

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

## 4. Stacked 100% — share-of-mix

Each row normalised to 100. Set `xAxisAbbreviation: "off"` so `100`
doesn't print as `100`.

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

## 5. Negative values — diverging around zero

`showXAxisWithZero: true` (the **x-axis** is the value axis on bar
charts) locks zero into the range.

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

## 6. Min / max axis pinning — comparable across panels

```json
{
  "options": {
    "xAxisMin": "0",
    "xAxisMax": "500",
    "xAxisMajorTickInterval": 100,
    "xAxisTitleText": "p95 (ms)",
    "seriesColors": ["#FFB627"],
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## 7. Data labels — value at end of each bar

`dataValuesDisplay: "all"` clean for ≤ 8 rows; `"minmax"` only labels
longest and shortest.

```json
{
  "options": {
    "seriesColors": ["#00D9FF"],
    "dataValuesDisplay": "all",
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## 8. Logarithmic value axis

When the top item is 1000× the bottom item.

```json
{
  "options": {
    "xAxisScale": "log",
    "xAxisMin": "1",
    "seriesColors": ["#7AA2FF"],
    "xAxisTitleText": "Events (log)",
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## 9. Tight bar spacing — packed top-N

Drop `barSpacing` to `1`–`2` so dense top-N feels like a list.

```json
{
  "options": {
    "barSpacing": 2,
    "seriesColors": ["#FF2D95"],
    "xAxisTitleText": "5xx errors",
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## 10. Top-positioned legend — quarters/cohorts

```json
{
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#B57BFF"],
    "legendDisplay": "top",
    "barSpacing": 14,
    "seriesSpacing": 2,
    "xAxisTitleText": "Revenue ($)",
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## 11. Sparkbar — KPI tile (no chrome)

Both `showXMajorGridLines` AND `showYMajorGridLines` must be `false`;
the y-grid defaults to `true` on bar even though it's the category axis.

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

## 12. Split sub-charts — independent value ranges

Always pair `showSplitSeries: true` with `showIndependentYRanges: true`
when series have wildly different magnitudes.

```json
{
  "options": {
    "showSplitSeries": true,
    "showIndependentYRanges": true,
    "seriesColors": ["#00D9FF", "#FFB627", "#FF2D95"],
    "legendDisplay": "off",
    "yAxisTitleVisibility": "hide",
    "yAxisMajorTickVisibility": "hide"
  }
}
```

## Dark / light palette remap

| Dark (neon) | Light (deep) | Role |
|---|---|---|
| `#00D9FF` | `#0066B3` | Primary cyan / blue |
| `#FF2D95` | `#C62368` | Alert / negative |
| `#FFB627` | `#B36B00` | Warning / amber |
| `#7AA2FF` | `#4A6BD9` | Secondary / steel |
| `#33FF99` | `#1F8C5E` | Positive / green |
| `#B57BFF` | `#7B47CC` | Tertiary / purple |

Filled horizontal bars carry colour over a wide horizontal band — the
eye locks onto saturated colours strongly. Always remap for light.
