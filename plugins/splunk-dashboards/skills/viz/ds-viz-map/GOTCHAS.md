# splunk.map — gotchas (Splunk 10.2.1 / Cloud 10.4.2604)

## 1. Lat/lon must be numeric, not strings

`iplocation` produces string lat/lon. Cast first:

```spl
| eval lat=tonumber(lat), lon=tonumber(lon)
```

## 2. Choropleth needs `geom`

Search must end in `| geom geo_<lookup> featureIdField=<col>` so the
result includes a polygon `geom` column. Without this, the layer
renders blank.

## 3. `featureId` keys differ between lookups (most common empty-panel cause)

The single most common reason a choropleth panel renders empty.

| Lookup / source | Keys on |
|---|---|
| `\| geom geo_countries` | **Full English country names** (`United States`, `United Kingdom`, `Brazil`, `Norway`). It's `United States`, NOT `United States of America`. |
| `\| geom geo_us_states` | **2-letter state code** (`CA`, `TX`, `NY`). |
| `source: "geo://default/world"` (without `geom`) | **ISO-2 codes** (`US`, `GB`, `BR`, `NO`). |
| `source: "geo://default/us"` (without `geom`) | **2-letter state code**. |

ISO-2 (`US`, `NO`) into `geo_countries` produces all-NULL `geom` and
the panel renders as the "no data" fallback colour with no console
error. Different paths are different lookups under the hood.

Verify exact spelling:

```spl
| inputlookup geo_countries | where match(featureId, "(?i)united")
```

Normalise upstream — for ISO-2 → name on `geo_countries`, do a
`lookup` against a country-name table or bake one inline with
`case(...)` BEFORE the `geom` command.

## 4. `markerSize` is top-level, not per-layer

The `markerSize` option lives at the top level of `splunk.map` options,
not inside individual `layers[]` entries. Applies to all marker layers.

## 5. Bubble clustering kicks in at low zoom

Splunk auto-clusters bubbles when they overlap. For "no clustering"
look, set higher `zoom` and/or filter data to a small region.

## 6. `baseLayerTileServer` must match `baseLayerTileServerType`

Mixing a raster URL with `type: "vector"` (or vice versa) silently
shows a blank basemap.

## 7. `center` is `[lat, lon]`, NOT `[lon, lat]`

GeoJSON / Leaflet code uses `[lon, lat]`. Splunk uses `[lat, lon]`.

## 8. `resultLimit` is per-layer, not per-viz

With multiple layers, set on each one for a global cap.

## 9. `dataColors` is a DOS string, not a hex

Canonical: `> primary | seriesByName('<col>') | rangeValue(<config>)`
with the config in `context`.

## 10. No "polygon" layer for arbitrary GeoJSON

Choropleth only works against bundled `geo_*` lookups (or your own
polygon lookup with matching `featureId`/`geom` schema). For arbitrary
GeoJSON, use `splunk.choropleth.svg` instead.

## 11. `bubbleSize` requires a frame, not a series

```json
// ❌ tiny unsized dots
"bubbleSize": "> primary | seriesByName('count')"

// ✅ canonical (paired with geostats source)
"bubbleSize": "> primary | frameWithoutSeriesNames('geobin', 'latitude', 'longitude') | frameBySeriesTypes('number')"
```

The exclusion list strips geo columns the bubble layer already
auto-consumes; `frameBySeriesTypes('number')` exposes the metric
column(s).

## 12. `showBaseLayer: false` needs `backgroundColor` + `choroplethOpacity: 1.0`

Without those, polygons paint onto transparent canvas and panel goes
black or theme-grey. For shapes-only maps, set:

- `showBaseLayer: false`
- `choroplethOpacity: 1.0`
- explicit `backgroundColor`
- `choroplethEmptyAreaColor` for non-data regions

## 13. String `geom` is fine — but filter NULLs FIRST

```spl
| geom geo_countries featureIdField=country
| where isnotnull(geom)            ← MANDATORY
| eval geom=tostring(geom)
| fields country count geom
```

Without `where isnotnull(geom)`, `tostring(NULL)` produces literal
4-char string `"Null"`. The viz then runs `JSON.parse("Null")` and
dies with:

```
Unexpected token 'N', "Null" is not valid JSON
```

Whole panel goes blank with that error in console.

The most common cause of all-NULL `geom` is feeding ISO-2 codes into
`geo_countries` (gotcha #3). Without `where`, the next `tostring()`
turns a screen full of NULLs into `Unexpected token 'N'`.

## 14. `tooltipHeaderField` is sometimes required for choropleth

By default the choropleth tooltip header is the polygon ID
(e.g. `"US"`). Setting `tooltipHeaderField: "country"` explicitly
binds the header.

**In some Dashboard Studio builds the polygon hover surface itself
depends on `tooltipHeaderField`** — without it the panel can render
but appear empty (no fill, no hover) on first load. Always include
it on choropleth layers.

## 15. Bubble vs marker layers — DIFFERENT data shapes

Most common reason a `bubble` panel renders empty even when SPL
clearly returns rows.

- **`marker`:** any `| table lat lon` shape with **explicit** `latitude`
  / `longitude` bindings on the layer.
- **`bubble`:** **must** use `| geostats latfield=lat longfield=lon
  <metric> by <dim>`. Auto-emits `latitude`, `longitude`, `geobin`,
  per-`by`-value metric columns. Bubble layer picks these up
  **implicitly** and **silently ignores** explicit `latitude` /
  `longitude` bindings.

**Symptom:** map renders, no error, no markers, no bubbles — empty
basemap.

**Fix:** switch SPL from `| table lat lon count` to `| geostats
latfield=lat longfield=lon count by <dim>`. Drop `latitude` /
`longitude` from the bubble layer. Bind `bubbleSize` over the metric
columns.

## 16. Don't stack marker + bubble (or + choropleth) in one panel

Schema allows it; render is unreliable. Second layer commonly
disappears in current Dashboard Studio builds (10.2 / 10.4 verified).

Splunk's own documentation never stacks marker + bubble — every
official map example renders **one layer type per panel**.

For richer geo-views, use separate `splunk.map` panels in the
dashboard layout (one marker, one bubble, one choropleth) rather
than a single multi-layer viz.

## 17. Bubble `dataColors` uses `dataValues`, NOT `seriesByName(...)`

Canonical Splunk-doc pattern; differs from marker pattern.

```json
// marker layer
"dataColors": "> primary | seriesByName('bytes') | rangeValue(thresholdConfig)"

// bubble layer
"dataColors": "> dataValues | rangeValue(dataColorsEditorConfig)"
```

The bubble layer auto-exposes a `dataValues` frame derived from
`geostats` output. A `seriesByName(...)` chain on bubble dataColors
silently does nothing — bubbles render but stay theme-default
coloured.

See PATTERNS.md #9 (`viz_bubble_data_colors`) — direct adaptation of
the Splunk-ui Maps doc "Bubble Map example - dynamic coloring".
