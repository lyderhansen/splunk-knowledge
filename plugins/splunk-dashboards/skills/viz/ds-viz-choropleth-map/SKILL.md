---
name: ds-viz-choropleth-map
description: Disambiguation skill for splunk.choropleth.map — the visualization type does NOT exist in Splunk Dashboard Studio. Routes users to the correct answer for country/state shading (splunk.map with choropleth layer over geom geo_countries / geom geo_us_states) or custom-shape shading (splunk.choropleth.svg). Use when the user mentions "splunk.choropleth.map", "choropleth map type", "country shaded map", "US state heatmap", or seems to expect a standalone choropleth-map visualization in Splunk Dashboard Studio.
---

# ds-viz-choropleth-map — disambiguation

**There is no `splunk.choropleth.map` visualization in Dashboard Studio.**

If you saw it referenced in older notes, an LLM hallucination, or a
Classic Simple XML dashboard, this skill exists to redirect you to the
right answer.

## Quick redirect

| You want to... | Use |
|---|---|
| Shade countries / US states on a Leaflet basemap | `splunk.map` with `type: "choropleth"` layer (see `ds-viz-map`) |
| Choropleth + markers/bubbles in one view | **Two separate `splunk.map` panels** in the dashboard layout. Stacking unreliable. See `ds-viz-map` GOTCHAS #16. |
| Shade a building floor plan, OR theatre, custom polygons | `splunk.choropleth.svg` (see `ds-viz-choropleth-svg`) |
| Shade a country map WITHOUT a Leaflet basemap | `splunk.choropleth.svg` with a country SVG |
| Anything else (lat/lon points, bubbles only, marker clusters) | `splunk.map` |

## What you probably want — country/state on a real map

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
        "areaValues": "> primary | seriesByName('count')",
        "tooltipHeaderField": "> primary | seriesByName('country')"
      }
    ]
  },
  "dataSources": { "primary": "ds_country_counts" }
}
```

```spl
| inputlookup geomaps_data.csv
| iplocation device_ip
| lookup geo_countries latitude AS lat longitude AS lon OUTPUT featureId AS country
| stats distinct_count(device_ip) by country
| geom geo_countries featureIdField=country
```

Full options + gotchas → `ds-viz-map`.

## Why people get this wrong

The 10.4 PDF has a section titled "Choropleth map" (page 381, under
what appears to be a Simple XML / Classic dashboard appendix) with 4
options: `source`, `projection`, `fillColor`, `strokeColor`. **Those
options do not apply to Dashboard Studio.** Dashboard Studio uses the
Leaflet-based `splunk.map` and configures the choropleth via a layer.

Confirmation:

- A search across the 24k-line PDF for `"type": "splunk.[a-z.]+"`
  yields exactly **one** choropleth viz type — `splunk.choropleth.svg`.
- Splunk 10.2.1 rejects a panel with `"type": "splunk.choropleth.map"`
  at validation time. Verified empirically in `splunk-knowledge-testing`.

## See also

- `ds-viz-map` — the actual map viz type (Leaflet basemap, choropleth
  layer, option matrix).
- `ds-viz-choropleth-svg` — custom-SVG choropleth for non-map shapes.
- `ds-design-principles` — when a choropleth is the right answer in
  the first place.
