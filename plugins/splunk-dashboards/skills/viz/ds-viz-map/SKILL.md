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

Per layer type the search must produce specific columns. **The two
point-rendering layers (`marker` and `bubble`) want their data shaped
differently** - this is the single most common reason a panel renders
empty.

- **`marker` layer:** rows of `lat`, `lon` (numeric) from any `table`-style
  search. Bind `latitude` and `longitude` **explicitly** on the layer.
  Optional metric columns can be referenced via `additionalTooltipFields`.
- **`bubble` layer:** must be paired with **`geostats`**, which produces
  `latitude`, `longitude`, `geobin` and per-`by`-field metric columns.
  **Do NOT set `latitude` / `longitude` on the bubble layer** - those
  bindings are silently ignored when `type: "bubble"` and the panel
  renders empty. Bind `bubbleSize` over the metric columns using
  `frameWithoutSeriesNames("geobin", "latitude", "longitude") | frameBySeriesTypes("number")`.
- **`choropleth` layer:** a `featureId`-style column (e.g. country code)
  bound to `areaIds`, plus a numeric column bound to `areaValues`. The
  search either runs a final `geom geo_<lookup> featureIdField=<col>`
  (so the result includes a `geom` column with the polygon GeoJSON), OR
  the layer sets `source: "geo://default/world"` / `"geo://default/us"`
  and the data is just `country`/`state` + metric. Always include
  `tooltipHeaderField` to wire up the polygon hover surface - some
  Dashboard Studio versions render but provide no tooltip target without
  it, which can make the panel appear empty on first load.

Common SPL recipes:

```spl
# marker - look up city geo via iplocation, table shape
... | iplocation src_ip | search lat=* lon=*
    | stats count by City lat lon
    | table City lat lon count
```

