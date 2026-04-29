# splunk.map — verified patterns

15 patterns rendered and visually QA'd in `ds_viz_map_dark`.

## 1. Marker — auto-fit centre / zoom

```json
{
  "options": {
    "layers": [
      {
        "type": "marker",
        "latitude":  "> primary | seriesByName('lat')",
        "longitude": "> primary | seriesByName('lon')"
      }
    ]
  }
}
```

## 2. Marker — explicit centre + zoom + tooltip fields

```json
{
  "options": {
    "layers": [{
      "type": "marker",
      "latitude":  "> primary | seriesByName('lat')",
      "longitude": "> primary | seriesByName('lon')",
      "additionalTooltipFields": ["city", "bytes"]
    }],
    "center": [20, 0],
    "zoom": 1.5
  }
}
```

## 3. Marker `dataColors` via `rangeValue`

```json
{
  "options": {
    "layers": [{
      "type": "marker",
      "latitude":  "> primary | seriesByName('lat')",
      "longitude": "> primary | seriesByName('lon')",
      "dataColors": "> primary | seriesByName('bytes') | rangeValue(thresholds)"
    }]
  },
  "context": {
    "thresholds": [
      { "from": 3000,              "value": "#FF677B" },
      { "from": 1500, "to": 3000,  "value": "#FFD166" },
      {               "to": 1500,  "value": "#26A69A" }
    ]
  }
}
```

## 4. Bubble — sized by metric (`geostats` source)

```spl
... | iplocation src_ip
    | geostats latfield=lat longfield=lon count by method
```

```json
{
  "options": {
    "layers": [{
      "type": "bubble",
      "bubbleSize": "> primary | frameWithoutSeriesNames('geobin', 'latitude', 'longitude') | frameBySeriesTypes('number')",
      "tooltipHeaderField": "> primary | seriesByName('geobin')"
    }]
  }
}
```

## 5. Choropleth — `geom geo_countries`

```spl
... | iplocation src_ip
    | rename Country as country
    | stats count by country
    | geom geo_countries featureIdField=country
```

```json
{
  "options": {
    "layers": [{
      "type": "choropleth",
      "areaIds":    "> primary | seriesByName('country')",
      "areaValues": "> primary | seriesByName('count')",
      "tooltipHeaderField": "> primary | seriesByName('country')"
    }],
    "center": [20, 0],
    "zoom": 1.3
  }
}
```

## 6. `scaleUnit: "imperial"` + `showScale: true`

## 7. `showScale: false` — compact KPI map

## 8. `resultLimit: 5` — cap a 12-row source

## 9. Bubble Type Map — data colours (canonical splunk-ui)

```spl
... | iplocation device_ip
    | where method="GET"
    | geostats latfield=lat longfield=lon count by method
```

```json
{
  "options": {
    "layers": [{
      "type": "bubble",
      "dataColors": "> dataValues | rangeValue(dataColorsEditorConfig)"
    }],
    "center": [28.5, -9.0],
    "zoom": 1.45
  },
  "context": {
    "dataColorsEditorConfig": [
      { "to": 5,              "value": "#D41F1F" },
      { "from": 5,  "to": 10, "value": "#D97A0D" },
      { "from": 10, "to": 20, "value": "#9D9F0D" },
      { "from": 20,           "value": "#118832" }
    ]
  }
}
```

`dataValues` is the bubble-specific token, NOT `seriesByName(...)`.

## 10. Custom `backgroundColor` visible behind tiles

## 11. Choropleth + `choroplethOpacity: 0.5` — basemap labels show through

## 12. Choropleth + `resultLimit: 1` — only highest-count region

## 13. Choropleth fed from String-typed `geom`

```spl
... | geom geo_countries featureIdField=country
    | where isnotnull(geom)
    | eval geom=tostring(geom)
    | fields country count geom
```

`| where isnotnull(geom)` BEFORE `tostring()` is mandatory — see
GOTCHAS.md #13.

## 14. Styled World choropleth — tile-less, opaque

```json
{
  "options": {
    "layers": [{
      "type": "choropleth",
      "source": "geo://default/world",
      "areaIds":    "> primary | seriesByName('country')",
      "areaValues": "> primary | seriesByName('count')",
      "choroplethOpacity": 1.0,
      "choroplethStrokeColor": "Black",
      "choroplethEmptyAreaColor": "Grey"
    }],
    "showBaseLayer": false,
    "showZoomControls": false,
    "showScale": false,
    "center": [20, 0],
    "zoom": 0.5,
    "backgroundColor": "#0F1729"
  }
}
```

> `geo://default/world` keys on **ISO-2** codes (`US`, `NO`),
> not full names. Opposite of `geom geo_countries`.

## 15. Styled US choropleth — print-quality state map

```json
{
  "options": {
    "layers": [{
      "type": "choropleth",
      "source": "geo://default/us",
      "areaIds":    "> primary | seriesByName('state')",
      "areaValues": "> primary | seriesByName('count')",
      "choroplethOpacity": 1.0,
      "choroplethStrokeColor": "Black",
      "choroplethEmptyAreaColor": "#FFFFFF",
      "dataColors": "> primary | seriesByName('count') | rangeValue(stateThresholds)"
    }],
    "showBaseLayer": false,
    "showZoomControls": false,
    "showScale": false,
    "center": [39, -98],
    "zoom": 3,
    "backgroundColor": "Grey"
  }
}
```

## Anti-pattern — marker + bubble in one map

```json
{
  "layers": [
    { "type": "marker", "latitude": "...", "longitude": "..." },
    { "type": "bubble", "bubbleSize": "..." }
  ]
}
```

**Unreliable.** Second layer commonly disappears. See GOTCHAS.md #16.
Use one layer type per panel.
