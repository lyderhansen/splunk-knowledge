---
name: ds-viz-choropleth-map
description: |
  Disambiguation + redirect skill. Triggers when a user asks about
  "splunk.choropleth.map", "choropleth map", "country shaded map", or
  "US state heatmap" in a Dashboard Studio context. Routes them to the
  correct visualization (splunk.map + choropleth layer) and explains why
  splunk.choropleth.map is NOT a Dashboard Studio viz type.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
related:
  - ds-viz-map
  - ds-viz-choropleth-svg
  - ds-design-principles
---

# ds-viz-choropleth-map — disambiguation

**There is no `splunk.choropleth.map` visualization in Dashboard Studio.**

If you saw it referenced in older notes, an LLM hallucination, or a
Classic Simple XML dashboard, this skill exists to redirect you to the
right answer.

## What you probably want

A choropleth in Dashboard Studio is **a layer inside `splunk.map`**, not
its own visualization type. Two flavours, depending on the geometry:

### 1. Country / US-state shading on a real map

Use `splunk.map` with a `choropleth`-typed layer over the bundled
`geom geo_countries` / `geom geo_us_states` lookups. This is the
canonical pattern from the 10.4 PDF (page 163, "Choropleth map example"):

```json
{
  "type": "splunk.map",
  "options": {
    "center": [0, 0],
    "zoom": 0.25,
    "layers": [
      {
        "type": "choropleth",
        "areaIds":    "> primary | seriesByName('country')",
        "areaValues": "> primary | seriesByName('count')"
      }
    ]
  },
  "dataSources": { "primary": "ds_country_counts" }
}
```

With the data source emitting:

```spl
| inputlookup geomaps_data.csv
| iplocation device_ip
| lookup geo_countries latitude AS lat longitude AS lon OUTPUT featureId AS country
| stats distinct_count(device_ip) by country
| geom geo_countries featureIdField=country
```

The full option matrix (top-level + `layers[]`) is documented in
**`ds-viz-map`** — read that skill, not this one.

### 2. Custom non-map geometries (floor plans, schematics, custom regions)

Use `splunk.choropleth.svg`. This DOES exist as a standalone viz type
with its own option set. Read **`ds-viz-choropleth-svg`** for the
floor-plan / building / topology pattern.

## Why people get this wrong

The 10.4 PDF has a section literally titled "Choropleth map" (page 381,
under what appears to be a Simple XML / Classic dashboard appendix) with
4 options: `source`, `projection`, `fillColor`, `strokeColor`. **Those
options do not apply to Dashboard Studio.** Dashboard Studio uses the
Leaflet-based `splunk.map` and configures the choropleth via a layer.

Confirmation:

- A search across the entire 24k-line PDF for `"type": "splunk.[a-z.]+"`
  yields exactly **one** choropleth viz type — `splunk.choropleth.svg`.
- Splunk 10.2.1 will reject a panel with `"type": "splunk.choropleth.map"`
  at validation time. Verified empirically in `splunk-knowledge-testing`.

## Decision tree

| You want to...                                                | Use                                          |
| ------------------------------------------------------------- | -------------------------------------------- |
| Shade countries / US states on a Leaflet basemap              | `splunk.map` with `type: "choropleth"` layer |
| Same, with markers / bubbles also on the map                  | `splunk.map` with multiple layers            |
| Shade a building floor plan, OR theatre, custom polygons      | `splunk.choropleth.svg`                      |
| Shade a country map without a Leaflet basemap                 | `splunk.choropleth.svg` with a country SVG   |
| Anything else (lat/lon points, bubbles only, marker clusters) | `splunk.map`                                 |

## See also

- `ds-viz-map` — `splunk.map` (the actual map viz type, including
  choropleth layers and the option matrix)
- `ds-viz-choropleth-svg` — `splunk.choropleth.svg` (custom-SVG choropleth)
- `ds-design-principles` — when a choropleth is the right answer in the
  first place