```spl
# bubble - geostats shape (lat/lon become 'latitude'/'longitude' + 'geobin')
... | iplocation src_ip
    | geostats latfield=lat longfield=lon count by method
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

## Top-level options (10.4 PDF + Splunk UI catalog)

| Option                    | Type                                      | Default                          | Notes                                                                                                                            |
| ------------------------- | ----------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `backgroundColor`         | string (hex)                              | theme default                    | Visible behind tile gaps and behind the basemap when `showBaseLayer: false`.                                                     |
| `center`                  | `[lat, lon]` array                        | auto-fit from data               | Explicit framing for repeatable views. Note: `[lat, lon]`, NOT `[lon, lat]`.                                                     |
| `zoom`                    | number                                    | auto-fit                         | Lower numbers = more zoomed-out. World view is roughly `1.3` - `1.5`. Sub-1 values (e.g. `0.5`) zoom out further when `showBaseLayer` is off. |
| `scaleUnit`               | `"metric"` \| `"imperial"`                | `"metric"`                       | Bottom-left scale bar units.                                                                                                     |
| `showScale`               | boolean                                   | `true`                           | Toggle the scale bar.                                                                                                            |
| `showZoomControls`        | boolean                                   | `true`                           | Toggle the +/- zoom buttons. Hide for static / "screenshot mode" panels.                                                         |
| `showCoordinates`         | boolean                                   | `false`                          | Show a live cursor-coordinate readout. Off by default.                                                                           |
| `showBaseLayer`           | boolean                                   | `true`                           | Toggle the underlying tile basemap. Combine with a `choropleth` layer + `backgroundColor` to render a "shapes-only" map without Leaflet tiles. |
| `baseLayerTileServer`     | string (URL template)                     | Splunk-hosted vector tile server | Override only when running air-gapped or on a custom OSM mirror. Must include `{x}`, `{y}`, `{z}` (raster) or vector equivalent. |
| `baseLayerTileServerType` | `"vector"` \| `"raster"`                  | `"vector"`                       | Match the format of the tile server set above.                                                                                   |
| `markerSize`              | number                                    | viz default                      | Top-level marker pixel size for marker layers (overrides per-layer default sizing).                                              |
| `layers`                  | `Layer[]` (see below)                     | `[]`                             | Required for any rendered content.                                                                                               |

> The five "show*" / `showBaseLayer` flags don't appear in every PDF
> rev but are documented in the splunk-ui visualization catalog
> (https://splunkui.splunk.com/Packages/visualizations/Map). All four
> render in 10.4 and are exercised in the test dashboard.

## Per-layer options (`layers[i]`)

| Option                       | Applies to                | Type                                        | Notes                                                                                                                                                                                                            |
| ---------------------------- | ------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                       | all                       | `"marker"` \| `"bubble"` \| `"choropleth"` | The PDF source-editor table only enumerates `marker`/`bubble`, but `choropleth` is fully supported per other PDF sections and is verified live.                                                                  |
| `source`                     | choropleth                | string                                      | Polygon source. Bundled values: `"geo://default/world"`, `"geo://default/us"`. Default is auto-derived from the search's `geom` column if present.                                                              |
| `latitude`                   | marker, bubble            | DOS string                                  | e.g. `"> primary \| seriesByName(\"lat\")"`                                                                                                                                                                      |
| `longitude`                  | marker, bubble            | DOS string                                  | Same as above for `lon`.                                                                                                                                                                                         |
| `bubbleSize`                 | bubble                    | DOS string                                  | Numeric column bound to bubble area. **Must be a frame, not a series:** `"> primary \| frameWithoutSeriesNames(\"lat\", \"lon\") \| frameBySeriesTypes(\"number\")"`. A bare `seriesByName(\"count\")` renders unsized dots. |
| `areaIds`                    | choropleth                | DOS string                                  | Country / state code column. Must match the `featureId` values in the lookup.                                                                                                                                    |
| `areaValues`                 | choropleth                | DOS string                                  | Numeric column shading the polygons.                                                                                                                                                                             |
| `geom`                       | choropleth                | DOS string                                  | The `geom` polygon column from the search, used when `source` is auto-derived. Splunk handles String- or JSON-typed `geom` values transparently.                                                                  |
| `featureIdField`             | choropleth                | DOS string                                  | The column name carrying the polygon ID (typically `country` after `geom geo_countries featureIdField=country`).                                                                                                |
| `dataColors`                 | marker, bubble, choropleth | DOS string                                 | Per-row colour. Common pattern: `"> primary \| seriesByName(\"bytes\") \| rangeValue(thresholdConfig)"`                                                                                                          |
| `seriesColors`               | all                       | array of hex strings                        | Static colour palette per series.                                                                                                                                                                                |
| `additionalTooltipFields`    | all                       | array of strings                            | Extra column names to show in the hover tooltip. For choropleth, the metric value still shows by default - this adds extra context.                                                                              |
| `tooltipHeaderField`         | all                       | string                                      | The column name used as the **header** of the hover tooltip. For choropleth, set to the polygon ID column (e.g. `"country"`) for a cleaner header.                                                               |
| `resultLimit`                | all                       | number                                      | Hard cap on rows rendered for this layer. Useful to keep clutter down on noisy data.                                                                                                                             |
| `choroplethOpacity`          | choropleth                | number `0.0` - `1.0`                        | Polygon fill opacity. Lower (`0.4` - `0.6`) lets the basemap labels show through; `1.0` makes the fill fully opaque (use when `showBaseLayer: false` for a flat shapes-only map).                                |
| `choroplethStrokeColor`      | choropleth                | string (hex / colour name)                  | Border colour around each polygon.                                                                                                                                                                               |
| `choroplethEmptyAreaColor`   | choropleth                | string (hex / colour name)                  | Fill colour for polygons with no matching data row. Defaults to a transparent / theme-grey - set explicitly when `showBaseLayer: false` so the empty regions don't bleed into the panel background.              |

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

| Panel | What it demonstrates                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| 1     | Bare marker layer, auto-fit center / zoom                                                                       |
| 2     | Marker layer with explicit `center` + `zoom` + `additionalTooltipFields`                                        |
| 3     | Marker `dataColors` driven by `rangeValue(config)` thresholds (green / yellow / red)                             |
| 4     | Bubble layer sized by metric (with the **`frameWithoutSeriesNames` / `frameBySeriesTypes`** binding pattern)    |
| 5     | Choropleth layer over `geom geo_countries`, country code -> count, with `additionalTooltipFields` extras        |
| 6     | `scaleUnit: "imperial"` + explicit `showScale: true`                                                            |
| 7     | `showScale: false` (compact KPI map)                                                                            |
| 8     | `resultLimit: 5` capping a 12-row data source                                                                   |
| 9     | Bubble Type Map - Data Colors (canonical splunk-ui example): `dataColors: "> dataValues \| rangeValue(<config>)"` over a `geostats` source for traffic-light bucketing |
| 10    | Custom `backgroundColor` visible behind the tiles                                                               |
| 11    | Choropleth with `choroplethOpacity: 0.5` + `tooltipHeaderField: "country"` + `additionalTooltipFields: ["count"]` |
| 12    | Choropleth with `resultLimit: 1` - only the highest-count region renders                                        |
| 13    | Choropleth fed from a **String-typed `geom` column** (`eval geom=tostring(geom)`) - verifies the viz tolerates serialised polygons |
| 14    | Styled "World" choropleth: `showBaseLayer: false`, `showZoomControls: false`, `showScale: false`, `zoom: 0.5`, explicit `center`, `choroplethStrokeColor: "Black"`, `choroplethEmptyAreaColor: "Grey"`, `choroplethOpacity: 1.0` - a tile-less, opaque, fully-styled regional shading |
| 15    | Styled "US" choropleth: `backgroundColor: "Grey"`, all chrome off, `zoom: 3`, explicit `center`, `dataColors` via `rangeValue` per state - a print-quality state map without basemap noise |

## Common gotchas

1. **Lat/lon must be numeric, not strings.** A common bug is `iplocation`
   producing string lat/lon - cast with `eval lat=tonumber(lat),
   lon=tonumber(lon)` before passing to the map.
2. **Choropleth needs `geom`.** The search must end in
   `| geom geo_<lookup> featureIdField=<col>` so the result includes the
   `geom` polygon column. Without this, the layer renders blank.
3. **`featureId` values must match the lookup - and the two bundled lookups
   key DIFFERENTLY.** This is the single most common reason a choropleth
   panel renders empty.
   - **`geom geo_countries`** keys on the **full English country name**
     (`United States`, `United Kingdom`, `Brazil`, `Norway`, `Germany`).
     ISO-2 codes (`US`, `GB`, `BR`, `NO`) silently produce all-NULL `geom`
     and the panel renders as the "no data" fallback colour with no
     console error. Note: it's `United States`, **not** `United States of
     America` - the lookup truncates. Verify the exact spelling with
     `| inputlookup geo_countries | where match(featureId, "(?i)united")`.
   - **`geom geo_us_states`** keys on the **two-letter state code**
     (`CA`, `TX`, `NY`).
   - **`source: "geo://default/world"`** (the inline GeoJSON source used
     **without** a `geom` command) keys on **ISO-2** (`US`, `GB`, `BR`).
     This is the opposite of `geo_countries` - which is why the same
     dashboard sometimes works on one panel and not on another that looks
     identical. The two paths are different lookups under the hood.
   - **`source: "geo://default/us"`** keys on the **two-letter state code**.
   If your data has the wrong key shape (IPs / lat-lon / names),
   normalise first. For ISO-2 → name on `geo_countries`, do a `lookup`
   against a country-name table (or bake one inline with `case(...)`)
   before the `geom` command.
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
11. **`bubbleSize` requires a frame, not a series.** A bare
    `"> primary | seriesByName(\"count\")"` produces tiny unsized dots.
    The canonical pattern (paired with a `geostats` source - see
    gotcha #15) is
    `"> primary | frameWithoutSeriesNames(\"geobin\", \"latitude\", \"longitude\") | frameBySeriesTypes(\"number\")"`.
    The exclusion list strips the geo columns the bubble layer already
    auto-consumes; `frameBySeriesTypes("number")` then exposes the
    remaining metric column(s) as bubble size.
12. **`showBaseLayer: false` needs a `backgroundColor` and an opaque
    `choroplethOpacity`.** Without those, the polygons paint onto a
    transparent background and the panel goes black or theme-grey.
    For shapes-only maps, set `showBaseLayer: false` together with
    `choroplethOpacity: 1.0`, an explicit `backgroundColor`, and
    `choroplethEmptyAreaColor` for non-data regions.
13. **`geom` may be a String column - but filter NULLs out FIRST.**
    The viz happily parses a String `geom` back to GeoJSON, so
    `eval geom=tostring(geom)` is fine in principle (useful when piping
    polygon data through `eventstats` / `streamstats`). The trap:
    `tostring()` on a NULL row produces the literal four-character
    string `"Null"`, which the viz then runs through `JSON.parse(...)`
    and dies with `Unexpected token 'N', "Null" is not valid JSON` -
    the entire panel goes blank with that error in the console. Always
    chain a `| where isnotnull(geom)` (or `| search geom=*`)
    **before** the `tostring`. (See gotcha #3 - the most common cause of
    all-NULL `geom` is feeding ISO-2 codes into `geo_countries`, which
    keys on full names. Without the `where` filter, the next stage
    `tostring()` then turns a screen full of NULLs into
    `Unexpected token 'N'`.) Canonical pattern:
    ```
    | geom geo_countries featureIdField=country
    | where isnotnull(geom)
    | eval geom=tostring(geom)
    | fields country count geom
    ```
14. **`tooltipHeaderField` improves choropleth tooltips - and is sometimes
    required.** By default a choropleth tooltip header is the polygon ID
    (e.g. `"US"`). Set `tooltipHeaderField: "country"` to explicitly bind
    the header to a column - cleaner when the country code is also
    displayed as `Country: US`. **In some Dashboard Studio builds the
    polygon hover surface also depends on `tooltipHeaderField` being
    set** - without it the panel can render but appear empty (no fill,
    no hover) on first load. Always include it on choropleth layers.
15. **`bubble` layers and `marker` layers want their data shaped
    DIFFERENTLY.** This is the most common reason a `bubble` panel
    renders empty even when the SPL clearly returns rows.
    - `marker` accepts any `table`-shaped search with `lat` / `lon`
      columns and **explicit** `latitude` / `longitude` bindings on the
      layer.
    - `bubble` requires a search ending in **`geostats latfield=lat
      longfield=lon <metric> by <dim>`**, which auto-emits `latitude`,
      `longitude`, `geobin`, and per-`by`-value metric columns. The
      bubble layer **picks these up implicitly** and **silently
      ignores** any explicit `latitude` / `longitude` bindings on the
      layer.
    Symptom of getting it wrong: a `splunk.map` panel with no error,
    no markers, no bubbles - just an empty basemap. Fix: switch the SPL
    from `... | table lat lon count` to
    `... | geostats latfield=lat longfield=lon count by <dim>`, drop
    `latitude` / `longitude` from the `bubble` layer, and bind
    `bubbleSize` over the resulting metric columns:
    ```json
    {
      "type": "bubble",
      "bubbleSize": "> primary | frameWithoutSeriesNames(\"geobin\", \"latitude\", \"longitude\") | frameBySeriesTypes(\"number\")",
      "tooltipHeaderField": "> primary | seriesByName(\"geobin\")"
    }
    ```
16. **Don't stack `marker` and `bubble` in the same `layers[]`.** It
    *appears* in the schema and won't throw an error, but in current
    Dashboard Studio builds (10.2 / 10.4 verified) the second layer
    commonly disappears - usually the bubble. Splunk's own
    documentation never stacks marker + bubble either: every official
    map example renders **one layer type per panel**. For richer
    geo-views, place separate `splunk.map` panels in the dashboard
    layout (one marker panel, one bubble panel, one choropleth panel)
    rather than a single multi-layer viz. Choropleth + marker / bubble
    stacking has the same trap and is similarly unreliable.
17. **Bubble `dataColors` uses the `dataValues` token, not
    `seriesByName(...)`.** This is the canonical Splunk-doc pattern and
    differs from the marker pattern.
    - `marker` layer: `dataColors: "> primary | seriesByName(\"bytes\") | rangeValue(thresholdConfig)"`
    - `bubble` layer: `dataColors: "> dataValues | rangeValue(dataColorsEditorConfig)"`
    The bubble layer auto-exposes a `dataValues` frame derived from
    `geostats` output - chain `rangeValue(<config-key>)` against it
    and put the threshold buckets in the viz's `context`. A
    `seriesByName(...)` chain on a bubble dataColors silently does
    nothing; the bubbles render but stay theme-default coloured.
    See panel 9 (`viz_bubble_data_colors`) - direct adaptation of the
    Splunk-ui Maps doc "Bubble Map example - dynamic coloring".

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

A `bubble` layer is the **only** map layer that requires a specific SPL
command upstream: it expects the columns produced by `geostats`
(`latitude`, `longitude`, `geobin`) and silently ignores explicit
`latitude` / `longitude` bindings. The `bubbleSize` binding is the
other part most people get wrong - it requires a frame, not a single
series. Use `frameWithoutSeriesNames(...)` listing every column the
layer already auto-consumes (`geobin`, `latitude`, `longitude`), then
`frameBySeriesTypes("number")` to expose the metric columns as bubble
size.

SPL:

```spl
... | iplocation src_ip
    | geostats latfield=lat longfield=lon count by method
```

JSON:

```json
{
  "viz_bubble": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_traffic_geostats" },
    "options": {
      "layers": [
        {
          "type": "bubble",
          "bubbleSize": "> primary | frameWithoutSeriesNames(\"geobin\", \"latitude\", \"longitude\") | frameBySeriesTypes(\"number\")",
          "tooltipHeaderField": "> primary | seriesByName(\"geobin\")"
        }
      ]
    }
  }
}
```

> Don't try to feed `bubble` from a `... | table lat lon count` shape
> with explicit `latitude`/`longitude` bindings - the panel will render
> empty with no error. That shape is for `marker`. See gotcha #15.

### Choropleth layer over `geo_countries`

SPL:

```spl
... | iplocation src_ip
    | rename Country as country
    | stats count by country
    | geom geo_countries featureIdField=country
