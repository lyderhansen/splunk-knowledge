# splunk.ellipse — verified patterns

16 patterns rendered and visually QA'd in `ds_viz_ellipse_dark` /
`ds_viz_ellipse_light`.

## 1. Default — theme fill + stroke

```json
{ "viz_default": { "type": "splunk.ellipse" } }
```

Quick placeholder only. **Always set `fillColor` for shipped
dashboards** — defaults differ between dark and light themes.

## 2. Circle — solid fill, transparent stroke

```json
{
  "type": "splunk.ellipse",
  "options": { "fillColor": "#0E7C70", "strokeColor": "transparent" }
}
```

Layout `w == h` for a circle.

## 3. Oval — same options, wide panel

Same options as #2; layout `w != h` (e.g. `w: 460, h: 200`).
Decorative hero shape.

## 4. Half-fade — `fillOpacity: 0.5`

Layered shapes on a coloured canvas.

## 5. Watermark — `fillOpacity: 0.15`

Decorative background blob behind other content.

## 6. Donut outline — transparent fill + branded stroke

```json
{
  "options": {
    "fillColor": "transparent",
    "strokeColor": "#26A69A",
    "strokeWidth": 4,
    "strokeOpacity": 0.6
  }
}
```

## 7. `strokeWidth: 25` (max)

Anything above 25 silently clipped per the PDF.

## 8. Dashed ring — `strokeDashStyle: 6`

Empty-state placeholder.

## 9. Soft KPI surround — `strokeOpacity: 0.4`

```json
{
  "options": {
    "fillColor": "transparent",
    "strokeColor": "#26A69A",
    "strokeOpacity": 0.4,
    "strokeWidth": 3
  }
}
```

## 10. Tiny status dots — 60 × 60 panels

Inline health indicators next to `splunk.markdown` labels.

```json
{ "options": { "fillColor": "#0E7C70", "strokeColor": "transparent" } }
```

## 11. KPI accent ring + singlevalue overlay (canonical)

```json
"structure": [
  { "item": "viz_kpi_ring",  "position": { "x":  20, "y":  20, "w": 280, "h": 280 } },
  { "item": "viz_kpi_value", "position": { "x":  60, "y":  80, "w": 200, "h": 160 } }
]
```

```json
"viz_kpi_ring": {
  "type": "splunk.ellipse",
  "options": {
    "fillColor": "#1A2440",
    "fillOpacity": 0.95,
    "strokeColor": "#26A69A",
    "strokeOpacity": 0.6,
    "strokeWidth": 3
  }
},
"viz_kpi_value": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_uptime" },
  "options": {
    "backgroundColor": "transparent",
    "majorColor": "#26A69A",
    "trendDisplay": "off",
    "sparklineDisplay": "off"
  }
}
```

Z-order follows `structure` array order: earlier = behind, later = in
front.

## 12. DOS `fillColor` + `rangeValue` (low → red)

```json
{
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_health_low" },
  "options": {
    "fillColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)",
    "strokeColor": "transparent"
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

## 13. Same DOS, value 65 (mid → amber)

Verifies disjoint-bucket boundary — value 65 lands in middle bucket,
not first.

## 14. `seriesByType("number")` picker form

```json
"fillColor": "> primary | seriesByType('number') | lastPoint() | rangeValue(thresholds)"
```

Equivalent to `seriesByName('field')` when SPL has only one numeric
column.

## 15. KPI donut with both fill AND stroke DOS-bound

```json
{
  "options": {
    "fillColor":   "> primary | seriesByName('health') | lastPoint() | rangeValue(fillThresholds)",
    "strokeColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(strokeThresholds)",
    "strokeWidth": 4
  },
  "context": {
    "fillThresholds":   [...],
    "strokeThresholds": [...]
  }
}
```

Use different threshold tables to make the ring "hot at the edge"
before the centre flips.

## 16. Token-driven — `$colour_token$`

```json
{
  "options": { "fillColor": "$colour_token$" }
}
```

Pair with an `input.dropdown`:

```json
"input_colour_token": {
  "type": "input.dropdown",
  "title": "Dot colour",
  "options": {
    "token": "colour_token",
    "defaultValue": "#33FF99",
    "items": [
      { "label": "OK",   "value": "#33FF99" },
      { "label": "Warn", "value": "#FFB627" },
      { "label": "Crit", "value": "#FF2D95" }
    ]
  }
}
```

Use for design previews, brand-colour pickers, viewer-pinned overrides.

## Decorative background blob

```json
{
  "type": "splunk.ellipse",
  "options": {
    "fillColor": "#9B5DE5",
    "fillOpacity": 0.12,
    "strokeColor": "transparent"
  }
}
```

Large radius, very low fill opacity. Place behind content. No
performance cost, but layer carefully — too many blobs muddy the
palette.