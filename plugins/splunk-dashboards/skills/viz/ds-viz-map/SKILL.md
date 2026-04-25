---
name: ds-viz-map
description: |
  splunk.map - the geographic point/bubble/choropleth map. Renders a
  Leaflet-style basemap with one or more layers (marker / bubble /
  choropleth). Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_map_dark
  - ds_viz_map_light
related:
  - ds-viz-choropleth-map
  - ds-viz-choropleth-svg
  - ds-viz-singlevalue
  - ds-design-principles
---

# splunk.map

The geographic map visualization. A `splunk.map` is a Leaflet-style basemap
with **one or more layers** stacked on top: pin markers, sized bubbles, or
country / region shading (choropleth). Most production maps are a single
marker or bubble layer; multi-layer maps are common for "infrastructure +
incidents" overlays.

## When to use

- **Geographic distribution of events** - login origins, IPs, store
  locations, vehicle telemetry.
- **Bubble-encoded magnitude on a map** - e.g. request volume by city,
  bytes-out by region.
- **Country / region shading** - a `choropleth` layer keyed off
  `geom geo_countries` or `geom geo_us_states` (or a custom polygon
  lookup).
- **Multi-layer maps** - markers (sites) + bubbles (live incidents) +
  choropleth (regional risk score) on the same canvas.

## When NOT to use

- For **flat geometric SVG fills** without a basemap, use
  `splunk.choropleth.svg` (no Leaflet, no zoom).
- For **abstract "world map" branding** with no real lat/lon data, use
  `splunk.image` with a static SVG instead.
- For **dense / sustained scrolling time-series**, use line / area /
  column charts; map clustering and tile rendering have a real cost.
- For **single-region thematic maps** (e.g. one country, no zoom needed),
  consider `splunk.choropleth.map` for a more focused fit.

## Data shape

Per layer type the search must produce specific columns:

- **`marker` layer:** rows of `lat`, `lon` (numeric). Optional metric
  columns can be referenced via `additionalTooltipFields`.
- **`bubble` layer:** rows of `lat`, `lon`, plus a numeric column bound to
  `bubbleSize`.
- **`choropleth` layer:** a `featureId`-style column (e.g. country code)
  bound to `areaIds`, plus a numeric column bound to `areaValues`. The
  search must run a final `geom geo_<lookup> featureIdField=<col>` so the
  result includes a `geom` column with the polygon GeoJSON.

Common SPL recipes:

```spl
# marker / bubble - look up city geo via iplocation
... | iplocation src_ip | search lat=* lon=*
    | stats count by City lat lon
```

```spl
# choropleth - country code shading via the bundled geo_countries lookup
... | iplocation src_ip
    | rename Country as country
    | stats count by country
    | geom geo_countries featureIdField=country
```

`iplocation` and `geom` are bundled with Splunk core. The `geo_countries`
and `geo_us_states` polygon lookups also ship with Splunk core, so
choropleth panels work without any TA installation.

## Top-level options (10.4 PDF)

| Option                    | Type                                      | Default                          | Notes                                                                                                                            |
| ------------------------- | ----------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `backgroundColor`         | string (hex)                              | theme default                    | Visible behind tile gaps.                                                                                                        |
| `center`                  | `[lat, lon]` array                        | auto-fit from data               | Explicit framing for repeatable views.                                                                                           |
| `zoom`                    | number                                    | auto-fit                         | Lower numbers = more zoomed-out. World view is roughly `1.3` - `1.5`.                                                            |
| `scaleUnit`               | `"metric"` \| `"imperial"`                | `"metric"`                       | Bottom-left scale bar units.                                                                                                     |
| `showScale`               | boolean                                   | `true`                           | Toggle the scale bar.                                                                                                            |
| `baseLayerTileServer`     | string (URL template)                     | Splunk-hosted vector tile server | Override only when running air-gapped or on a custom OSM mirror. Must include `{x}`, `{y}`, `{z}` (raster) or vector equivalent. |
| `baseLayerTileServerType` | `"vector"` \| `"raster"`                  | `"vector"`                       | Match the format of the tile server set above.                                                                                   |
| `markerSize`              | number                                    | viz default                      | Top-level marker pixel size for marker layers (overrides per-layer default sizing).                                              |
| `layers`                  | `Layer[]` (see below)                     | `[]`                             | Required for any rendered content.                                                                                               |