```

> `geo_countries` keys on **full English country names** (`United States`,
> `United Kingdom`, `Brazil`), NOT on ISO-2 codes. If your upstream SPL
> only has ISO-2, normalise first via a lookup or an inline `case(...)`
> before the `geom` command. See gotcha #3.

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
          "areaValues": "> primary | seriesByName(\"count\")",
          "tooltipHeaderField": "> primary | seriesByName(\"country\")"
        }
      ],
      "center": [20, 0],
      "zoom": 1.3
    }
  }
}
```

> Always include `tooltipHeaderField` on a `choropleth` layer - some
> Dashboard Studio builds need it to wire up the polygon hover surface,
> and without it the panel can render but appear empty. See gotcha #14.

### Tile-less ("shapes-only") choropleth

When you want a clean regional shading that looks like a thematic
print map - no Leaflet tiles, no roads bleeding through - turn off
the basemap and pin the chrome:

```json
{
  "viz_world_shapes": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_world_full" },
    "options": {
      "layers": [
        {
          "type": "choropleth",
          "source": "geo://default/world",
          "areaIds":    "> primary | seriesByName(\"country\")",
          "areaValues": "> primary | seriesByName(\"count\")",
          "choroplethOpacity": 1.0,
          "choroplethStrokeColor": "Black",
          "choroplethEmptyAreaColor": "Grey"
        }
      ],
      "showBaseLayer": false,
      "showZoomControls": false,
      "showScale": false,
      "center": [20, 0],
      "zoom": 0.5,
      "backgroundColor": "#0F1729"
    }
  }
}
```

