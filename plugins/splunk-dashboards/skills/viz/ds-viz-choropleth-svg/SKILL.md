---

## name: ds-viz-choropleth-svg
description: |
  splunk.choropleth.svg - colour the regions of an arbitrary SVG image
  using a metric. The escape hatch when no Leaflet basemap fits: floor
  plans, building schematics, network topology, custom regional shapes.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_choropleth_svg_dark
  - ds_viz_choropleth_svg_light
related:
  - ds-viz-map
  - ds-viz-choropleth-map
  - ds-viz-singlevalue
  - ds-design-principles

# splunk.choropleth.svg

A "choropleth on a custom canvas". You provide an SVG image with `<path>`
elements that have unique `id` attributes, and a search that returns rows
matching those IDs to a numeric metric. Each path is filled with a colour
derived from its metric value.

This is the visualization to reach for when **the geometry isn't on a
map**: a data-center floor plan, a building blueprint, an OR theatre,
a custom region shape, a sports field, an organisational chart laid out
as boxes.

## When to use

- **Floor plans / building schematics** - rack utilisation, room
occupancy, sensor temperature, HVAC zones.
- **Custom regional maps** - sales territories that don't match any
political boundary, internal pipeline segments.
- **Process / topology diagrams** - colour each box (server, queue,
pipeline stage) by health.
- **Anything where you've already designed the SVG** and just want
Splunk to drive the fills.

## When NOT to use

- For **standard country / state shading**, use `splunk.map` with a
`choropleth` layer over the bundled `geom geo_countries` /
`geom geo_us_states` lookups, or `splunk.choropleth.map`. Those don't
require you to maintain an SVG.
- For **lat/lon point data**, use `splunk.map` (marker / bubble layers).
- For **business diagrams that change with the data** (nodes appearing /
disappearing), use `splunk.linkgraph` or `splunk.sankey`. SVG choropleth
can only colour - it cannot add or remove paths.

## SVG prerequisites

From the 10.4 PDF:

1. **Upload the SVG locally** - the docs say web-based image URLs are
  not supported. (One source-editor example uses a `multiFormat()`
   pointing at a `https://...` URL, but the prerequisites section is
   explicit; treat web URLs as unsupported.)
2. **Each region must be a `<path>` with a `d` attribute** - the path
  defines the polygon shape that will be filled.
3. **Each path must have a unique `id`** - this is what `areaIds`
  binds to. Splunk only colours paths whose IDs match a row in the
   data source.