## Per-layer options (`layers[i]`)

| Option                    | Applies to                | Type                            | Notes                                                                                                                                                |
| ------------------------- | ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                    | all                       | `"marker"` \| `"bubble"` \| `"choropleth"` | The PDF source-editor table only enumerates `marker`/`bubble`, but `choropleth` is fully supported per other PDF sections and is verified live. |
| `latitude`                | marker, bubble            | DOS string                      | e.g. `"> primary \| seriesByName(\"lat\")"`                                                                                                          |
| `longitude`               | marker, bubble            | DOS string                      | Same as above for `lon`.                                                                                                                             |
| `bubbleSize`              | bubble                    | DOS string                      | Numeric column bound to bubble area.                                                                                                                 |
| `areaIds`                 | choropleth                | DOS string                      | Country / state code column. Must match the `featureId` values in the lookup.                                                                        |
| `areaValues`              | choropleth                | DOS string                      | Numeric column shading the polygons.                                                                                                                 |
| `dataColors`              | marker, bubble, choropleth | DOS string                     | Per-row colour. Common pattern: `"> primary \| seriesByName(\"bytes\") \| rangeValue(thresholdConfig)"`                                              |
| `seriesColors`            | all                       | array of hex strings            | Static colour palette per series.                                                                                                                    |
| `additionalTooltipFields` | all                       | array of strings                | Extra column names to show in the hover tooltip.                                                                                                     |
| `resultLimit`             | all                       | number                          | Hard cap on rows rendered for this layer. Useful to keep clutter down on noisy data.                                                                 |

> **PDF inconsistency:** the source-editor option table for
> `layers[i].type` lists only `("marker" | "bubble")`, but a separate
> "Map visualization" section of the same PDF documents the `choropleth`
> layer type with `areaIds` / `areaValues` examples. Both render in 10.2
> and 10.4 - we verify all three live in the test dashboard. Treat
> `choropleth` as fully supported.

## Drilldown / interactivity

`splunk.map` exposes click events on individual markers, bubbles, or
polygons. The `onSelectionChanged` payload contains the row's data
fields (the bound `lat`, `lon`, `additionalTooltipFields`, etc.), so you
can wire a drilldown that filters another panel by city / country.

