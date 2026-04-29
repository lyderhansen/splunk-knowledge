---
name: ds-viz-map
description: Splunk Dashboard Studio splunk.map visualization — geographic Leaflet-style basemap with marker, bubble, and choropleth layers. Provides patterns for IP-origin marker maps, geostats bubble maps with dynamic colour, country-shaded choropleths via geom geo_countries, US state choropleths, styled tile-less maps, and the layer-vs-SPL-shape pairing rules. Use when the user asks about geographic maps, bubble maps, marker maps, choropleths, IP-location plots, regional shading, world/US maps, or "splunk.choropleth.map" (NOTE — that viz type does not exist in Dashboard Studio; the canonical pattern is a choropleth-typed layer inside splunk.map, documented here) in Splunk Dashboard Studio.
---

# splunk.map — geographic map

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `ds_viz_map_dark` / `ds_viz_map_light`.

A Leaflet-style basemap with **one or more layers** stacked on top:
pin markers, sized bubbles, or country/region shading (choropleth).

## When to use

- Geographic distribution of events — login origins, IPs, store
  locations, vehicle telemetry.
- Bubble-encoded magnitude on a map — request volume by city,
  bytes-out by region.
- Country / region shading — `choropleth` layer keyed off
  `geom geo_countries` or `geom geo_us_states`.

## When NOT to use

- **Flat geometric SVG fills without a basemap** → 
  `splunk.choropleth.svg`.
- **Abstract "world map" branding** with no real lat/lon data → 
  `splunk.image` with a static SVG.
- **Multi-layer marker + bubble + choropleth on one panel** —
  unreliable. Use separate panels per layer type. See
  [GOTCHAS.md](GOTCHAS.md) #16.

## Common confusions — `splunk.choropleth.map`

**There is no `splunk.choropleth.map` visualization in Dashboard
Studio.** If you saw it referenced in older notes, an LLM
hallucination, or a Classic Simple XML dashboard, the canonical
Studio pattern is a `choropleth`-typed layer inside `splunk.map`
(this skill).

| You want to… | Use |
|---|---|
| Shade countries / US states on a Leaflet basemap | `splunk.map` with `type: "choropleth"` layer (PATTERNS.md #5). |
| Choropleth + markers / bubbles in one view | **Two separate `splunk.map` panels.** Stacking is unreliable. See [GOTCHAS.md](GOTCHAS.md) #16. |
| Shade a country map WITHOUT a Leaflet basemap | `splunk.map` tile-less choropleth (PATTERNS.md #14) OR `splunk.choropleth.svg` with a country SVG. |
| Shade a building floor plan / custom polygons | `splunk.choropleth.svg`. |

The 10.4 PDF has a section titled "Choropleth map" (page 381, under
the Simple XML / Classic appendix) with `source` / `projection` /
`fillColor` / `strokeColor` options — **those do not apply to
Dashboard Studio**. A search across the 24k-line PDF for
`"type": "splunk.[a-z.]+"` yields exactly one choropleth viz type:
`splunk.choropleth.svg`. Splunk 10.2.1 rejects a panel with
`"type": "splunk.choropleth.map"` at validation time.

## Quick start — marker layer

```json
{
  "type": "splunk.map",
  "dataSources": { "primary": "ds_locations" },
  "options": {
    "layers": [
      {
        "type": "marker",
        "latitude":  "> primary | seriesByName('lat')",
        "longitude": "> primary | seriesByName('lon')",
        "dataColors": "> primary | seriesByName('bytes') | rangeValue(thresholds)",
        "additionalTooltipFields": ["city", "bytes"]
      }
    ],
    "center": [20, 0],
    "zoom": 1.5
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

## Layer-vs-SPL pairing rules (the most important table)

| Layer type | SPL shape | Latitude/longitude binding | Why |
|---|---|---|---|
| `marker` | Any `\| table lat lon …` | **Bind explicitly** `latitude` + `longitude`. | Marker reads numeric lat/lon columns from the table. |
| `bubble` | **Must** end in `\| geostats latfield=lat longfield=lon <metric> by <dim>`. | **Do NOT bind** `latitude`/`longitude` — silently ignored. Bind `bubbleSize` only. | `geostats` auto-emits `latitude`, `longitude`, `geobin`. Bubble layer consumes them implicitly. |
| `choropleth` | `\| geom geo_<lookup> featureIdField=<col>` OR `source: "geo://default/world"`. | Bind `areaIds` + `areaValues`. | Polygons come from a `geom` column or bundled GeoJSON source. |

Wrong pairing = silent empty panel. See [GOTCHAS.md](GOTCHAS.md) #15.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **`bubble`:** `\| geostats latfield=lat longfield=lon …`. | `\| stats count by lat lon` for bubble — empty panel. |
| **`bubble.bubbleSize`:** `frameWithoutSeriesNames("geobin", "latitude", "longitude") \| frameBySeriesTypes("number")`. | `seriesByName("count")` — produces unsized dots. |
| **`bubble.dataColors`:** `> dataValues \| rangeValue(...)`. | `seriesByName(...)` — silently does nothing on bubble. |
| **`geo_countries`:** full English country names (`United States`, `Norway`). | ISO-2 codes (`US`, `NO`) for `geo_countries` — all-NULL `geom`, panel renders as "no data" silently. |
| **`source: "geo://default/world"`:** ISO-2 codes (`US`, `NO`). | Full names — different lookup key. |
| **Choropleth:** include `tooltipHeaderField` (e.g. `"country"`). | Skip `tooltipHeaderField` — some Studio builds render the polygon empty without it. |
| **String `geom`:** `\| where isnotnull(geom) \| eval geom=tostring(geom)`. | `tostring(NULL)` → literal `"Null"` → panel dies with `Unexpected token 'N', "Null" is not valid JSON`. |
| **`center`:** `[lat, lon]` order. | `[lon, lat]` (GeoJSON convention) — silently mis-frames. |
| **Multi-layer:** one layer type per panel. | Stack `marker + bubble` (or `+ choropleth`) — second layer silently disappears. |
| **Tile-less map:** `showBaseLayer: false` + `backgroundColor` + `choroplethOpacity: 1.0` + `choroplethEmptyAreaColor`. | `showBaseLayer: false` alone — polygons render onto transparent canvas, panel goes black or theme-grey. |

## See also

- [PATTERNS.md](PATTERNS.md) — 15 verified patterns: marker auto-fit,
  marker thresholded, bubble sized, choropleth, scale-bar variants,
  resultLimit, bubble Type Map (data colors), styled tile-less world
  / US maps.
- [OPTIONS.md](OPTIONS.md) — top-level + per-layer options table.
- [GOTCHAS.md](GOTCHAS.md) — 17 verified traps including the
  `geo_countries`-vs-`geo://default/world` key-difference and the
  bubble/marker shape-mismatch trap.
- `ds-viz-choropleth-svg` — flat SVG without basemap.
- `ds-viz-singlevalue` — pair with map for KPI overlay.
- `ds-design-principles` — geographic colour discipline.
