# splunk.timeline — verified patterns

18 patterns rendered and visually QA'd in `ds_viz_timeline_dark`.

## C1. Categorical Timeline — canonical doc reproduction

Full-row-width (`w: 1408` in 1440-grid). 56 events / 7 lanes, status
enum.

```json
{
  "type": "splunk.timeline",
  "title": "Categorical Timeline",
  "dataSources": { "primary": "ds_categorical_lanes" },
  "options": {
    "category":   "> primary | seriesByName('lane')",
    "duration":   "> primary | seriesByName('duration')",
    "dataColors": "> primary | seriesByName('status') | matchValue(dataColorConfig)",
    "dataColorConfig": [
      { "match": "running",       "value": "#7AA2FF" },
      { "match": "degraded",      "value": "#FFB627" },
      { "match": "resolved",      "value": "#33FF99" },
      { "match": "investigating", "value": "#FF6B35" },
      { "match": "queued",        "value": "#7B56DB" }
    ],
    "yAxisLabelWidth": 80,
    "legendDisplay":   "off"
  }
}
```

## C2. Tooltip-enriched

C1 + `additionalTooltipFields: ["foo","bar"]` for audit context.

## C3. Dense SRE host-week

80 events / 5 host lanes, `matchValue` colour by severity.

## C4. User session feed

60 sessions / 8 user lanes, `matchValue` colour by action.

## 1. Default — single lane, circles only

```json
{
  "type": "splunk.timeline",
  "dataSources": { "primary": "ds_basic" }
}
```

## 2. Lanes via `category` DOS

```json
{
  "options": {
    "category": "> primary | seriesByName('category')"
  }
}
```

## 3. `duration` — circles become bars

```json
{
  "options": {
    "category": "> primary | seriesByName('category')",
    "duration": "> primary | seriesByName('duration')"
  }
}
```

## 4. Real intervals — release windows

```json
{
  "options": {
    "category": "> primary | seriesByName('env')",
    "duration": "> primary | seriesByName('duration')",
    "yAxisLabelWidth": 200
  }
}
```

## 5. Numeric heatmap — `rangeValue` (CPU)

```json
{
  "options": {
    "category": "> primary | seriesByName('host')",
    "dataColors": "> primary | seriesByName('cpu_pct') | rangeValue(dataColorConfig)",
    "dataColorConfig": [
      { "to": 30,                "value": "#1F77B4" },
      { "from": 30, "to": 60,    "value": "#FFB627" },
      { "from": 60, "to": 80,    "value": "#FF6B35" },
      { "from": 80,              "value": "#FF2D95" }
    ]
  }
}
```

## 6. Status enum — `matchValue` (deploy R/A/G)

```json
{
  "options": {
    "category": "> primary | seriesByName('feature')",
    "duration": "> primary | seriesByName('duration')",
    "dataColors": "> primary | seriesByName('status') | matchValue(dataColorConfig)",
    "dataColorConfig": [
      { "match": "deployed",    "value": "#33FF99" },
      { "match": "in_progress", "value": "#7AA2FF" },
      { "match": "failed",      "value": "#FF2D95" },
      { "match": "reverted",    "value": "#FFB627" }
    ]
  }
}
```

## 7. CI pipeline — enum colours that follow the run

Same shape as 6, with stage names as `match` keys.

## 8. Tooltip enrichment

```json
{
  "options": {
    "additionalTooltipFields": ["user", "ip", "result"]
  }
}
```

## 9. `legendDisplay: "off"`

```json
{ "options": { "legendDisplay": "off" } }
```

## 10. Bottom legend + truncation

```json
{
  "options": {
    "legendDisplay": "bottom",
    "legendTruncation": "ellipsisMiddle"
  }
}
```

## 11. Wider lane labels

```json
{ "options": { "yAxisLabelWidth": 200 } }
```

## 12. `resultLimit: 6` — first 6 rows

NOT top 6. `| sort _time` upstream first.

```json
{ "options": { "resultLimit": 6 } }
```

## 13. Custom palette

```json
{
  "options": {
    "seriesColors": ["#00D9FF", "#FFB627", "#FF2D95", "#33FF99"]
  }
}
```

## 14. Editorial background tint

```json
{ "options": { "backgroundColor": "#0F1729" } }
```

## 15–18

SOC pattern with full Prisma palette + attack-type lanes; deploy
timeline with three-lane env pattern; dense (40 events stress test);
no title for editorial section element.

## Drilldown

```json
"eventHandlers": [
  {
    "type": "drilldown.customUrl",
    "options": { "url": "/app/myapp/incident_detail?id=$row.label$" }
  }
]
```

## Wildcard rules for `matchValue`

- `*` matches any number of characters.
- Exact matches win first.
- Longer / less-wildcarded patterns win next.
- Ties resolve in declaration order.
