---
name: ds-viz-rectangle
description: |
  splunk.rectangle - the workhorse shape for background cards, depth layers,
  pill chips, section dividers, and clickable hit-zones over images. Absolute
  layout only. Verified against the 10.4 Dashboard Studio docs.
version: 1.1.0
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

`splunk.rectangle` does not _require_ a data source - the shape is a
styling primitive and most rectangles ship with static colours.

But the PDF explicitly says of `fillColor` and `strokeColor`:

> "You may use a dataSource to apply the color."

That makes rectangles a first-class **status-card primitive**. The card's
fill (or stroke) flips colour based on a metric, with no markdown / KPI
overlay needed. Three colour-source patterns are documented and verified
in the test-dashboard:

### 1. Static colour (most common)

```json
"options": { "fillColor": "#1A2440" }
```

### 2. DOS-bound colour (data-driven status card)

> **DOS = Dynamic Options Syntax.** It's the small expression language
> Splunk Dashboard Studio uses to compute viz options from a data
> source. Every DOS expression starts with `>` and is a pipeline of
> picker → reducer → formatter functions. See the [DOS quick reference](#dos-dynamic-options-syntax-quick-reference)
> below for the full list of operators.

There are **two ways** to write a DOS-bound colour, and they look almost
identical until you try to round-trip through the Studio editor:

#### 2a. Canonical alias-in-context form (what the editor produces)

```json
"viz_health_card": {
  "type": "splunk.rectangle",
  "dataSources": { "primary": "ds_health" },
  "context": {
    "fillDataValue": "> primary | seriesByType(\"number\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 70,             "value": "#FF2D95" },
      { "from": 70, "to": 90, "value": "#FFB627" },
      { "from": 90,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

This is the form Splunk Studio's visual editor emits and round-trips
without warnings. Two ideas:

1. **`fillDataValue` (in `context`) reduces the data series to one
   number** with `lastPoint()` (or `max()`, `min()`, `sum()`, `count()`,
   `first()`, `last()`).
2. **`fillColor` (in `options`) references that alias** and pipes it
   through `rangeValue(<thresholdsVar>)`.

The naming convention is editor-driven: aliases that hold the source
value are usually called `fillDataValue` / `strokeDataValue`, and
threshold arrays are called `fillColorEditorConfig` /
`strokeColorEditorConfig`. You can name them anything — but using these
names means the visual editor will recognise and edit the panel without
re-writing your JSON.

#### 2b. Inline form (compact, hand-written)

```json
"options": {
  "fillColor": "> primary | seriesByType(\"number\") | lastPoint() | rangeValue(thresholds)",
  "strokeColor": "transparent"
},
"context": {
  "thresholds": [
    { "to": 70,             "value": "#FF2D95" },
    { "from": 70, "to": 90, "value": "#FFB627" },
    { "from": 90,           "value": "#33FF99" }
  ]
}
```

Same pipeline, fewer keys. The Studio editor will silently rewrite this
to the alias-in-context form on save.

#### Picker choice (`seriesByName` vs `seriesByType`)

| Picker                           | When to use                                      |
| -------------------------------- | ------------------------------------------------ |
| `seriesByName('health')`         | Explicit field name. Use when the result has multiple numerics. |
| `seriesByType("number")`         | First numeric column. Shorter; fine when there is only one numeric. |

Both produce identical output when the SPL ends with `| table health`
(only one numeric). The Studio UI generates the `seriesByType` form,
hand-edited dashboards more often write `seriesByName` for clarity.

#### `lastPoint()` is required

`rangeValue` operates on **a single number**, not on a series. The
pickers `seriesByName` / `seriesByType` return a series, so they must
be reduced before `rangeValue` sees the value. Use one of:

- `lastPoint()` — most recent point. The default for status cards.
- `max()` / `min()` — for "worst" / "best" of the window.
- `sum()` / `count()` — for aggregate metrics.
- `first()` / `last()` — for ordered series.

A pipeline missing the reducer (e.g. `> primary | seriesByType("number") | rangeValue(cfg)`)
**silently renders grey** — the renderer can't match a series against
numeric thresholds, so it falls back to the default colour. This is the
single most common reason a DOS-bound rectangle "looks broken". The
validator (`pipeline/ds-validate`) flags this as
`rangevalue-missing-reducer` / `rangevalue-alias-missing-reducer`.

#### Top-down threshold evaluation

`rangeValue(<thresholdsVar>)` evaluates buckets **top-down** — the first
matching `{from?, to?}` wins. Open-ended buckets (`{to: 70}` with no
`from`, `{from: 90}` with no `to`) catch the tails. Use this for
asymmetric thresholds (e.g. only flag when value is high).

You can bind **both** `fillColor` and `strokeColor` to the same data
source with **different** threshold tables — that's the canonical
"tinted card with a contrasting outline" pattern (panel 19 in the
test-dashboard).

### 3. Token-driven colour (input-driven status card)

```json
"options": { "fillColor": "$colour_token$" }
```

A `$token$` reference in `fillColor` reads from a dashboard input. Use
this for design previews, brand-colour pickers, or "pin a colour and let
the user override" panels. Token interpolation is plain string
substitution — the input must produce a valid hex string.

Pair with an `input.dropdown` (not `input.radio` — that type does **not
exist** in Dashboard Studio v2; see `interactivity/ds-inputs`). Verified
example:

```json
"input_colour_token": {
  "type": "input.dropdown",
  "title": "Card colour",
  "options": {
    "token": "card_colour",
    "defaultValue": "#26A69A",
    "items": [
      { "label": "Brand", "value": "#26A69A" },
      { "label": "Warn",  "value": "#FFB627" },
      { "label": "Crit",  "value": "#FF2D95" }
    ]
  }
}
```

Token-driven and DOS-bound are not mutually exclusive: an
`$colour_token$` expression can default to a DOS expression via the
input's `defaultValue`.

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

| Panel | What it demonstrates                                                            | Where to use                                          |
| ----- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1     | Default fill + stroke (theme defaults)                                          | Quick placeholder while iterating                     |
| 2     | Custom `fillColor` + transparent stroke                                         | Standard solid card                                   |
| 3     | `fillOpacity = 1` (default opacity)                                             | Reference baseline                                    |
| 4     | `fillOpacity = 0.5`                                                             | Layered cards on a coloured canvas                    |
| 5     | `fillOpacity = 0.15`                                                            | Watermarks, very subtle row stripes                   |
| 6     | `rx = 8` (subtle rounded corners)                                               | KPI cards, section backgrounds                        |
| 7     | `rx = 50` (pill / chip)                                                         | Status badges                                         |
| 8     | `strokeColor` + `strokeWidth = 2` + transparent fill                            | Outlined card                                         |
| 9     | `strokeWidth = 25` (max)                                                        | Demo of the upper bound; rarely useful in prod        |
| 10    | `strokeDashStyle = 6` dashed border                                             | Empty / placeholder slots                             |
| 11    | `strokeJoinStyle = round`                                                       | Soft-cornered outlines (visible at large strokeWidth) |
| 12    | `strokeJoinStyle = miter` (default)                                             | Sharp-cornered outlines (default)                     |
| 13    | `strokeOpacity = 0.4`                                                           | Soft accent border without fading the fill           |
| 14    | KPI card pattern (rectangle + singleValue overlay)                              | Canonical card-with-KPI recipe                        |
| 15    | Alias-in-context DOS `fillColor` + `rangeValue` (health low → red)              | Status card whose fill flips on a metric              |
| 16    | Alias-in-context DOS `fillColor` (health mid → amber)                           | Demonstrates top-down bucket evaluation               |
| 17    | Alias-in-context DOS `fillColor` with `seriesByType("number")` (health high → green) | Equivalent picker form when there's one numeric  |
| 18    | Alias-in-context DOS `strokeColor` + `rangeValue` (outlined status badge)       | Outlined status chip / brand-neutral card             |
| 19    | DOS `fillColor` + DOS `strokeColor` with separate `*EditorConfig` tables        | Tinted card with contrasting outline                  |
| 20    | Token-driven `fillColor` via `$colour_token$` + `input.dropdown`                | Design previews, brand-colour pickers                 |

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

### Data-driven status card (canonical alias-in-context form)

```json
"viz_health_card": {
  "type": "splunk.rectangle",
  "dataSources": { "primary": "ds_service_health" },
  "context": {
    "fillDataValue": "> primary | seriesByName(\"health\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 70,             "value": "#FF2D95" },
      { "from": 70, "to": 90, "value": "#FFB627" },
      { "from": 90,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

The card flips colour as `ds_service_health` updates. Pair with a
`splunk.markdown` overlay for the metric label and a `splunk.singlevalue`
for the value itself — the rectangle is the colour layer behind them.

This is the form the Splunk Studio editor produces. The inline
shorthand `"> primary | seriesByType(\"number\") | lastPoint() | rangeValue(thresholds)"`
also works, but Studio rewrites it on save.

> **Don't forget `lastPoint()`** between the picker and `rangeValue`,
> or the rectangle silently renders grey. See `pipeline/ds-validate`
> (`rangevalue-missing-reducer`).

### Token-driven card (input flips colour)

```json
"inputs": {
  "input_card_colour": {
    "type": "input.dropdown",
    "title": "Card colour",
    "options": {
      "token": "card_colour",
      "defaultValue": "#26A69A",
      "items": [
        { "label": "Brand", "value": "#26A69A" },
        { "label": "Warn",  "value": "#FFB627" },
        { "label": "Crit",  "value": "#FF2D95" }
      ]
    }
  }
},
"visualizations": {
  "viz_card": {
    "type": "splunk.rectangle",
    "options": {
      "fillColor": "$card_colour$",
      "strokeColor": "transparent",
      "rx": 8
    }
  }
}
```

Use for design previews, A/B branding, and "viewer-pinned" colour
overrides. The token must produce a valid hex string — `input.dropdown`
is the canonical single-select widget (there is no `input.radio` in
Dashboard Studio v2).

### Both fill and stroke bound (independent thresholds)

```json
"viz_emphasised_card": {
  "type": "splunk.rectangle",
  "dataSources": { "primary": "ds_service_health" },
  "context": {
    "fillDataValue":   "> primary | seriesByName(\"health\") | lastPoint()",
    "strokeDataValue": "> primary | seriesByName(\"health\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 70,             "value": "#FF2D95" },
      { "from": 70, "to": 90, "value": "#FFB627" },
      { "from": 90,           "value": "#33FF99" }
    ],
    "strokeColorEditorConfig": [
      { "to": 50,             "value": "#FF6B6B" },
      { "from": 50,           "value": "#E8E8E8" }
    ]
  },
  "options": {
    "fillColor":   "> fillDataValue   | rangeValue(fillColorEditorConfig)",
    "strokeColor": "> strokeDataValue | rangeValue(strokeColorEditorConfig)",
    "strokeWidth": 2,
    "rx": 8
  }
}
```

Two threshold tables on the same data source: the **fill** uses the full
3-bucket health gradient, the **stroke** flips at a different boundary
(50). Useful when the fill is the headline state and the stroke is a
secondary "needs attention" signal that fires at a different threshold.

## DOS (Dynamic Options Syntax) quick reference

DOS is the small expression language Studio uses to compute viz options
from a `dataSource` or another option. Every DOS expression starts with
`>` and is a pipeline of operators separated by `|`.

| Stage         | Common operators                                                 | Returns                  |
| ------------- | ---------------------------------------------------------------- | ------------------------ |
| **Source**    | `primary`, `<datasource_id>`, `<context_alias>`                  | series or value          |
| **Picker**    | `seriesByName("col")`, `seriesByType("number")`, `seriesByIndex(0)` | series                |
| **Reducer**   | `lastPoint()`, `max()`, `min()`, `sum()`, `count()`, `first()`, `last()` | single value     |
| **Selector**  | `rangeValue(<cfg>)`, `pickValue(<map>)`, `gradient(<cfg>)`       | colour / value           |
| **Format**    | `formatByType(<cfg>)`, `frame(...)`, `objects()`, `prepend(...)` | shaped data              |

Composition: every option binding follows a `Source | Picker | Reducer
| Selector` shape. `seriesByX` always needs a reducer before
`rangeValue`. Aliases declared in `context` can hold either source data
(`> primary | seriesBy... | lastPoint()`) or config arrays
(`[{from, to, value}]`); options reference them by bare name.

## See also

- `ds-viz-ellipse` - same option surface, but circular / oval shape
- `ds-viz-image` - photographic / SVG content (PDF export caveats apply)
- `ds-viz-markdown` - typographic content; pair with rectangles for KPI
  card titles and pill labels
- `ds-design-principles` - when to reach for a rectangle vs another
  primitive, and how to compose them into the canonical "card with KPI"
  recipe
