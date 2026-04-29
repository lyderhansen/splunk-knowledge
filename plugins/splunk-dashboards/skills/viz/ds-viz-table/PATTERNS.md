# splunk.table — verified patterns

12 patterns rendered and visually QA'd in `ds_viz_table_dark`.

## 1. Default — no options

```json
{ "type": "splunk.table", "dataSources": { "primary": "ds_basic" } }
```

## 2. Pagination + fixed header + row numbers

```json
{
  "options": {
    "count": 3,
    "headerVisibility": "fixed",
    "showRowNumbers": true
  }
}
```

## 3. Hide internal fields

```json
{ "options": { "showInternalFields": false } }
```

`_time` is exempt — strip it in SPL with `| fields - _time` if needed.

## 4. Monospace small

```json
{ "options": { "font": "monospace", "fontSize": "small" } }
```

## 5. Per-column align + width

```json
{
  "options": {
    "columnFormat": {
      "host":  { "width": 140, "align": "left" },
      "cpu":   { "width": 80,  "align": "right" }
    }
  }
}
```

## 6. Static header colours

```json
{
  "options": {
    "tableFormat": {
      "headerBackgroundColor": "#1A2447",
      "headerColor": "#FFFFFF"
    }
  }
}
```

Skip if you want theme-tracking headers.

## 7. Heatmap rows — `_color_rank` + `rangeValue` (canonical recipe)

```spl
| makeresults count=5
| streamstats count AS rn
| eval severity = case(rn==1,"critical", rn==2,"high", 1==1,"info")
| eval _color_rank = case(severity=="critical",1, severity=="high",2, 1==1,5)
| table service severity errors_per_min _color_rank
```

```json
{
  "options": {
    "showInternalFields": false,
    "tableFormat": {
      "rowBackgroundColors": "> table | seriesByName('_color_rank') | rangeValue(rowBg)",
      "rowColors":           "> table | seriesByName('_color_rank') | rangeValue(rowFg)"
    }
  },
  "context": {
    "rowBg": [
      { "to": 1.5,             "value": "#4a1722" },
      { "from": 1.5, "to": 2.5,"value": "#4a2d17" },
      { "from": 2.5, "to": 3.5,"value": "#45391a" },
      { "from": 3.5, "to": 4.5,"value": "#173d2b" },
      { "from": 4.5,           "value": "#151B3A" }
    ],
    "rowFg": [
      { "to": 4.5,   "value": "#FFFFFF" },
      { "from": 4.5, "value": "#A8A8B3" }
    ]
  }
}
```

Three rules: **half-step thresholds**, `**showInternalFields: false`**,
pair `rowBackgroundColors` and `rowColors` for contrast.

## 8a. Sparkline per-row by index — `tableFormat.sparklineColors` + DOS `pick()`

```json
{
  "options": {
    "tableFormat": {
      "sparklineColors": "> table | pick(trendSparklineColors)",
      "sparklineTypes":  "> table | pick(trendSparklineTypes)"
    }
  },
  "context": {
    "trendSparklineColors": ["#33FF99", "#7AA2FF", "#FFB627", "#FF2D95"],
    "trendSparklineTypes":  ["area",    "line",    "area",    "line"]
  }
}
```

Row 0 → colour 0, row 1 → colour 1, … (cycles back if array shorter
than row count). **All sparkline columns in same row share same colour.**

## 8b. Sparkline per-column — `columnFormat.<col>.sparklineColors`

```json
{
  "options": {
    "columnFormat": {
      "trend_cpu": { "sparklineColors": ["#33FF99"], "sparklineTypes": ["area"], "width": 220 },
      "trend_mem": { "sparklineColors": ["#7AA2FF"], "sparklineTypes": ["line"], "width": 220 },
      "trend_req": { "sparklineColors": ["#FFB627"], "sparklineTypes": ["area"], "width": 220 },
      "trend_err": { "sparklineColors": ["#FF2D95"], "sparklineTypes": ["line"], "width": 220 }
    }
  }
}
```

Single-element `["#hex"]` per sparkline column. **Only** way to get
per-column colouring. `tableFormat.sparklineColors` cannot do it.

## 8c. Sparkline per-row by threshold — heatmap-strokes pattern

```json
{
  "options": {
    "tableFormat": {
      "sparklineColors": "> table | seriesByName('current_cpu') | rangeValue(cpuBands)",
      "sparklineTypes":  "> table | seriesByName('current_cpu') | rangeValue(cpuTypes)"
    }
  },
  "context": {
    "cpuBands": [
      { "to": 50,             "value": "#33FF99" },
      { "from": 50, "to": 70, "value": "#FFD060" },
      { "from": 70, "to": 90, "value": "#FFB627" },
      { "from": 90,           "value": "#FF6B6B" }
    ],
    "cpuTypes": [
      { "to": 70,   "value": "line" },
      { "from": 70, "value": "area" }
    ]
  }
}
```

Same expression shape as panel 7's row-tinting heatmap, applied to
sparkline strokes.

## 9. Stripped-down KPI table

```json
{
  "options": {
    "count": 1,
    "headerVisibility": "none",
    "fontSize": "large"
  }
}
```

## 10. Cell-area tint

```json
{
  "options": {
    "backgroundColor": "#0F1729",
    "tableFormat": {
      "headerBackgroundColor": "#1A2447",
      "headerColor": "#FFFFFF"
    }
  }
}
```

## 11. Executive-readable

```json
{
  "options": {
    "fontSize": "large",
    "headerVisibility": "fixed"
  }
}
```

## 12. Type-driven align

```json
{
  "options": {
    "tableFormat": {
      "align": "> table | type() | matchValue(alignByType)"
    }
  },
  "context": {
    "alignByType": [
      { "match": "number", "value": "right" },
      { "match": "string", "value": "left" }
    ]
  }
}
```