4. **Optimise the SVG first** - tools like Inkscape ("Save as Optimized
  SVG") or [SVGOMG](https://jakearchibald.github.io/svgomg/) strip
   the metadata that bloats raw exports.

The `id` values are case-sensitive and must match the search column
exactly. A common workflow is:

- Bake the IDs into the SVG (e.g. `RACK-A`, `RACK-B`...).
- Drive a search that emits a column of those IDs plus a numeric
metric (e.g. `| stats avg(load) by rack`).

## Data shape

The search must return:

- A **string column** containing values that match the SVG path `id`
attributes. Bind it to `areaIds`.
- A **numeric column** to drive the fill colour. Bind it to
`areaValues`.

Trivial example data source:

```spl
| inputlookup datacenter_load.csv
| stats avg(load) as load by rack
```

Or, for a quick test, a `ds.test` block (used in the test dashboard):

```json
{
  "type": "ds.test",
  "options": {
    "data": {
      "fields": [{ "name": "rack" }, { "name": "load" }],
      "columns": [
        ["RACK-A", "RACK-B", "RACK-C", "RACK-D", "RACK-E"],
        [12, 47, 68, 85, 95]
      ]
    }
  }
}
```

## Options (10.4 PDF)

`splunk.choropleth.svg` has only **5 documented options**. There is no
border / stroke / hover-highlight option in the source editor - it's
deliberately minimal.


| Option            | Type   | Default                                            | Notes                                                                                                                                                           |
| ----------------- | ------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `svg`*            | string | `n/a`                                              | **Required.** Literal SVG markup OR a `data:image/svg+xml;...` URI. The PDF's prerequisites explicitly state web URLs are not supported.                        |
| `areaIds`         | string | `> primary | seriesByType("string")`               | DOS binding for the column matching SVG path `id` attributes.                                                                                                   |
| `areaValues`      | string | `> primary | seriesByType("number")`               | DOS binding for the numeric metric column.                                                                                                                      |
| `areaColors`      | string | `> areaValues | rangeValue(areaColorsRangeConfig)` | DOS binding for the fill colour. Default uses an auto-derived range palette over `areaValues`. Override with `rangeValue(<config>)`, `gradient(<config>)`, etc. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor`                  | Panel background colour visible behind / around the SVG.                                                                                                        |


That's the complete documented surface area.

## Drilldown / interactivity

Per the PDF event-payload table, clicking an area in
`splunk.choropleth.svg` fires `onSelectionChanged` with:

- **Name of the area clicked** (the path `id`)
- **Value of the area clicked** (the metric)

That's enough to wire a useful drilldown - "filter another panel by
the clicked region" - by exposing those fields as tokens on the
drilldown action.

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_choropleth_svg_dark` / `ds_viz_choropleth_svg_light`.


| Panel | What it demonstrates                                                                                                                                                                                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Bare contract: `svg` + `areaIds` + `areaValues`. Default range palette.                                                                                                                                                                                                                                                                             |
| 2     | Custom thresholded palette via `areaColors` + `rangeValue(thresholdConfig)`                                                                                                                                                                                                                                                                         |
| 3     | Smooth two-stop / three-stop gradient via `gradient(gradientConfig)`                                                                                                                                                                                                                                                                                |
| 4     | `backgroundColor` override (SVG without an opaque background rect)                                                                                                                                                                                                                                                                                  |
| 5     | **Office floor plan** - 7 rooms (lobby, meetings, open-plan, kitchen, server room, ops desk) shaded by occupancy. Real building schematic, threshold palette.                                                                                                                                                                                       |
| 6     | **Network topology** - 8 service boxes (edge LB, API GW, services, DB, cache, queue) with dependency lines. `<line>` connectors are part of the SVG, only `<path>` boxes are coloured. Threshold palette flags errors.                                                                                                                              |
| 7     | **World continents** - 6 continent silhouettes traced from real coastline points (~25-50 vertices each) in equirectangular projection. Includes a graticule (lon/lat grid + equator) as `<line>` decorations. NOT GIS-grade but recognisable; the pattern when continent-level shading is needed without `geom geo_countries`. Three-stop gradient. |
| 8     | **Datacenter rack grid** - 20 racks in 4 rows x 5 columns with cooling unit decorations. Verifies the viz scales to high-density floor plans. Four-stop gradient for power draw.                                                                                                                                                                    |
| 9     | **Pipeline process flow** - 6 chevron-shaped pipeline stages drawn as paths. Stage with worst lag pops red. Demonstrates non-rectangular paths.                                                                                                                                                                                                     |


The richer SVGs (panels 5-9) all use only the same five documented options

- the variation is in the SVG geometry, not the configuration. They are the
copy-paste patterns engineers will reach for when building real dashboards.

## Designing your SVG

> Full SVG-authoring reference: see `[SVG-AUTHORING.md](./SVG-AUTHORING.md)`
> alongside this file. It covers JSON-escaping, path syntax, working from
> Inkscape / Illustrator exports, programmatic generation patterns,
> projection helpers for map-style SVGs, label / stroke conventions,
> and SVG-only pitfalls (winding, tiny regions, duplicate IDs).

The five richer panels in the test dashboard cover the five real-world
SVG shapes engineers tend to need. Lift these patterns directly:

- **Building floor plan** - `<rect>`-shaped rooms converted to `<path>`
with `M x,y h w v h h -w z` form. Add an opaque background `<rect>`
for the building outline, leave corridors as a single non-coloured
path, and put text labels outside the coloured paths so they never
pick up the fill.
- **Network / dependency topology** - draw `<line>` connectors first
(lower in the SVG so coloured boxes paint on top), then service
boxes as `<path>` rectangles. Splunk only fills the `<path>`
elements; the lines stay their original stroke colour.
- **Stylised world map** - trace continent coastlines as `(lon, lat)`
tuples and project them through equirectangular into a 2:1 viewBox
(lon −180..180 → x 0..800; lat 90..−90 → y 0..400). 25-50 vertices
per continent gives a recognisable silhouette without ballooning the
JSON. Add a graticule (lon/lat grid lines + equator) as
`<line stroke-dasharray="2,3">` decorations so they don't get
filled. This is the right answer when you want continent-level
shading without dragging in `geom geo_countries` - use
`splunk.map` with the geo lookup if you need real GIS-grade country
boundaries.
- **Dense rack grid / heatmap** - rectangular paths in a regular
layout. The viz handles 20+ regions cleanly. Add subtle
decorations (cooling units, aisle markers) as non-`<path>`
elements so they don't pick up data.
- **Process / pipeline flow** - chevron paths with overlapping
edges (`M x,60 L x+120,60 L x+140,100 L x+120,140 L x,140 L x+20,100 Z`).
The visual flow direction is purely cosmetic - the choropleth
doesn't care about ordering.

For all of these, the same rules apply: every coloured region is a
`<path>` with a unique `id`, text labels are kept *outside* the
coloured paths, and the SVG `viewBox` should match the panel's
aspect ratio so nothing crops.

### What does NOT work

- **A `<defs><image>` containing a base64-encoded raster (PNG/JPG).**
An SVG that's just a wrapper around a bitmap has no `<path>`
elements with IDs, so the choropleth has nothing to colour. Convert
the floor plan / blueprint to vector paths first (Inkscape: trace
bitmap, then save as plain SVG).
- `**<rect>`, `<circle>`, `<polygon>`** - even with IDs, Splunk only
picks up `<path>` elements per the docs. Convert other shapes to
paths before exporting.
- **Web-hosted SVG URLs** - documented as not supported in the
prerequisites. Inline the markup or use a `data:image/svg+xml`
URI.

## Common gotchas

1. **Path IDs must match `areaIds` values exactly** - case-sensitive,
  no whitespace tolerance. `rack-a` will not match `RACK-A`.
2. **Every region must be a `<path d="...">`** - a `<rect>` or
  `<circle>` won't be picked up. If you draw rectangles in Inkscape,
   convert them to paths before exporting.
3. **Web SVG URLs are documented as unsupported.** The prerequisites
  section says "must upload locally". Embed the SVG inline as the
   `svg` value or use a data URI.
4. **There's no per-area opacity / stroke / hover style.** If you need
  a hover highlight, draw it into the SVG itself (e.g. via CSS) -
   Splunk only sets `fill`.
5. `**areaColors` is a DOS string, not a hex value.** If you write
  `"areaColors": "#FF0000"`, every region becomes the literal string
   `#FF0000` (uncoloured). The canonical form is
   `"> primary | seriesByName(\"<col>\") | rangeValue(<config>)"`.
6. **Threshold config goes in `context`.** Like every other Studio
  viz, the actual threshold table sits in the visualization's
   `context.<configName>`, not inline in the option string.
7. **Inline SVGs balloon JSON size.** Production-grade SVGs (a real
  building floor plan) can be tens of kB. If the dashboard JSON
   gets unwieldy, base64-encode the SVG and store it as
   `data:image/svg+xml;base64,...` - same render, terser source.
8. **No animation hooks.** SVG `<animate>` elements inside the
  uploaded SVG do still play if the runtime browser supports them,
   but Splunk doesn't drive any animation timing. Keep them subtle
   or omit entirely.

## Quick recipes

### Threshold palette (red / amber / green)

```json
{
  "viz_floor": {
    "type": "splunk.choropleth.svg",
    "dataSources": { "primary": "ds_load_by_rack" },
    "options": {
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 300\">...</svg>",
      "areaIds":    "> primary | seriesByName(\"rack\")",
      "areaValues": "> primary | seriesByName(\"load\")",
      "areaColors": "> primary | seriesByName(\"load\") | rangeValue(thresholdConfig)"
    },
    "context": {
      "thresholdConfig": [
        { "from": 80,           "value": "#C2185B" },
        { "from": 50, "to": 80, "value": "#E89A2C" },
        {            "to": 50, "value": "#0E7C70" }
      ]
    }
  }
}
```

### Smooth gradient

```json
{
  "viz_floor_gradient": {
    "type": "splunk.choropleth.svg",
    "dataSources": { "primary": "ds_load_by_rack" },
    "options": {
      "svg": "<svg ...>...</svg>",
      "areaIds":    "> primary | seriesByName(\"rack\")",
      "areaValues": "> primary | seriesByName(\"load\")",
      "areaColors": "> primary | seriesByName(\"load\") | gradient(gradientConfig)"
    },
    "context": {
      "gradientConfig": {
        "colors": ["#0E7C70", "#E89A2C", "#C2185B"]
      }
    }
  }
}
```

### Encoding the SVG as a data URI

If the inline SVG markup is too noisy, base64-encode it:

```bash
base64 -w0 floorplan.svg | pbcopy
```

Then in JSON:

```json
"svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIC4uLg=="
```

(Splunk strips the `data:` prefix and decodes; same render either way.)

### SPL pattern: lookup-keyed regions

A common production pattern - keep the path IDs in sync with a
lookup table:

```spl
| inputlookup buildings.csv
| join floor_id [
    search index=sensors
    | stats avg(temp) as temp by floor_id
  ]
| eval color_value = round(temp, 0)
| table floor_id color_value
```

Then bind `areaIds` to `floor_id` and `areaValues` to `color_value`.

## See also

- `[SVG-AUTHORING.md](./SVG-AUTHORING.md)` - companion file in this
same directory. Covers everything about *the SVG itself*:
JSON-escaping, path syntax, multi-region paths, working from
Inkscape/Illustrator exports, programmatic generation, projection
helpers, label/stroke conventions, light/dark theming, and SVG-only
pitfalls. Read this when you need to author a new SVG; this file
(`SKILL.md`) covers viz options and data binding.
- `ds-viz-map` - the proper geographic map (Leaflet basemap, lat/lon,
optional choropleth layer over `geom geo_countries`). Use this for
political-boundary shading (countries / US states); Studio renders
that as a `choropleth`-typed layer inside `splunk.map`.
- `ds-viz-choropleth-map` - **disambiguation skill**, not a separate
viz. `splunk.choropleth.map` does not exist in Dashboard Studio;
the skill exists to route users to either `ds-viz-map` (real-map
shading) or this skill (custom-SVG shading).
- `ds-viz-singlevalue` - layer KPIs on top of an SVG choropleth for
"highest-load rack" hero panels.
- `ds-design-principles` - when an SVG choropleth is the right answer
vs a table or a heatmap.

