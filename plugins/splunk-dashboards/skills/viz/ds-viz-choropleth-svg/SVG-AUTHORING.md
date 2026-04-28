# SVG authoring for `splunk.choropleth.svg`

How to write the SVG that powers a `splunk.choropleth.svg` panel.
Companion to `SKILL.md` - the skill covers options/data shape, this
covers the SVG itself.

> Most of the time you don't write SVG by hand. You start from an
> existing graphic (floor plan PDF, Visio diagram, traced map), strip
> it down to the minimum, and add `id` attributes. This guide covers
> both: the manual / programmatic path and the "convert what I already
> have" path.

## TL;DR contract

For every region you want to colour:

1. The SVG must contain a `<path id="<region-id>" d="…">`.
2. Region IDs must be **string-equal** to a value in the `areaIds`
  column of the data source (case-sensitive, no leading/trailing
   whitespace).
3. The `<path>` must be **closed** (end with `Z`).
4. Anything that's NOT a coloured region (background rect, labels,
  connectors, decorative lines, north arrows) should be drawn as
   anything **other than `<path>`** - typically `<rect>`, `<line>`,
   `<text>`, `<circle>`, `<polygon>`, etc. The viz only fills
   `<path>` elements.

That's the whole contract. Everything below is detail.

## Where the SVG goes in the dashboard JSON

The `svg` option on a `splunk.choropleth.svg` viz takes one of:

- An **inline SVG string** (the markup itself, JSON-escaped).
- A `**data:image/svg+xml`** URI.
- A **web URL** - documented as **not supported** in the 10.4 PDF
prerequisites. Don't. Inline it or use a data URI.

```json
{
  "viz_floor": {
    "type": "splunk.choropleth.svg",
    "options": {
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 400\">…</svg>",
      "areaIds":    "> primary | seriesByName(\"room\")",
      "areaValues": "> primary | seriesByName(\"occupancy\")"
    }
  }
}
```

### Inline SVG: JSON escaping

The SVG goes inside a JSON string, so:

- `"` (double quote) → `\"`
- `\` → `\\`
- newlines → strip them, or use `\n`

Easiest workflow: write your SVG as a separate `.svg` file with normal
double-quoted attributes, then JSON-encode the whole string in one
shot:

```python
import json
with open("floor.svg") as f:
    svg = f.read().strip()
print(json.dumps(svg))   # → "\"<svg …>…</svg>\""
```

Paste that into the dashboard JSON `"svg": …` slot **including** the
outer quotes that `json.dumps` produced (or, if you're editing by
hand, just the inner contents without the outer quotes - it's a
string field).

### Data URI alternative

If your SVG is enormous and the inline-string form is unreadable in
your dashboard JSON, use a data URI:

```json
"svg": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'>…</svg>"
```

A few notes:

- Use `;utf8,` not `;base64,` unless your SVG actually has non-ASCII
characters - `utf8` keeps the markup human-readable in the
dashboard JSON.
- Replace `"` inside the SVG with `'` (single quote) so the outer
JSON string can stay double-quoted without escaping.
- Some characters need URL-encoding (`#` becomes `%23`, `<>` for
some viewers - though Splunk's viz tolerates raw `<>` inside the
data URI in our tests).

> The PDF source-editor's `multiFormat()` example does technically
> show a hosted `https://` URL in the `svg` slot. **Do not copy
> this pattern.** The prerequisites later in the same PDF say web
> URLs are not supported - the docs disagree internally. Inline or
> data-URI is the only reliable form.

## SVG ↔ data binding

```text
SVG                                Data row
────────────────────────────────   ────────────────────────
<path id="LOBBY" d="…"/>           room=LOBBY,     occupancy=22
<path id="MEETING-1" d="…"/>       room=MEETING-1, occupancy=8
<path id="OPEN-PLAN" d="…"/>       room=OPEN-PLAN, occupancy=71
…                                  …
```

- `areaIds: "> primary | seriesByName(\"room\")"` tells the viz
which column carries the region IDs.
- `areaValues: "> primary | seriesByName(\"occupancy\")"` tells it
the metric column.
- The viz then walks the data, finds the matching `<path id=…>`,
and applies a colour computed from the metric.

If a row's ID has no matching `<path id>`, the row is silently
skipped. If a `<path id>` has no matching row, the path keeps its
original `fill=` (or transparent if none).

## Coordinate system

SVG default is `(0, 0)` top-left, +y down, +x right. The `viewBox`
attribute defines the *user units* the rest of the markup uses, and
the viz scales the SVG to fit the panel.

