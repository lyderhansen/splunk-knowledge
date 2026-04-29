---
name: ds-viz-choropleth-svg
description: Splunk Dashboard Studio splunk.choropleth.svg visualization — data-driven colouring of regions inside an arbitrary SVG image. The escape hatch when no Leaflet basemap fits — floor plans, building schematics, network topology, custom regional shapes, datacenter rack grids, pipeline flow diagrams. Provides patterns for threshold palettes, smooth gradients, base64-encoded SVG embedding, and the canonical "<path id> + areaIds binding" recipe. Use when the user asks about SVG choropleth, floor plans, building maps, network topology, custom shapes, or data-driven SVG fills in Splunk Dashboard Studio.
---

# splunk.choropleth.svg — data-driven SVG fills

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_choropleth_svg_dark` /
`ds_viz_choropleth_svg_light`.

A "choropleth on a custom canvas". You provide an SVG with `<path>`
elements that have unique `id` attributes, and a search returning rows
matching those IDs to a numeric metric. Each path is filled with a
colour derived from its metric value.

## When to use

- **Floor plans / building schematics** — rack utilisation, room
  occupancy, sensor temperature, HVAC zones.
- **Custom regional maps** — sales territories, internal pipeline
  segments.
- **Process / topology diagrams** — colour each box (server, queue,
  pipeline stage) by health.
- **Anything where you've already designed the SVG** and just want
  Splunk to drive the fills.

## When NOT to use

- **Standard country / state shading** → `splunk.map` with a
  `choropleth` layer over `geom geo_countries` / `geom geo_us_states`.
- **lat/lon point data** → `splunk.map` (marker / bubble layers).
- **Diagrams that change with the data** (nodes appearing /
  disappearing) → `splunk.linkgraph` or `splunk.sankey`. SVG
  choropleth can only colour, not add/remove paths.

## Quick start

```json
{
  "type": "splunk.choropleth.svg",
  "dataSources": { "primary": "ds_load_by_rack" },
  "options": {
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 300\">...</svg>",
    "areaIds":    "> primary | seriesByName('rack')",
    "areaValues": "> primary | seriesByName('load')",
    "areaColors": "> primary | seriesByName('load') | rangeValue(thresholdConfig)"
  },
  "context": {
    "thresholdConfig": [
      { "from": 80,           "value": "#C2185B" },
      { "from": 50, "to": 80, "value": "#E89A2C" },
      {            "to": 50, "value": "#0E7C70" }
    ]
  }
}
```

Search emits a string column matching SVG path `id` values + a numeric
metric:

```spl
| inputlookup datacenter_load.csv
| stats avg(load) as load by rack
```

## SVG prerequisites

1. **Each region must be a `<path>` with a `d` attribute.** `<rect>`,
   `<circle>`, `<polygon>` are NOT picked up — only `<path>`.
2. **Each path must have a unique `id`.** Splunk only colours paths
   whose IDs match a row in the data source. **Case-sensitive**, no
   whitespace tolerance.
3. **Inline the SVG** — web-hosted SVG URLs are unsupported per the
   PDF prerequisites. Inline as `svg` value or use a
   `data:image/svg+xml` URI.
4. **Optimise first** — Inkscape "Save as Optimized SVG" or SVGOMG
   strips metadata that bloats raw exports.

See [SVG-AUTHORING.md](SVG-AUTHORING.md) for the full guide.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Path IDs:** match `areaIds` values **exactly** (case-sensitive). | `id="rack-a"` with data row `RACK-A` — silent no-fill. |
| **`<path d="...">`:** every coloured region. | `<rect>`, `<circle>`, `<polygon>` for coloured regions — Splunk skips them. Convert to paths in Inkscape. |
| **Embed inline** or `data:image/svg+xml` URI. | Web-hosted SVG URL — unsupported per PDF. |
| **Threshold config** in `context.<configName>`. | Inline thresholds in the option string — invalid DOS. |
| **`areaColors` is a DOS string:** `> primary \| seriesByName('<col>') \| rangeValue(<config>)`. | `"areaColors": "#FF0000"` — every region becomes literal string `#FF0000`, no fills. |
| **Decorations** (lines, labels, backgrounds) outside coloured paths. | Wrap labels inside `<path>` IDs — they pick up the fill colour. |
| **Encode large SVGs** as `data:image/svg+xml;base64,...`. | Inline 50 kB+ raw SVG in JSON — terse source matters for review. |
| **Drilldown payload:** `name` (path id) + `value` (metric). | Expect richer payload — only those two fields available. |

## Five options total

| Option | Type | Default | Notes |
|---|---|---|---|
| `svg`* | string | — | **Required.** Literal SVG markup OR `data:image/svg+xml;...` URI. |
| `areaIds` | string (DOS) | `> primary \| seriesByType("string")` | Column matching SVG path `id` values. |
| `areaValues` | string (DOS) | `> primary \| seriesByType("number")` | Numeric metric column. |
| `areaColors` | string (DOS) | `> areaValues \| rangeValue(areaColorsRangeConfig)` | Fill colour expression. Override with `rangeValue(<config>)` or `gradient(<config>)`. |
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | Panel background visible behind / around the SVG. |

That's the complete documented surface area. **No per-area opacity, no
stroke / hover style** — Splunk only sets `fill`.

## What does NOT work in the SVG

- **`<defs><image>` containing a base64 raster.** SVG wrapping a
  bitmap has no `<path>` elements with IDs. Convert blueprint to
  vector paths first (Inkscape: trace bitmap → save as plain SVG).
- **`<rect>`, `<circle>`, `<polygon>`** — Splunk only picks up
  `<path>` per the docs.
- **Web-hosted SVG URLs** — documented unsupported.

## Drilldown

Click on a path fires `onSelectionChanged` with:

- **`name`** — the path `id`
- **`value`** — the metric value

Wire those as tokens for "filter another panel by clicked region".

## Verified patterns

9 panels in `ds_viz_choropleth_svg_dark`:

1. Bare contract: `svg` + `areaIds` + `areaValues`. Default range
   palette.
2. Custom thresholded palette via `rangeValue(thresholdConfig)`.
3. Smooth gradient via `gradient(gradientConfig)`.
4. `backgroundColor` override.
5. **Office floor plan** — 7 rooms by occupancy.
6. **Network topology** — 8 service boxes + dependency lines.
7. **World continents** — 6 silhouettes traced from real coastline
   points (~25–50 vertices each), equirectangular projection.
8. **Datacenter rack grid** — 20 racks in 4×5 layout with cooling
   units. Verifies high-density floor plans.
9. **Pipeline process flow** — 6 chevron-shaped stages.

The richer SVGs (5–9) all use the same 5 documented options — variation
is in SVG geometry, not configuration.

## See also

- [SVG-AUTHORING.md](SVG-AUTHORING.md) — companion in this directory.
  JSON-escaping, path syntax, Inkscape/Illustrator exports,
  programmatic generation, projection helpers, label/stroke
  conventions, SVG-only pitfalls (winding, duplicate IDs).
- `ds-viz-map` — proper geographic map (Leaflet basemap, lat/lon,
  optional choropleth layer over `geom geo_countries`).
- `ds-viz-map` Common confusions — covers why `splunk.choropleth.map`
  doesn't exist and routes to either map (Leaflet) or this skill
  (custom SVG).
- `ds-viz-singlevalue` — layer KPIs on top of SVG choropleth.
- `ds-ref-design-principles` — when SVG choropleth is the right answer.
