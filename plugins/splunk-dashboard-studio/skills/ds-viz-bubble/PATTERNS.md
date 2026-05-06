# splunk.bubble — verified patterns

13 patterns rendered and visually QA'd in `ds_viz_bubble_dark`.

## 1. Default — x/y/size from cols 0/1/2

```json
{ "type": "splunk.bubble", "dataSources": { "primary": "ds_basic" } }
```

Splunk binds `seriesByIndex(0|1|2|3)` automatically. **Use `| table`**
to lock SPL column order.

## 2. Explicit bindings by name (recommended)

```json
{
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "size": "> primary | seriesByName('requests')"
  }
}
```

## 3. Four-dim with category colour

```json
{
  "options": {
    "x": "> primary | seriesByName('throughput')",
    "y": "> primary | seriesByName('latency')",
    "size": "> primary | seriesByName('requests')",
    "category": "> primary | seriesByName('service')"
  }
}
```

## 4. Larger headline bubbles

```json
{ "options": { "bubbleSizeMax": 100 } }
```

## 5. Compressed range — tight clusters

```json
{ "options": { "bubbleSizeMin": 4, "bubbleSizeMax": 20 } }
```

## 6. Honest vs exaggerated sizing

```json
{ "options": { "bubbleSizeMethod": "area" } }      // honest (default)
{ "options": { "bubbleSizeMethod": "diameter" } }  // exaggerated
```

## 7. Custom palette

```json
{
  "options": {
    "seriesColors": ["#00D9FF", "#7AA2FF", "#FFB627", "#FF2D95"]
  }
}
```

## 8. Lock colour to category value

```json
{
  "options": {
    "seriesColorsByField": {
      "api":      "#7AA2FF",
      "database": "#FFB627",
      "frontend": "#00D9FF"
    }
  }
}
```

## 9. Log y — orders-of-magnitude latency

```json
{
  "options": {
    "yAxisScale": "log",
    "yAxisMin": "1",
    "yAxisTitleText": "Latency (ms, log)"
  }
}
```

## 10. Stripped editorial style

```json
{
  "options": {
    "xAxisTitleVisibility": "hide",
    "yAxisTitleVisibility": "hide",
    "xAxisLineVisibility": "hide",
    "yAxisLineVisibility": "hide",
    "showYMajorGridLines": false,
    "legendDisplay": "off",
    "backgroundColor": "transparent"
  }
}
```

## 11. Legend bottom + truncation

```json
{
  "options": {
    "legendDisplay": "bottom",
    "legendTruncation": "ellipsisMiddle"
  }
}
```

## 12. Canonical PDF example

```spl
index=_internal sourcetype=splunkd_access
| stats count sum(bytes) AS total_bytes by status, date_hour
| table date_hour count total_bytes status
```

```json
{
  "options": {
    "x": "> primary | seriesByName('date_hour')",
    "y": "> primary | seriesByName('count')",
    "size": "> primary | seriesByName('total_bytes')",
    "category": "> primary | seriesByName('status')"
  }
}
```

## 13. Branded panel tint

```json
{
  "options": {
    "backgroundColor": "#0F1729",
    "seriesColors": ["#00D9FF", "#7AA2FF", "#FFB627"]
  }
}
```

## Drilldown

```json
"eventHandlers": [
  {
    "type": "drilldown.customUrl",
    "options": { "url": "/app/myapp/service?name=$row.service$" }
  }
]
```

`row.<field>.value` exposes any field from the clicked row.