Pick a sensible viewBox once and use round-number coordinates:

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"> … </svg>
```

- `0 0 800 400` → 800 × 400 user units. A panel with a 2:1 aspect
ratio fits this perfectly. A square panel will scale (with
`preserveAspectRatio="xMidYMid meet"` defaults) to fit the longer
axis and letterbox the rest.
- For floor plans, an aspect ratio that matches the building works
better than forcing 2:1.
- For maps, use the projection's natural aspect:
  - **Equirectangular world**: 800 × 400 (2:1). Lon −180…180 → x
  0…800; lat 90…−90 → y 0…400.
  - **US (Albers / continental)**: ~960 × 600 works.

Stick to integers or one decimal place - `M27,55` is easier to
hand-edit than `M26.7,54.4`.

## Path syntax (the `d=` attribute)

You only need a tiny subset of the SVG path grammar:


| Cmd | Args                  | Meaning                             |
| --- | --------------------- | ----------------------------------- |
| `M` | `x,y`                 | Move to absolute (start a new path) |
| `L` | `x,y`                 | Line to absolute                    |
| `H` | `x`                   | Horizontal line to absolute x       |
| `V` | `y`                   | Vertical line to absolute y         |
| `Q` | `cx,cy x,y`           | Quadratic Bézier (one control pt)   |
| `C` | `c1x,c1y c2x,c2y x,y` | Cubic Bézier (two control)          |
| `Z` | (none)                | Close path back to last `M`         |


Lowercase variants are **relative** to the previous point. `h 100`
means "move 100 units right from where I am" - useful for
rectangle-style rooms:

```html
<path id="LOBBY" d="M40,60 h180 v160 h-180 z"/>
```

That's a 180×160 rectangle starting at (40, 60). Rooms drawn this
way are easy to lay out side-by-side with arithmetic.

For organic shapes (continents, parks), trace the boundary with
`L` and close with `Z`. For smooth coastline / river shapes, splice
in `Q` curves.

### Multi-region paths in one element

A single `<path>` can cover **disjoint** regions if you put multiple
`M…Z` subpaths in one `d=`:

```html
<path id="CORRIDOR"
      d="M20,180 h180 v200 h-180 z
         M200,320 h290 v60 h-290 z"/>
```

This treats both rectangles as the same region, so they fill with
one colour from one row of data. Useful for hallways made of
multiple connected rectangles, or "left and right halves" of a
building wing.

## Path IDs: rules

- **Case-sensitive**, **string-equal** match against `areaIds`.
- Recommended: ALL-CAPS with hyphens (`RACK-A`, `MEETING-1`,
`SVC-PAYMENTS`) - matches conventionally-named server / location
codes and reads cleanly in tooltips.
- Avoid spaces (legal in IDs, but harder to bind from SPL without
escaping).
- Avoid leading digits if you can (`r1`, `r2` is fine; `1`, `2`
works but is harder to read in inspector).
- **No duplicate IDs.** Two `<path id="RACK-A">` will only colour
the first one.

## What to draw as `<path>` and what NOT to


| Element              | `<path>`? | Notes                             |
| -------------------- | --------- | --------------------------------- |
| Coloured region      | YES       | Has `id`, the viz fills it.       |
| Background panel     | NO        | Use `<rect fill="…">`.            |
| Labels / text        | NO        | Use `<text>`.                     |
| Connector lines      | NO        | Use `<line>`.                     |
| Decorative shapes    | NO        | `<rect>`, `<circle>`, etc.        |
| Graticule / map grid | NO        | `<line>` with `stroke-dasharray`. |
| Legend swatches      | NO        | `<rect>` + `<text>`.              |


The viz's path-only fill rule means you can decorate freely without
worrying about decorations getting accidentally coloured - as long
as decorations aren't `<path>` elements.

If you must use a path for shape purposes (e.g. a chevron arrow as
decoration), give it a `pointer-events="none"` and don't put an
`id` on it - the viz only fills `<path>` elements that have an
`id`.

## Working from existing graphics

### From Inkscape / Illustrator

1. Open the source vector file.
2. Replace any `<rect>`, `<circle>`, `<polygon>`, `<ellipse>` you
  want to colour with `<path>` equivalents:
  - **Inkscape**: select the shape → `Path → Object to Path`
  (Ctrl+Shift+C).
  - **Illustrator**: `Object → Path → Convert to Path` or just
  export with "Convert shapes to paths" turned on.
3. Set the `id` on each path. In Inkscape, this is `Object
  Properties → Label/ID`. (The` id` field, not the label.)
4. Save as **Plain SVG** (Inkscape) or **SVG without editor data**
  (Illustrator) - this drops Inkscape/Adobe namespaces and shrinks
   the file 50-90%.
5. Open the saved file in a text editor and:
  - Strip `<sodipodi:namedview>`, `<inkscape:*>` elements,
   `<defs>` you don't need.
  - Strip `style="fill: …"` from the regions you'll colour - the
  viz will overwrite `fill` from `areaColors`, but a leftover
  stroke can clash with your design.
  - Verify all your `<path id="…">` elements have unique IDs.
6. Inline the cleaned SVG into the dashboard JSON.

### From a hand-drawn / scanned floor plan

1. Trace the bitmap to vectors:
  - **Inkscape**: `Path → Trace Bitmap` (Shift+Alt+B). Use the
   "Centerline" or "Brightness cutoff" mode for line-art floor
   plans.
2. Manually re-trace each room as a separate path so each room has
  its own ID. (Auto-tracing usually merges everything into one
   blob.) Use the **Bezier Pen tool** to click around each room's
   outline.
3. Set each path's ID explicitly.
4. Save as Plain SVG, then proceed with cleanup as above.

### Programmatically

For grids, racks, schematic diagrams: don't trace - generate.

```python
def rect_path(x, y, w, h):
    return f"M{x},{y} h{w} v{h} h-{w} z"

