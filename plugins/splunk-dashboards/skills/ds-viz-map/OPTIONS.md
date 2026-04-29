# splunk.map — full options reference

Cross-checked against `docs/SplunkCloud-10.4.2604-DashStudio.pdf` +
splunkui visualization catalog (Map package page).

## Top-level options

| Option | Type | Default | Notes |
|---|---|---|---|
| `backgroundColor` | string (hex) | theme | Visible behind tile gaps and behind basemap when `showBaseLayer: false`. |
| `center` | `[lat, lon]` | auto-fit | **`[lat, lon]` order** (NOT `[lon, lat]` like GeoJSON). |
| `zoom` | number | auto-fit | Lower = more zoomed out. World ≈ 1.3–1.5. Sub-1 (e.g. 0.5) for tile-less zoom-out. |
| `scaleUnit` | `"metric"` \| `"imperial"` | `"metric"` | Bottom-left scale bar units. |
| `showScale` | boolean | `true` | Toggle scale bar. |
| `showZoomControls` | boolean | `true` | +/- zoom buttons. |
| `showCoordinates` | boolean | `false` | Live cursor coordinate readout. |
| `showBaseLayer` | boolean | `true` | Toggle underlying tile basemap. |
| `baseLayerTileServer` | URL template | Splunk-hosted vector | Override for air-gapped / OSM mirror. Must include `{x}`, `{y}`, `{z}`. |
| `baseLayerTileServerType` | `"vector"` \| `"raster"` | `"vector"` | Match format of tile server. |
| `markerSize` | number | viz default | **Top-level**, NOT per-layer. |
| `layers` | `Layer[]` | `[]` | Required for any rendered content. |

## Per-layer options (`layers[i]`)

| Option | Applies to | Type | Notes |
|---|---|---|---|
| `type` | all | `"marker"` \| `"bubble"` \| `"choropleth"` | All three render in 10.2 + 10.4. |
| `source` | choropleth | string | `"geo://default/world"` (ISO-2 keys), `"geo://default/us"` (state-code keys). Auto-derived if search has `geom` column. |
| `latitude` | marker, bubble | DOS string | **Bubble silently ignores this** — see SKILL.md pairing rules. |
| `longitude` | marker, bubble | DOS string | Same — bubble ignores. |
| `bubbleSize` | bubble | DOS string | **Must be a frame**: `frameWithoutSeriesNames('geobin', 'latitude', 'longitude') \| frameBySeriesTypes('number')`. |
| `areaIds` | choropleth | DOS string | Country/state code column. Must match `featureId` in lookup. |
| `areaValues` | choropleth | DOS string | Numeric column shading polygons. |
| `geom` | choropleth | DOS string | The `geom` polygon column from search. String- or JSON-typed both work. |
| `featureIdField` | choropleth | DOS string | The polygon ID column. |
| `dataColors` | all | DOS string | Per-row colour. **Bubble** uses `> dataValues \| rangeValue(...)`; **marker/choropleth** use `> primary \| seriesByName(...) \| rangeValue(...)`. |
| `seriesColors` | all | array of hex | Static colour palette per series. |
| `additionalTooltipFields` | all | array of strings | Extra columns in tooltip. |
| `tooltipHeaderField` | all | string | Tooltip header. **Required for choropleth in some Studio builds.** |
| `resultLimit` | all | number | Per-layer cap, NOT per-viz. Set on each layer for global cap. |
| `choroplethOpacity` | choropleth | 0.0–1.0 | Polygon fill opacity. `0.4`–`0.6` lets basemap labels through. `1.0` for tile-less shapes-only maps. |
| `choroplethStrokeColor` | choropleth | hex / colour name | Border around each polygon. |
| `choroplethEmptyAreaColor` | choropleth | hex / colour name | Fill for polygons with no matching data. Set explicitly when `showBaseLayer: false`. |

## Bundled lookups

| Source | Keys on |
|---|---|
| `\| geom geo_countries featureIdField=country` | **Full English country names** (`United States`, `Norway`). |
| `\| geom geo_us_states featureIdField=state` | **2-letter state code** (`CA`, `TX`). |
| `source: "geo://default/world"` | **ISO-2 country code** (`US`, `NO`). |
| `source: "geo://default/us"` | **2-letter state code** (`CA`, `TX`). |

The `geo://default/*` paths and the `geom geo_*` commands are
**different lookups** under the hood — keys differ. See GOTCHAS.md #3.

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf` + splunk-ui Maps catalog
page. Map options table.
