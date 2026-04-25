---
name: ds-viz-rectangle
description: |
  splunk.rectangle - the workhorse shape for background cards, depth layers,
  pill chips, section dividers, and clickable hit-zones over images. Absolute
  layout only. Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_rectangle_dark
  - ds_viz_rectangle_light
related:
  - ds-viz-ellipse
  - ds-viz-image
  - ds-viz-markdown
  - ds-design-principles
---

# splunk.rectangle

The flat shape primitive in Dashboard Studio. Cheap, fast, and PDF-export-safe.
Use it any time you need a coloured background, a card behind a KPI, a pill
chip, a status badge, a section divider, or a clickable region overlaid on an
image.

## When to use

- **Background cards** behind KPIs, charts, and tables to create depth.
- **Section dividers** between groups of panels (full-width thin rectangles).
- **Pill chips** for status badges (`rx >= h/2`).
- **Outlined cards** with a coloured stroke for emphasis.
- **Clickable hit-zones** placed over `splunk.image` panels (floor plans,
  diagrams). Rectangles fire `onSelectionChanged`.
- **Empty-slot placeholders** with a dashed border.
- **Colour swatches** in legends or design-system documentation panels.

## When NOT to use

- For **circles or oval highlights** - use `splunk.ellipse`.
- For **photographic content / logos / diagrams** - use `splunk.image`.
- For **typographic content** (titles, kickers, paragraphs) - use
  `splunk.markdown`. Rectangles render no text.
- For **drop shadows or blurs** - Dashboard Studio has no shadow primitive.
  Approximate with a slightly larger, faintly-filled rectangle behind the
  card.
- In **grid** layouts - rectangles only render in **absolute** layout.

## Data shape

`splunk.rectangle` does not take a data source by default. The shape is
purely a styling primitive.

That said, the PDF says of `fillColor` and `strokeColor`:

> "You may use a dataSource to apply the color."

So you _can_ bind a colour to a search via DOS (Dynamic Options Syntax) -
e.g. a status card whose fill colour is `> primary | rangeValue(...)`. This
is uncommon. Most rectangles ship with static colours.

## Options (10.4 PDF)

The 10.4 PDF lists exactly **9 options**. There are no others. Both the UI
and source-editor option tables agree.

| Option            | Type                                                | Default                       | Notes                                                                                            |
| ----------------- | --------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `fillColor`       | string (hex `#RRGGBB`)                              | `> themes.defaultFillColor`   | Enterprise dark `#31373E`, prisma dark `#0B0C0E`, enterprise light `#C3CBD4`. DOS-bindable.      |
| `fillOpacity`     | number 0 - 1 (or `"80%"` string in UI)              | `1`                           | Useful for layered cards. `0` = invisible.                                                       |
| `rx`              | number (px) or % (>=0)                              | `0`                           | Horizontal corner radius.                                                                        |
| `ry`              | number (px) or % (>=0)                              | `> rx`                        | Vertical corner radius. Defaults to `rx`. Set independently for elliptical corners.              |
| `strokeColor`     | string (hex)                                        | `> themes.defaultStrokeColor` | Enterprise dark `#C3CBD4`, prisma dark `#ACACAD`, enterprise light `#3C444D`. DOS-bindable.      |
| `strokeDashStyle` | number (px)                                         | `0` (solid)                   | Dash & gap length, both equal. `6` => 6px dashes, 6px gaps. Higher = more space between dashes. |
| `strokeJoinStyle` | `arcs` \| `bevel` \| `miter` \| `miter-clip` \| `round` | `miter`                       | Corner join shape of the stroke path. Visible only at large `strokeWidth`.                      |
| `strokeOpacity`   | number 0 - 1                                        | `1`                           | Independent of `fillOpacity`.                                                                    |
| `strokeWidth`     | number 1 - 25 (px)                                  | `1`                           | Hard-clipped at 25 per the PDF.                                                                  |

The canonical option names are `fillColor` / `strokeColor`. Some older PDF
examples write `fill` / `stroke` (no "Color" suffix); those are legacy and
not in the 10.4 option table - use the long form.