racks = []
for row, letter in enumerate("ABCD"):
    for col in range(1, 6):
        rack_id = f"{letter}{col}"
        x = 50 + col * 130 - 130
        y = 80 + row * 60
        racks.append(
            f'<path id="{rack_id}" d="{rect_path(x, y, 120, 50)}" '
            f'fill="#444" stroke="#3A4A6B" stroke-width="1"/>'
        )

print("\n".join(racks))
```

This is the cleanest path for high-density layouts: 20-100+
regions, regular grid, all the IDs follow a pattern.

For maps with real geography, project lon/lat into your viewBox
manually:

```python
def lonlat_to_xy(lon, lat, w=800, h=400):
    """Equirectangular: -180..180 lon → 0..w, 90..-90 lat → 0..h."""
    return (
        (lon + 180) * w / 360,
        (90 - lat) * h / 180,
    )
```

Trace coastlines as a list of `(lon, lat)` tuples, run them through
the projection, and emit `M x,y L x,y L x,y … Z`.

## Designing for the viz

A few things that make `splunk.choropleth.svg` panels look great
rather than "engineer-built":

### Region boundaries

Always have a `stroke=` on coloured regions:

```html
<path id="RACK-A" d="…" fill="#444" stroke="#3A4A6B" stroke-width="1"/>
```

Without a stroke, adjacent same-coloured regions visually merge
into one blob and the user can't tell where one rack ends and the
next begins.

`fill="#444"` is a placeholder - the viz will overwrite it from
`areaColors`. Set it to a "no data" colour that looks neutral
against your background.

### Labels

Put labels **outside** the coloured paths or use white text on top
with `font-weight="600"` and `pointer-events="none"`:

```html
<path id="RACK-A" d="…"/>
<text x="100" y="105" text-anchor="middle" fill="#fff"
      font-family="sans-serif" font-size="11" font-weight="600"
      pointer-events="none">Rack A</text>
```

`pointer-events="none"` is important: without it, the text catches
hover events instead of letting them pass through to the path
underneath, which breaks the choropleth tooltip.

If labels overlap the path strongly, consider drawing the label
twice - once with a thick dark `stroke` (for halo / readability),
once with a clean `fill` on top.

### Background

Add a panel-coloured background `<rect>` first, before any of your
content:

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
  <rect x="0" y="0" width="800" height="400" fill="#0F1F3D"/>
  …
</svg>
```

This makes the SVG self-contained: it'll render on a white page or
a dark page consistently. The `backgroundColor` viz option only
shows through the *gaps* in your SVG (anywhere your markup didn't
draw), so without an explicit background rect the panel can show
through awkwardly.

### Decorative grid (for maps)

Map-style SVGs benefit from a graticule:

```html
<line x1="0" y1="200" x2="800" y2="200"
      stroke="#2A3A6B" stroke-width="1.5"/>           <!-- equator -->
<line x1="200" y1="0" x2="200" y2="400"
      stroke="#1A2A4A" stroke-width="1"
      stroke-dasharray="2,3"/>                         <!-- meridian -->
```

These are `<line>` elements, so they don't get filled by the
choropleth.

### Light / dark themes

The dashboard's `make_light.py` script remaps colours when
generating the light variant. If your SVG has hardcoded hex codes
(`#0F1F3D`, `#444`, etc.), the script needs to know the dark→light
mapping for each one. Two options:

