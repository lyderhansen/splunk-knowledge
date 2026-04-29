# splunk.rectangle — verified patterns

20 patterns rendered and visually QA'd in `ds_viz_rectangle_dark` /
`ds_viz_rectangle_light`.

## 1. Default — theme defaults

```json
{ "type": "splunk.rectangle" }
```

Quick placeholder. **Always set `fillColor` for shipped dashboards.**

## 2. Custom fill, transparent stroke

```json
{ "options": { "fillColor": "#1A2440", "strokeColor": "transparent" } }
```

## 3. `fillOpacity: 1` (baseline)

## 4. Half-fade — `fillOpacity: 0.5`

Layered cards on coloured canvas.

## 5. Watermark — `fillOpacity: 0.15`

Very subtle row stripes, decorative backgrounds.

## 6. Subtle rounded card — `rx: 8`

```json
{
  "options": {
    "fillColor": "#1A2440",
    "fillOpacity": 0.95,
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

KPI cards, section backgrounds.

## 7. Pill / chip — `rx: 50` (or `rx >= h/2`)

```json
{
  "options": {
    "fillColor": "#E8F5E9",
    "strokeColor": "#0E7C70",
    "strokeWidth": 1,
    "rx": 50
  }
}
```

Status badges. Pair with `splunk.markdown` on top for label text.

## 8. Outlined card — transparent fill + branded stroke

```json
{
  "options": {
    "fillColor": "transparent",
    "strokeColor": "#26A69A",
    "strokeWidth": 2,
    "rx": 6
  }
}
```

## 9. `strokeWidth: 25` (max)

Demo of upper bound. Anything above silently capped.

## 10. Dashed empty-slot — `strokeDashStyle: 6`

```json
{
  "options": {
    "fillColor": "transparent",
    "strokeColor": "#C3CBD4",
    "strokeWidth": 2,
    "strokeDashStyle": 6,
    "rx": 4
  }
}
```

## 11. `strokeJoinStyle: round`

Soft-cornered outlines. Visible only at large `strokeWidth` (≥ 8) AND
`rx: 0` (curved corners hide the join style).

## 12. `strokeJoinStyle: miter` (default)

Sharp-cornered outlines.

## 13. `strokeOpacity: 0.4`

Soft accent border without fading the fill.

## 14. KPI card pattern (rectangle + singlevalue overlay)

```json
"structure": [
  { "item": "viz_card_background", "position": { "x": 20, "y": 20, "w": 320, "h": 160 } },
  { "item": "viz_card_kpi",        "position": { "x": 40, "y": 50, "w": 280, "h": 100 } }
]
```

```json
"viz_card_background": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#1A2440",
    "fillOpacity": 0.95,
    "strokeColor": "transparent",
    "rx": 8
  }
},
"viz_card_kpi": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_uptime" },
  "options": { "backgroundColor": "transparent", "trendDisplay": "off" }
}
```

## 15. DOS `fillColor` + `rangeValue` (low → red)

```json
{
  "type": "splunk.rectangle",
  "dataSources": { "primary": "ds_health_low" },
  "context": {
    "fillDataValue": "> primary | seriesByName('health') | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

## 16. Same DOS, value 65 (mid → amber)

Verifies disjoint-bucket boundary.

## 17. `seriesByType('number')` picker form

```json
"fillDataValue": "> primary | seriesByType('number') | lastPoint()"
```

Equivalent to `seriesByName('field')` when SPL has only one numeric.

## 18. DOS `strokeColor` — outlined status badge

Same alias-in-context shape applied to `strokeColor` instead of fill.
Use for outlined chips that flip on a metric.

## 19. DOS `fillColor` AND `strokeColor` — tinted card with outline

Two separate `*EditorConfig` tables in `context`, both bound to
respective options.

## 20. Token-driven `fillColor`

```json
{ "options": { "fillColor": "$colour_token$" } }
```

Pair with `input.dropdown` (see `interactivity/ds-inputs`).

## Faux drop-shadow (two rectangles)

```json
"structure": [
  { "item": "viz_shadow", "position": { "x": 22, "y": 24, "w": 320, "h": 162 } },
  { "item": "viz_card",   "position": { "x": 20, "y": 20, "w": 320, "h": 160 } }
]
```

```json
"viz_shadow": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#000000",
    "fillOpacity": 0.15,
    "strokeColor": "transparent",
    "rx": 8
  }
},
"viz_card": {
  "type": "splunk.rectangle",
  "options": { "fillColor": "#1A2440", "strokeColor": "transparent", "rx": 8 }
}
```

Shadow placed down-and-right of the card. **Order in `structure`
matters** — shadow must come first to render behind.

## Invisible click-target over an image

```json
"viz_image_floor_plan": {
  "type": "splunk.image",
  "options": { "src": "/storage/.../floor.png", "preserveAspectRatio": true }
},
"viz_room_a_hitzone": {
  "type": "splunk.rectangle",
  "options": { "fillColor": "transparent", "strokeColor": "transparent" }
}
```

```json
"structure": [
  { "item": "viz_image_floor_plan",   "position": { "x": 20,  "y": 20,  "w": 1400, "h": 700 } },
  { "item": "viz_room_a_hitzone",     "position": { "x": 320, "y": 200, "w": 180,  "h": 120 } }
]
```

Wire `viz_room_a_hitzone` to drilldown. User sees the floor plan and
clicks "Room A"; your handler fires (`onSelectionChanged` works on
fully-transparent rectangles).
