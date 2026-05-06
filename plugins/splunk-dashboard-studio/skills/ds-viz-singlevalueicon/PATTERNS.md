# splunk.singlevalueicon — verified patterns

12 patterns rendered and visually QA'd in
`ds_viz_singlevalueicon_dark`. Replace
`splunk-enterprise-kvstore://...` URLs with ones from your own
instance's icon picker.

## 1. Default icon + value

```json
{
  "options": {
    "icon": "default",
    "underLabel": "Revenue (24h)",
    "unit": "$",
    "unitPosition": "before",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent"
  }
}
```

## 2. Uploaded kvstore icon

```json
{
  "options": {
    "icon": "splunk-enterprise-kvstore://icon-check__<UUID>.svg",
    "iconColor": "#33FF99",
    "underLabel": "Conversion rate",
    "unit": "%",
    "unitPosition": "after",
    "numberPrecision": 2,
    "trendDisplay": "percent"
  }
}
```

## 3. `iconPosition: "after"`

```json
{ "options": { "icon": "default", "iconPosition": "after" } }
```

## 4. Icon-only — `showValue: false`

```json
{
  "options": {
    "icon": "splunk-enterprise-kvstore://icon-check__<UUID>.svg",
    "iconColor": "#7AA2FF",
    "showValue": false
  }
}
```

## 5. Dynamic `iconColor` — RAG status

```json
{
  "options": {
    "icon": "default",
    "underLabel": "System health",
    "unit": "/100",
    "unitPosition": "after",
    "trendDisplay": "absolute",
    "iconColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)"
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

Disjoint, gap-free buckets. Verify with demo values per bucket.

## 6. SOC pattern — calm icon, alerting number

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#7AA2FF",
    "underLabel": "Errors / hour",
    "trendDisplay": "absolute",
    "majorColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(majorThresholds)"
  },
  "context": {
    "majorThresholds": [
      { "to": 10,             "value": "#33FF99" },
      { "from": 10, "to": 20, "value": "#FFB627" },
      { "from": 20,           "value": "#FF2D95" }
    ]
  }
}
```

## 7. Muted icon — `iconOpacity: 0.3`

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#7AA2FF",
    "iconOpacity": 0.3,
    "underLabel": "Conversion rate",
    "unit": "%",
    "unitPosition": "after",
    "trendDisplay": "percent"
  }
}
```

## 8. Static KPI — `trendDisplay: "off"`

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#33FF99",
    "underLabel": "Orders today",
    "trendDisplay": "off"
  }
}
```

## 9. `majorFontSize: 56` — locked size for KPI strip

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#7AA2FF",
    "underLabel": "MRR",
    "unit": "$",
    "shouldAbbreviateTrendValue": true,
    "trendDisplay": "percent",
    "majorFontSize": 56
  }
}
```

## 10. Whole-tile flips — `backgroundColor` dynamic

Lock `iconColor` AND `majorColor` to high-contrast values so tile
stays readable.

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#FFFFFF",
    "majorColor": "#FFFFFF",
    "underLabel": "Errors / hour",
    "trendDisplay": "absolute",
    "backgroundColor": "> primary | seriesByName('errors') | lastPoint() | rangeValue(bgThresholds)"
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

Use sparingly — flashing-tile walls lose signal.

## 11. `shouldUseThousandSeparators: false` — IDs

```json
{
  "options": {
    "icon": "default",
    "iconColor": "#7AA2FF",
    "underLabel": "Build ID",
    "shouldUseThousandSeparators": false,
    "trendDisplay": "off"
  }
}
```

## 12. Compact KPI strip — transparent + after

```json
{
  "options": {
    "backgroundColor": "transparent",
    "icon": "default",
    "iconColor": "#33FF99",
    "iconPosition": "after",
    "underLabel": "Conv. rate",
    "unit": "%",
    "unitPosition": "after",
    "majorFontSize": 32,
    "trendDisplay": "off"
  }
}
```