1. **Use existing palette colours** that are already in
  `make_light.py`'s `COLOR_MAP`. Look at the script and match the
   hex codes you bake into the SVG to known good ones.
2. **Add new mappings** to `make_light.py` when you introduce new
  colours. The script supports both 6-digit (`#1A2A4A`) and
   3-digit (`#1A2`) hex remaps.

3-digit hex codes (`#fff`, `#888`, `#444`) are common in
hand-written SVGs. The script handles them via `SHORT_HEX_RE` /
`SHORT_HEX_MAP`.

## Common SVG pitfalls

1. **Forgetting to close paths.** A path that doesn't end with `Z`
  may render as just an open stroke (no fill). Always close
   region paths.
2. **Wrong winding.** SVG's default fill rule is `nonzero`. Most
  simple polygons fill correctly regardless of winding direction,
   but complex paths with subpaths can flip-flop. If a region
   renders inside-out (the "hole" is filled, the "shape" is empty),
   add `fill-rule="evenodd"` on the `<path>` or reverse one of the
   subpath winding directions.
3. **Self-intersecting paths.** Crossing your own boundary creates
  triangle-shaped holes in the fill. Trace the boundary in one
   continuous direction without crossing back.
4. **Coordinates outside the viewBox.** Things that lie outside
  `viewBox` get clipped. Negative coordinates work, but they're
   surprising on hover (the user can't aim at something they can't
   see).
5. **Duplicate IDs.** Already mentioned but worth repeating - the
  viz colours the **first** match only.
6. **Overlapping paths.** If two paths overlap, the later one
  paints over the earlier one. Order matters - draw connectors
   first, regions on top, labels on top of regions.
7. **Tiny regions.** Paths smaller than ~10×10 user units are very
  hard to hover. Either scale them up, group them with adjacent
   regions, or use point markers (drawn as separate non-`<path>`
   elements) instead.
8. **Transparent coloured regions.** If `fill="rgba(…)"` or
  `fill-opacity` is set on a region, the viz overwrites `fill` but
   not `fill-opacity` - so the colour comes from the data but the
   transparency stays. This may or may not be what you want.

## What the viz does NOT do

- **No automatic projection.** You are responsible for the SVG's
geometry. The viz only fills paths.
- **No clipping to country boundaries.** If you want country-level
shading, use `splunk.map` with a `choropleth` layer over
`geom geo_countries` - the SVG choropleth is for *bespoke*
geometry.
- **No SVG animation.** `<animate>` and CSS transitions inside the
SVG aren't honoured by the viz runtime in any reliable way.
- **No external resources.** `<image href="…">` referencing a web
URL won't load. `xlink:href` to fonts, gradients defined in
`<defs>` work for one panel but won't transfer to PDF exports.
- **No JavaScript inside the SVG.** `<script>` is stripped.

## Example: minimum viable SVG

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300">
  <rect x="0" y="0" width="600" height="300" fill="#0F1F3D"/>
  <path id="A" d="M40,60  h100 v180 h-100 z" fill="#444"/>
  <path id="B" d="M160,60 h100 v180 h-100 z" fill="#444"/>
  <path id="C" d="M280,60 h100 v180 h-100 z" fill="#444"/>
  <text x="90"  y="160" text-anchor="middle" fill="#fff">A</text>
  <text x="210" y="160" text-anchor="middle" fill="#fff">B</text>
  <text x="330" y="160" text-anchor="middle" fill="#fff">C</text>
</svg>
```

That's the entire SVG contract. Three regions named `A`, `B`, `C`.
SPL emits a `region` column with values `A`, `B`, `C` and a metric
column. Done.

## Example: drilldown payload

When a user clicks a coloured region, the viz emits an
`onSelectionChanged` event with the path's `id` and the row's data:

```json
{
  "value": [
    { "name": "regionId", "value": "MEETING-1" },
    { "name": "occupancy", "value": 92 }
  ]
}
```

Wire that into a drilldown to filter another panel by the clicked
region:

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [
        { "token": "selected_room", "value": "$value.regionId$" }
      ]
    }
  }
]
```

The token then drives an SPL `where room="$selected_room$"` in a
downstream panel.

## See also

- `SKILL.md` - the option matrix, data shape, and verified patterns.
- `ds-viz-map` - when you want a real Leaflet basemap with bundled
geo lookups instead of a bespoke SVG.
- `ds-design-principles` - when a choropleth (any type) is the right
answer in the first place vs a bar chart or table.