For a US-state version, swap `source` to `geo://default/us`, raise
the zoom (`3`), and centre on `[39, -98]` (continental US).

### Bubble Type Map - Data Colors (canonical splunk-ui pattern)

Direct adaptation of the **Bubble Map - dynamic coloring** sample from
the Splunk Dashboard Studio Maps doc. The bubble layer is sized
implicitly by the metric column from `geostats`, then **coloured** via
a `rangeValue(...)` chain against the auto-exposed `dataValues` frame.

SPL:

```spl
... | iplocation device_ip
    | where method="GET"
    | geostats latfield=lat longfield=lon count by method
```

JSON:

```json
{
  "viz_bubble_data_colors": {
    "type": "splunk.map",
    "dataSources": { "primary": "ds_traffic_get_only" },
    "options": {
      "layers": [
        {
          "type": "bubble",
          "dataColors": "> dataValues | rangeValue(dataColorsEditorConfig)"
        }
      ],
      "center": [28.5, -9.0],
      "zoom": 1.45,
      "scaleUnit": "imperial"
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
}
```

> Note `dataValues` (not `seriesByName(...)`) - the bubble layer auto-
> exposes a frame keyed off the geostats output. `seriesByName` here
> silently does nothing. See gotcha #17.

### Anti-pattern: marker + bubble in one map