Tooltips also support `additionalTooltipFields` - the simplest way to
expose extra data without writing a custom drilldown.

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_map_dark` / `ds_viz_map_light`.

| Panel | What it demonstrates                                                                |
| ----- | ----------------------------------------------------------------------------------- |
| 1     | Bare marker layer, auto-fit center / zoom                                           |
| 2     | Marker layer with explicit `center` + `zoom` + `additionalTooltipFields`            |
| 3     | Marker `dataColors` driven by `rangeValue(config)` thresholds (green / yellow / red) |
| 4     | Bubble layer sized by metric, with method shown in tooltip                          |
| 5     | Choropleth layer over `geom geo_countries`, country code -> count                   |
| 6     | `scaleUnit: "imperial"` + explicit `showScale: true`                                |
| 7     | `showScale: false` (compact KPI map)                                                |
| 8     | `resultLimit: 5` capping a 12-row data source                                       |
| 9     | Multi-layer map (marker + bubble in one viz, two data sources)                      |
| 10    | Custom `backgroundColor` visible behind the tiles                                   |

## Common gotchas

1. **Lat/lon must be numeric, not strings.** A common bug is `iplocation`
   producing string lat/lon - cast with `eval lat=tonumber(lat),
   lon=tonumber(lon)` before passing to the map.
2. **Choropleth needs `geom`.** The search must end in
   `| geom geo_<lookup> featureIdField=<col>` so the result includes the
   `geom` polygon column. Without this, the layer renders blank.
3. **`featureId` values must match the lookup.** `geo_countries` uses
   ISO-3166-1 alpha-2 codes (`US`, `GB`, `NO`). If your data has names
   ("United States"), you must normalize first.
4. **`markerSize` is top-level, not per-layer.** Per the 10.4 PDF, the
   `markerSize` option lives at the top level of `splunk.map` options,
   not inside individual `layers[]` entries. It applies to all marker
   layers in the map.
5. **Bubble clustering kicks in at low zoom.** Splunk auto-clusters
   bubbles when they overlap. For a "no clustering" look, set a high
   `zoom` and / or filter the data to a small region.
6. **`baseLayerTileServer` must match `baseLayerTileServerType`.** Mixing
   a raster URL with `type: "vector"` (or vice versa) silently shows a
   blank basemap.
7. **`center` is `[lat, lon]`, not `[lon, lat]`.** Common confusion since
   most GeoJSON / Leaflet code uses `[lon, lat]`. Splunk uses
   `[lat, lon]` for `center`.
8. **`resultLimit` is per-layer**, not per-viz. With multiple layers you
   need to set it on each one if you want a global cap.
9. **`dataColors` is a DOS string**, not a hex value or palette name.
   The canonical pattern is
   `"> primary | seriesByName(\"<col>\") | rangeValue(<config>)"` and the
   threshold config goes in the visualization's `context`.
10. **No "polygon" layer for arbitrary GeoJSON.** Choropleth only works
    against the bundled `geo_*` polygon lookups (or your own polygon
    lookup with a matching `featureId`/`geom` schema). For arbitrary
    GeoJSON overlays, use `splunk.choropleth.svg` with a custom SVG
    instead.

## Quick recipes

### Marker layer with thresholded colours

```json
{
  "viz_marker": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_locations" },
    "options": {
      "layers": [
        {
          "type": "marker",
          "latitude":  "> primary | seriesByName(\"lat\")",
          "longitude": "> primary | seriesByName(\"lon\")",
          "dataColors": "> primary | seriesByName(\"bytes\") | rangeValue(thresholdConfig)",
          "additionalTooltipFields": ["city", "bytes"]
        }
      ],
      "center": [20, 0],
      "zoom": 1.5
    },
    "context": {
      "thresholdConfig": [
        { "from": 3000,             "value": "#FF677B" },
        { "from": 1500, "to": 3000, "value": "#FFD166" },
        {              "to": 1500, "value": "#26A69A" }
      ]
    }
  }
}
```

### Bubble layer (sized by metric)

```json
{
  "viz_bubble": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_traffic" },
    "options": {
      "layers": [
        {
          "type": "bubble",
          "latitude":   "> primary | seriesByName(\"lat\")",
          "longitude":  "> primary | seriesByName(\"lon\")",
          "bubbleSize": "> primary | seriesByName(\"count\")",
          "additionalTooltipFields": ["method", "count"]
        }
      ]
    }
  }
}
```

### Choropleth layer over `geo_countries`

SPL:

```spl
... | iplocation src_ip
    | rename Country as country
    | stats count by country
    | geom geo_countries featureIdField=country
```

JSON:

```json
{
  "viz_choropleth": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_countries" },
    "options": {
      "layers": [
        {
          "type": "choropleth",
          "areaIds":    "> primary | seriesByName(\"country\")",
          "areaValues": "> primary | seriesByName(\"count\")"
        }
      ],
      "center": [20, 0],
      "zoom": 1.3
    }
  }
}
```

### Multi-layer (marker + bubble in one map)

```json
{
  "viz_multi": {
    "type": "splunk.map",
    "dataSources": {
      "primary":   "ds_sites",
      "secondary": "ds_incidents"
    },
    "options": {
      "layers": [
        {
          "type": "marker",
          "latitude":  "> primary | seriesByName(\"lat\")",
          "longitude": "> primary | seriesByName(\"lon\")",
          "additionalTooltipFields": ["site"]
        },
        {
          "type": "bubble",
          "latitude":   "> secondary | seriesByName(\"lat\")",
          "longitude":  "> secondary | seriesByName(\"lon\")",
          "bubbleSize": "> secondary | seriesByName(\"severity\")"
        }
      ]
    }
  }
}
```

## See also

- `ds-viz-choropleth-map` - dedicated thematic-map visualization without
  the Leaflet basemap; better fit for "single country, no zoom" views.
- `ds-viz-choropleth-svg` - polygon shading on an arbitrary SVG file.
  Use when you need an unusual map (a building floorplan, a custom
  region) that has no Leaflet basemap.
- `ds-viz-singlevalue` - layer KPIs on top of a map for "X events on Y
  sites" hero panels.
- `ds-design-principles` - when a map is the right answer vs a table or
  bar chart.