## Layout: absolute only

Like all shape primitives, `splunk.rectangle` only renders inside an
`absolute` layout. Pasting it into a grid layout fails silently.

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 900 },
  "structure": [
    { "item": "viz_card", "type": "block", "position": { "x": 20, "y": 20, "w": 320, "h": 160 } }
  ]
}
```

## Layering (z-order)

Z-order follows the order of the `structure` array:

- Earlier item -> rendered **first** -> visually **behind**.
- Later item -> rendered **after** -> visually **in front**.

The canonical "KPI card" pattern is:

```json
"structure": [
  { "item": "viz_card_background", "position": { "x": 20,  "y": 20, "w": 320, "h": 160 } },
  { "item": "viz_card_kpi",        "position": { "x": 40,  "y": 50, "w": 280, "h": 100 } }
]
```

`viz_card_background` is a `splunk.rectangle`; `viz_card_kpi` is a
`splunk.singlevalue` with `backgroundColor: "transparent"`. The KPI sits on
top because it's later in the array.

## Drilldown / interactivity

`splunk.rectangle` **does** support `onSelectionChanged` events - this is
the reason it's the recommended primitive for "click a region of the floor
plan to drill down". Both the official drilldown table and the example
dashboards use rectangles for this.

For each clickable hit-zone:

1. Place the underlying `splunk.image` at coordinates `(x, y, w, h)`.
2. On top, place a `splunk.rectangle` with `fillColor: "transparent"` and
   `strokeColor: "transparent"` (so it's invisible but still clickable).
3. Wire up the rectangle's `eventHandlers` -> `setToken` /
   `link.navigate.url`.

When the user clicks the (invisible) rectangle, your handler fires with the
rectangle's `viz_id` - which you can map to a downstream search.

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_rectangle_dark` / `ds_viz_rectangle_light`.

| Panel | What it demonstrates                                     | Where to use                                    |
| ----- | -------------------------------------------------------- | ----------------------------------------------- |
| 1     | Default fill + stroke (theme defaults)                   | Quick placeholder while iterating               |
| 2     | Custom `fillColor` + transparent stroke                  | Standard solid card                             |
| 3     | `fillOpacity = 1` (default opacity)                      | Reference baseline                              |
| 4     | `fillOpacity = 0.5`                                      | Layered cards on a coloured canvas              |
| 5     | `fillOpacity = 0.15`                                     | Watermarks, very subtle row stripes             |
| 6     | `rx = 8` (subtle rounded corners)                        | KPI cards, section backgrounds                  |
| 7     | `rx = 50` (pill / chip)                                  | Status badges                                   |
| 8     | `strokeColor` + `strokeWidth = 2` + transparent fill     | Outlined card                                   |
| 9     | `strokeWidth = 25` (max)                                 | Demo of the upper bound; rarely useful in prod  |
| 10    | `strokeDashStyle = 6` dashed border                      | Empty / placeholder slots                       |
| 11    | `strokeJoinStyle = round`                                | Soft-cornered outlines (visible at large strokeWidth) |
| 12    | `strokeJoinStyle = miter` (default)                      | Sharp-cornered outlines (default)               |
| 13    | `strokeOpacity = 0.4`                                    | Soft accent border without fading the fill      |
| 14    | KPI card pattern (rectangle + singleValue overlay)       | Canonical card-with-KPI recipe                  |

## Common gotchas

1. **No grid-layout support.** `splunk.rectangle` requires an absolute
   layout. Pasting into a grid dashboard fails to render.
2. **`strokeWidth` is clipped at 25 px.** Anything above 25 is silently
   capped per the PDF.
3. **`strokeJoinStyle` is invisible at small `strokeWidth`.** You won't see
   a difference between `miter` and `round` at `strokeWidth: 1`. Bump
   `strokeWidth` to 8+ to see the join shape.
4. **`rx` interacts with `strokeJoinStyle`.** When `rx > 0`, the corners are
   already curved, so `strokeJoinStyle: round` adds nothing visible. Set
   `rx: 0` to see the join style work.
