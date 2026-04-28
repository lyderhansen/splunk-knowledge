---
name: ds-viz-ellipse
description: |
  splunk.ellipse - the circular shape primitive for status dots, KPI accent
  rings, donut outlines, and faint background blobs. Absolute layout only.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.2.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_ellipse_dark
  - ds_viz_ellipse_light
related:
  - ds-viz-rectangle
  - ds-viz-singlevalue
  - ds-viz-markdown
  - ds-design-principles
lessons:
  - "rangeValue bucket semantics: 'from' is inclusive (>=), 'to' is exclusive (<). The boundary value 60 lands in {from:60, to:80}, not in {to:60}."
  - "Top-down evaluation means overlapping buckets silently mis-route values. Bug surfaced as 'amber dot rendered red' in test panels because {to:70} caught everything below 70 first."
  - "Demo verification: drive each bucket with at least one value in its interior. Three buckets need three test values."
---

# splunk.ellipse

The circular / oval shape primitive in Dashboard Studio. Same purpose as
`splunk.rectangle` but with curves: status dots, decorative blobs, KPI
accent rings, donut outlines, and circular swatches.

## When to use

- **Status dots / health indicators** (tiny circles next to labels).
- **KPI accent rings** behind a circular `splunk.singlevalue`.
- **Donut outlines** - transparent fill + thick stroke.
- **Faint background blobs** - large radius, very low `fillOpacity`,
  decorative only.
- **Legend swatches** for circular plot markers (bubble, scatter, marker
  gauge).
- **Pictographic accents** in storytelling dashboards.

## When NOT to use

- For **rectangular cards / pills** - use `splunk.rectangle` (it has
  `rx`/`ry` for rounded-corner pills, ellipses do not).
- For **photographic content** - use `splunk.image`.
- For **typographic content** - use `splunk.markdown` (ellipses render no
  text).
- In **grid** layouts - ellipses only render in **absolute** layout.
- For **large, content-heavy backgrounds** - rectangles compose better
  with grids of KPIs.

## Data shape

`splunk.ellipse` does not _require_ a data source - the shape is a
styling primitive and most ellipses ship with static colours.

But the PDF explicitly says of `fillColor` / `strokeColor`:

> "You may use a dataSource to apply the color."

That makes ellipses a first-class **status-dot primitive**. The dot
flips green / amber / red based on a metric, with no overlay needed.
Three colour-source patterns are documented and verified in the
test-dashboard:

### 1. Static colour (most common)

```json
"options": { "fillColor": "#0E7C70" }
```

### 2. DOS-bound colour (data-driven status dot)

