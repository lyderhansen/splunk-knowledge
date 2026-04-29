# splunk.singlevalue — verified patterns

12 patterns rendered and visually QA'd in `ds_viz_singlevalue_dark`.

## 1. Minimal — all defaults

```json
{
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_revenue_trend" },
  "options": {}
}
```

`majorValue` = `lastPoint()`, `trendValue` = `delta(-2)`, sparkline
below, absolute trend.

## 2. Percentage default

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

## 3. Currency default

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

## 4. Static KPI — no time dimension

```json
{
  "options": {
    "underLabel": "Orders today",
    "trendDisplay": "off",
    "sparklineDisplay": "off"
  }
}
```

## 5. Dynamic `majorColor` — RAG thresholds

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

Disjoint, gap-free buckets. **Verify with demo values 20, 60, 95** —
overlapping thresholds silently break (see GOTCHAS.md #3).

## 6. Dynamic `backgroundColor` — whole tile flips

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

Lock `majorColor: "#FFFFFF"` (dark theme) so headline stays readable.

## 7. Sparkline area + tooltip

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

## 8. Sparkline before — chart above number

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

## 9. Sparkline after — horizontal KPI strip

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

## 10. Highlight dots + segments — fade-to-now

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

## 11. High precision — 4 decimals, no separators

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

## 12. Chrome-stripped — overlay on rectangle/icon

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