Don't. Stacking different layer types in `layers[]` is unreliable - the
second layer commonly disappears in current Dashboard Studio builds
(see gotcha #16). Use one layer type per panel and compose richer
geo-views via the dashboard layout. Reference - the broken pattern that
this section used to recommend, kept here so it's recognisable when you
see it in the wild:

```json
{
  "viz_multi_BROKEN": {
    "type": "splunk.map",
    "dataSources": {
      "primary":   "ds_sites",
      "secondary": "ds_incidents_geostats"
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
          "bubbleSize": "> secondary | frameWithoutSeriesNames(\"geobin\", \"latitude\", \"longitude\") | frameBySeriesTypes(\"number\")",
          "tooltipHeaderField": "> secondary | seriesByName(\"geobin\")"
        }
      ]
    }
  }
}
```

## See also

- `ds-viz-choropleth-map` - **disambiguation skill**, not a separate viz
  type. `splunk.choropleth.map` does not exist in Dashboard Studio; the
  skill exists to redirect users back here (the canonical Studio
  pattern is a `choropleth`-typed layer inside `splunk.map`, as shown
  above).
- `ds-viz-choropleth-svg` - polygon shading on an arbitrary SVG file.
  Use when you need an unusual map (a building floorplan, a custom
  region) that has no Leaflet basemap.
- `ds-viz-singlevalue` - layer KPIs on top of a map for "X events on Y
  sites" hero panels.
- `ds-design-principles` - when a map is the right answer vs a table or
  bar chart.