> **DOS = Dynamic Options Syntax.** It's the small expression language
> Splunk Dashboard Studio uses to compute viz options from a data
> source. Every DOS expression starts with `>` and is a pipeline of
> picker → reducer → formatter functions. See the [DOS quick reference](#dos-dynamic-options-syntax-quick-reference)
> below.

There are **two ways** to write a DOS-bound colour, both verified
against `ds_viz_ellipse_dark` / `_light`:

#### 2a. Canonical alias-in-context form (what the editor produces)

```json
"viz_health_dot": {
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_health" },
  "context": {
    "fillDataValue": "> primary | seriesByType(\"number\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent"
  }
}
```

This is what Splunk Studio's visual editor emits and round-trips. Two
ideas:

1. **`fillDataValue` (in `context`) reduces the data series to one
   number** with `lastPoint()` (or `max()`, `min()`, `sum()`, `count()`,
   `first()`, `last()`).
2. **`fillColor` (in `options`) references that alias** and pipes it
   through `rangeValue(<thresholdsVar>)`.

The editor uses the names `fillDataValue` / `strokeDataValue` for the
source-value aliases and `fillColorEditorConfig` /
`strokeColorEditorConfig` for the threshold arrays. You can name them
anything — but using these names means the visual editor will recognise
and edit the panel without re-writing your JSON.

#### 2b. Inline form (compact, hand-written)

```json
"options": {
  "fillColor": "> primary | seriesByType(\"number\") | lastPoint() | rangeValue(thresholds)",
  "strokeColor": "transparent"
},
"context": {
  "thresholds": [
    { "to": 60,             "value": "#FF2D95" },
    { "from": 60, "to": 80, "value": "#FFB627" },
    { "from": 80,           "value": "#33FF99" }
  ]
}
```

Same pipeline, fewer keys. The Studio editor will silently rewrite this
to the alias-in-context form on save.

#### Picker choice (`seriesByName` vs `seriesByType`)

| Picker                           | When to use                                                       |
| -------------------------------- | ----------------------------------------------------------------- |
| `seriesByName('health')`         | Explicit field name. Use when the result has multiple numerics.   |
| `seriesByType("number")`         | First numeric column. Shorter; fine when there is only one.       |

Both produce identical output when the SPL ends with `| table health`
(only one numeric). The Splunk UI generates `seriesByType` by default,
hand-edited dashboards more often write `seriesByName` for clarity.

#### `lastPoint()` is required

`rangeValue` operates on **a single number**, not on a series. The
pickers `seriesByName` / `seriesByType` return a series, so they must
be reduced before `rangeValue` sees the value. Use one of:

- `lastPoint()` — most recent point. The default for status dots.
- `max()` / `min()` — for "worst" / "best" of the window.
- `sum()` / `count()` — for aggregate metrics.
- `first()` / `last()` — for ordered series.

A pipeline missing the reducer (e.g. `> primary | seriesByType("number") | rangeValue(cfg)`)
**silently renders grey** — the renderer can't match a series against
numeric thresholds, so it falls back to the default colour. This is the
single most common reason a DOS-bound ellipse "looks broken". The
validator (`pipeline/ds-validate`) flags this as
`rangevalue-missing-reducer` / `rangevalue-alias-missing-reducer`.

#### Threshold buckets — semantics and pitfalls

Each bucket is `{ "from": <num>, "to": <num>, "value": "<colour>" }`
where:

- `from` is the **inclusive** lower bound. A value `x` matches when `x >= from`.
- `to` is the **exclusive** upper bound. A value `x` matches when `x < to`.
- Either side may be omitted: `{ "to": 60 }` means `x < 60`, and
  `{ "from": 80 }` means `x >= 80`.

This is verified against the Dashboard Studio 10.4 PDF (page 51,
trendColor example): "below 0" matches `{ to: 0 }`, "0 or higher"
matches `{ from: 0 }`. Combined with the rule that `rangeValue`
evaluates buckets **top-down** (first match wins), this means **bucket
order changes the result** when buckets overlap.

**Three failure modes to design around:**

**1. Overlapping buckets** — the most common bug. Two buckets that
both match the same value. The first one wins, the second is dead.
This is what causes "amber values render red".

```json
// BUG: 60 matches the FIRST bucket because to:70 is exclusive of 70 but
// inclusive of everything below it. 60 < 70, so 60 -> red, not amber.
[
  { "to": 70,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

```json
// FIX: disjoint buckets. 60 falls into the middle bucket -> amber.
[
  { "to": 60,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 80,           "value": "#33FF99" }
]
```

**2. Threshold values that don't match the data domain.** If the data
ranges 0-100 but your buckets only flip at 70 and 90, every value
below 70 is the same colour. That's correct semantics but bad demo
design — the middle bucket has zero pedagogical value. Always pick
buckets so each *meaningful* segment of the data domain falls into
its own bucket.

**3. Gaps between buckets.** A value can fall outside every bucket
when the upper bound of one and the lower bound of the next don't
meet. The viz silently falls back to the default colour (typically
gray).

```json
// BUG: 80 matches NO bucket. {to:80} excludes 80, {from:81} excludes <=80.
// Result: 80 -> default colour (often gray).
[
  { "to": 60,             "value": "#FF2D95" },
  { "from": 60, "to": 80, "value": "#FFB627" },
  { "from": 81,           "value": "#33FF99" }
]
```

**Rule of thumb (RAG status dot):** for three colours covering domain
`[0, 100]` with critical < 60, warning 60-80, healthy >= 80:

```json
[
  { "to": 60,             "value": "#FF2D95" },   // x < 60          -> red
  { "from": 60, "to": 80, "value": "#FFB627" },   // 60 <= x < 80    -> amber
  { "from": 80,           "value": "#33FF99" }    // 80 <= x         -> green
]
```

This is the canonical disjoint shape: contiguous, non-overlapping,
domain-covering. The validator (`pipeline/ds-validate`) flags
overlapping ranges as `rangevalue-bucket-overlap` and gaps as
`rangevalue-bucket-gap`.

You can bind **both** `fillColor` and `strokeColor` to the same data
source with **different** threshold tables — the donut becomes a
"colour-on-colour" KPI ring that flips on the same metric but at
different boundaries.

### 3. Token-driven colour (input-driven status dot)

```json
"options": { "fillColor": "$colour_token$" }
```

A `$token$` reference reads from a dashboard input. Use for design
previews, brand-colour pickers, or "viewer-pinned" overrides. The token
must produce a valid hex string.

Pair with an `input.dropdown` (not `input.radio` — that type does **not
exist** in Dashboard Studio v2; see `interactivity/ds-inputs`):

```json
"input_colour_token": {
  "type": "input.dropdown",
  "title": "Dot colour",
  "options": {
    "token": "dot_colour",
    "defaultValue": "#33FF99",
    "items": [
      { "label": "OK",   "value": "#33FF99" },
      { "label": "Warn", "value": "#FFB627" },
      { "label": "Crit", "value": "#FF2D95" }
    ]
  }
}
```

## Options (10.4 PDF)

The 10.4 PDF lists exactly **6 options**. There are **no** corner-radius
options (`rx`/`ry`) and **no** `strokeJoinStyle` option - shape and
straightness aren't applicable to ellipses.

| Option            | Type                  | Default                       | Notes                                                                                                                                |
| ----------------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `fillColor`       | string (hex)          | `> themes.defaultFillColor`   | Enterprise dark `#31373E`, prisma dark `#0B0C0E`, enterprise light `#C3CBD4`. DOS-bindable.                                          |
| `fillOpacity`     | number 0 - 1          | `1`                           | UI also accepts `"80%"`.                                                                                                             |
| `strokeColor`     | string (hex)          | `> themes.defaultStrokeColor` | Enterprise dark `#C3CBD4`, prisma dark `#ACACAD`, enterprise light `#3C444D`. DOS-bindable.                                          |
| `strokeDashStyle` | number (px)           | `0` (solid)                   | Dash & gap length, both equal.                                                                                                       |
| `strokeOpacity`   | number 0 - 1          | `1`                           | Independent of `fillOpacity`.                                                                                                        |
| `strokeWidth`     | number 1 - 25 (px)    | `1`                           | Hard-clipped at 25 per the PDF.                                                                                                      |

Same caveat as rectangles: legacy PDF examples occasionally write
`fill`/`stroke` (no "Color" suffix). The canonical names from the 10.4
option table are `fillColor`/`strokeColor` - use those.

## Shape: panel aspect ratio defines circle vs oval

Ellipses have no `rx`/`ry` or radius option. The shape is set entirely
by the panel's `position.w` / `position.h`:

- `w == h` => **perfect circle**
- `w != h` => **oval** (horizontal if `w > h`, vertical if `h > w`)

```json
"structure": [
  { "item": "viz_circle", "position": { "x": 20, "y": 20, "w": 200, "h": 200 } },
  { "item": "viz_oval",   "position": { "x": 240, "y": 20, "w": 460, "h": 200 } }
]
```

## Layout: absolute only

Like all shape primitives, `splunk.ellipse` only renders inside an
`absolute` layout. Pasting it into a grid layout fails silently.

## Layering (z-order)

Z-order follows the order of the `structure` array - earlier items are
behind, later items are in front. The canonical "KPI ring" pattern:

```json
"structure": [
  { "item": "viz_kpi_ring",  "position": { "x":  20, "y":  20, "w": 280, "h": 280 } },
  { "item": "viz_kpi_value", "position": { "x":  60, "y":  80, "w": 200, "h": 160 } }
]
```

`viz_kpi_ring` is a `splunk.ellipse`; `viz_kpi_value` is a
`splunk.singlevalue` with `backgroundColor: "transparent"`.

## Drilldown / interactivity

Per the **drilldown event payload table** in the 10.4 PDF, `splunk.ellipse`
returns `n/a` for the click event's `name`, `value`, and `series` payload
fields - same as `splunk.rectangle`. That means:

- The `onSelectionChanged` handler **does fire** when an ellipse is
  clicked, so you can use it as an invisible click-target (e.g. for a
  pie-slice-shaped hit-zone over an `splunk.image`).
- But the handler receives **no contextual payload** - you'll get the
  `viz_id` of the clicked ellipse, but nothing like a row's `field` or
  `value` like you would on `splunk.column` or `splunk.table`.
- Wire navigation handlers with **hardcoded** drilldown URLs / token
  values per ellipse.

This is the same drilldown limitation as `splunk.rectangle`.

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_ellipse_dark` / `ds_viz_ellipse_light`.

| Panel | What it demonstrates                                                              | Where to use                                  |
| ----- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| 1     | Default fill + stroke (theme defaults)                                            | Quick placeholder                             |
| 2     | Circle - solid fill, transparent stroke (square panel)                            | Standard circular badge                       |
| 3     | Oval - same options, wide panel                                                   | Decorative hero shape                         |
| 4     | `fillOpacity = 0.5`                                                               | Layered shapes on coloured canvas             |
| 5     | `fillOpacity = 0.15`                                                              | Decorative background blob / watermark        |
| 6     | Outlined ring - transparent fill + branded stroke                                 | "Donut accent"                                |
| 7     | `strokeWidth = 25` (max)                                                          | Demo of upper bound                           |
| 8     | `strokeDashStyle = 6` dashed ring                                                 | Empty-state placeholder                       |
| 9     | `strokeOpacity = 0.4`                                                             | Soft KPI surround                             |
| 10    | Tiny status dots (60 x 60 panels)                                                 | Inline health indicators next to labels       |
| 11    | KPI accent ring with singleValue overlay                                          | Canonical "ring + KPI" recipe                 |
| 12    | Alias-in-context DOS `fillColor` + `rangeValue` (health low → red)                | Status dot that flips on a metric             |
| 13    | Alias-in-context DOS `fillColor` (health mid → amber)                             | Demonstrates disjoint buckets — boundary value lands in middle |
| 14    | Alias-in-context DOS `fillColor` with `seriesByType("number")` (health high → green) | Equivalent picker form                     |
| 15    | DOS `fillColor` + DOS `strokeColor` with separate `*EditorConfig` tables          | KPI donut ring that reflects the metric       |
| 16    | Token-driven `fillColor` via `$colour_token$` + `input.dropdown`                  | Design previews, brand-colour pickers         |

## Common gotchas

1. **No grid-layout support.** `splunk.ellipse` requires an absolute
   layout. Pasting into a grid dashboard fails to render.
2. **Shape is set by panel aspect ratio.** There is no `rx`/`ry` option.
   For a circle, set `w == h` exactly. Differences of even 5 - 10 px are
   visible.
3. **`strokeWidth` is clipped at 25 px.** Anything above 25 is silently
   capped per the PDF.
4. **No `strokeJoinStyle` option.** Ellipses have no corner joins.
5. **`fillOpacity` and `strokeOpacity` are independent.** A faded fill
   with a solid stroke is a common KPI-ring pattern.
6. **No drop shadow / blur primitives.** To approximate elevation, layer
   a slightly larger, very faint ellipse behind the main shape.
7. **No text rendering.** Ellipses never display text. Always pair with
   `splunk.markdown` or `splunk.singlevalue` on top.
8. **Drilldown payload is `n/a`.** Per the PDF drilldown table,
   `onSelectionChanged` fires but with no contextual data - use
   hardcoded handlers per ellipse.
9. **Default fill is theme-dependent.** A bare `options: {}` ellipse
   looks completely different in dark vs light. Always set `fillColor`
   explicitly for shipped dashboards.
10. **Tiny ellipses can be missed at low DPI / projector resolutions.**
    A 12 x 12 status dot is fine on a laptop but invisible on a
    wall-mounted SOC display - bump to 20 x 20 minimum if the dashboard
    is meant for big screens.
11. **`rangeValue` thresholds: `from` is inclusive, `to` is exclusive,
    and buckets are evaluated top-down.** When two buckets both match
    a value (e.g. `{to: 70}` and `{from: 60, to: 80}` both match 65),
    the first one wins and the second is dead. Always design buckets
    to be **disjoint** (no overlap) and **gap-free** (no value falls
    outside every bucket). See "Threshold buckets — semantics and
    pitfalls" above for the canonical RAG shape.
12. **Demo data must align with the threshold domain.** If you build a
    3-bucket RAG dot but only test it with two values, you're not
    actually verifying the middle bucket. Drive the demo with at least
    one value per bucket (e.g. health = 20 / 60 / 95 against thresholds
    60 / 80) so each bucket is exercised on render.

## Quick recipes

### Status dot (tiny circle indicator)

```json
{
  "viz_status_dot": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "#0E7C70",
      "strokeColor": "transparent"
    }
  }
}
```

Layout: place at e.g. `{ "x": 20, "y": 20, "w": 16, "h": 16 }` next to
a `splunk.markdown` label.

### Donut outline / KPI accent ring

```json
{
  "viz_kpi_ring": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "transparent",
      "strokeColor": "#26A69A",
      "strokeWidth": 4,
      "strokeOpacity": 0.6
    }
  }
}
```

### KPI ring + singleValue overlay

```json
"structure": [
  { "item": "viz_kpi_ring",  "position": { "x":  20, "y":  20, "w": 280, "h": 280 } },
  { "item": "viz_kpi_value", "position": { "x":  60, "y":  80, "w": 200, "h": 160 } }
]
```

```json
"viz_kpi_ring": {
  "type": "splunk.ellipse",
  "options": {
    "fillColor": "#1A2440",
    "fillOpacity": 0.95,
    "strokeColor": "#26A69A",
    "strokeOpacity": 0.6,
    "strokeWidth": 3
  }
},
"viz_kpi_value": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_uptime" },
  "options": {
    "backgroundColor": "transparent",
    "majorColor": "#26A69A",
    "trendDisplay": "off",
    "sparklineDisplay": "off"
  }
}
```

### Decorative background blob

```json
{
  "viz_blob": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "#9B5DE5",
      "fillOpacity": 0.12,
      "strokeColor": "transparent"
    }
  }
}
```

Layout: 600 x 600 ellipse positioned partly off-canvas behind the title
markdown. Z-order: render before any KPI panels (so it sits behind).

### Dashed empty-state ring

```json
{
  "viz_empty_ring": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "transparent",
      "strokeColor": "#C3CBD4",
      "strokeWidth": 2,
      "strokeDashStyle": 6
    }
  }
}
```

### Data-driven status dot (canonical alias-in-context form)

```json
"viz_health_dot": {
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_service_health" },
  "context": {
    "fillDataValue": "> primary | seriesByName(\"health\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent"
  }
}
```

Layout: `{ "x": 20, "y": 20, "w": 16, "h": 16 }` next to a markdown
label. Pair multiple status dots in a row for a service-grid view.

> **Don't forget `lastPoint()`** between the picker and `rangeValue`,
> or the dot silently renders grey. See `pipeline/ds-validate`
> (`rangevalue-missing-reducer`).

The inline shorthand `"> primary | seriesByType(\"number\") | lastPoint() | rangeValue(thresholds)"`
also works, but Studio rewrites it on save.

### Donut KPI ring with both fill and stroke bound

```json
"viz_kpi_donut": {
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_service_health" },
  "context": {
    "fillDataValue":   "> primary | seriesByName(\"health\") | lastPoint()",
    "strokeDataValue": "> primary | seriesByName(\"health\") | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ],
    "strokeColorEditorConfig": [
      { "to": 60,             "value": "#FF6B6B" },
      { "from": 60,           "value": "#E8E8E8" }
    ]
  },
  "options": {
    "fillColor":   "> fillDataValue   | rangeValue(fillColorEditorConfig)",
    "strokeColor": "> strokeDataValue | rangeValue(strokeColorEditorConfig)",
    "strokeWidth": 4
  }
}
```

Both fill and stroke bound to the same source, but with separate
threshold tables — the fill flips between three colours, the stroke
flips between two. Place a `splunk.singlevalue` on top with
`backgroundColor: "transparent"` for the canonical "self-coloured KPI
ring" recipe.

### Token-driven status dot (input flips colour)

```json
"inputs": {
  "input_dot_colour": {
    "type": "input.dropdown",
    "title": "Dot colour",
    "options": {
      "token": "dot_colour",
      "defaultValue": "#33FF99",
      "items": [
        { "label": "OK",   "value": "#33FF99" },
        { "label": "Warn", "value": "#FFB627" },
        { "label": "Crit", "value": "#FF2D95" }
      ]
    }
  }
},
"visualizations": {
  "viz_dot": {
    "type": "splunk.ellipse",
    "options": {
      "fillColor": "$dot_colour$",
      "strokeColor": "transparent"
    }
  }
}
```

Use for design previews, A/B branding, and "viewer-pinned" overrides.
Use `input.dropdown` (not `input.radio` — that type does not exist in
Dashboard Studio v2).

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

- `ds-viz-rectangle` - same option model, but a rectangular shape with
  `rx`/`ry` corner radius and `strokeJoinStyle`. Use rectangles for
  cards, ellipses for circles / dots / blobs.
- `ds-viz-singlevalue` - the canonical visualization to layer on top of
  a KPI ring.
- `ds-viz-markdown` - typographic content paired alongside ellipses for
  status labels.
- `ds-design-principles` - when to reach for an ellipse vs a rectangle,
  and how to compose the canonical "ring + KPI" recipe.