5. **`fillOpacity` and `strokeOpacity` are independent.** A faded fill with
   a solid stroke is a common card pattern; don't tie them together.
6. **No drop shadow / blur primitives.** To approximate elevation, layer a
   slightly larger, very faint rectangle (e.g. `fillOpacity: 0.08`,
   `rx: 12`) **behind** the card. Z-order matters.
7. **No text rendering.** Rectangles never display text. Always pair with
   `splunk.markdown` or `splunk.singlevalue` on top.
8. **`fill` / `stroke` (without "Color") may appear in older example
   dashboards** - use the canonical `fillColor` / `strokeColor` from the
   10.4 option table. Older properties may stop working.
9. **Transparent rectangles are still clickable.** Set both `fillColor` and
   `strokeColor` to `"transparent"` and the panel still fires
   `onSelectionChanged`. This is the foundation of "image hit-zones".
10. **Default fill is theme-dependent.** A rectangle with `options: {}`
    will look different in dark vs light. Always set `fillColor`
    explicitly for shipped dashboards.

## Quick recipes

### KPI card with a tinted background

```json
{
  "viz_card": {
    "type": "splunk.rectangle",
    "options": {
      "fillColor": "#1A2440",
      "fillOpacity": 0.95,
      "strokeColor": "transparent",
      "rx": 8
    }
  }
}
```

Layout: place the singleValue on top, with `backgroundColor: "transparent"`.

### Outlined card (no fill, branded stroke)

```json
{
  "viz_outline_card": {
    "type": "splunk.rectangle",
    "options": {
      "fillColor": "transparent",
      "strokeColor": "#26A69A",
      "strokeWidth": 2,
      "rx": 6
    }
  }
}
```

### Status pill / chip

```json
{
  "viz_status_pill": {
    "type": "splunk.rectangle",
    "options": {
      "fillColor": "#E8F5E9",
      "strokeColor": "#0E7C70",
      "strokeWidth": 1,
      "rx": 50
    }
  }
}
```

Pair with `splunk.markdown` on top for the label text. `rx >= height/2` =>
fully rounded ends.

### Dashed empty-slot

```json
{
  "viz_empty_slot": {
    "type": "splunk.rectangle",
    "options": {
      "fillColor": "transparent",
      "strokeColor": "#C3CBD4",
      "strokeWidth": 2,
      "strokeDashStyle": 6,
      "rx": 4
    }
  }
}
```

### Faux drop-shadow (two rectangles)

```json
"structure": [
  { "item": "viz_shadow", "position": { "x": 22, "y": 24, "w": 320, "h": 162 } },
  { "item": "viz_card",   "position": { "x": 20, "y": 20, "w": 320, "h": 160 } }
]
```

```json
"viz_shadow": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#000000",
    "fillOpacity": 0.15,
    "strokeColor": "transparent",
    "rx": 8
  }
},
"viz_card": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#1A2440",
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

The shadow is placed slightly down-and-right of the card and rendered
**first** (so it sits behind).

### Invisible click-target over an image

```json
"viz_image_floor_plan": {
  "type": "splunk.image",
  "options": { "src": "/storage/.../floor.png", "preserveAspectRatio": true }
},
"viz_room_a_hitzone": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "transparent",
    "strokeColor": "transparent"
  }
}
```

```json
"structure": [
  { "item": "viz_image_floor_plan",   "position": { "x": 20,  "y": 20,  "w": 1400, "h": 700 } },
  { "item": "viz_room_a_hitzone",     "position": { "x": 320, "y": 200, "w": 180,  "h": 120 } }
]
```

Wire `viz_room_a_hitzone` to a drilldown handler. The user sees the floor
plan and clicks "Room A"; your handler fires.

## See also

- `ds-viz-ellipse` - same option surface, but circular / oval shape
- `ds-viz-image` - photographic / SVG content (PDF export caveats apply)
- `ds-viz-markdown` - typographic content; pair with rectangles for KPI
  card titles and pill labels
- `ds-design-principles` - when to reach for a rectangle vs another
  primitive, and how to compose them into the canonical "card with KPI"
  recipe
