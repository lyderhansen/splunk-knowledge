---
name: ds-viz-ellipse
description: |
  splunk.ellipse - the circular shape primitive for status dots, KPI accent
  rings, donut outlines, and faint background blobs. Absolute layout only.
  Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_ellipse_dark
  - ds_viz_ellipse_light
related:
  - ds-viz-rectangle
  - ds-viz-singlevalue
  - ds-viz-markdown
  - ds-design-principles
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

`splunk.ellipse` does not require a data source. The shape is purely a
styling primitive. As with rectangles, the PDF says of `fillColor` /
`strokeColor`:

> "You may use a dataSource to apply the color."

So you _can_ bind colour to a search via DOS - e.g. a status dot whose
fill changes from green to red based on `> primary | rangeValue(...)`.
This is uncommon. Most ellipses ship with static colours.

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

| Panel | What it demonstrates                                             | Where to use                                  |
| ----- | ---------------------------------------------------------------- | --------------------------------------------- |
| 1     | Default fill + stroke (theme defaults)                           | Quick placeholder                             |
| 2     | Circle - solid fill, transparent stroke (square panel)           | Standard circular badge                       |
| 3     | Oval - same options, wide panel                                  | Decorative hero shape                         |
| 4     | `fillOpacity = 0.5`                                              | Layered shapes on coloured canvas             |
| 5     | `fillOpacity = 0.15`                                             | Decorative background blob / watermark        |
| 6     | Outlined ring - transparent fill + branded stroke                | "Donut accent"                                |
| 7     | `strokeWidth = 25` (max)                                         | Demo of upper bound                           |
| 8     | `strokeDashStyle = 6` dashed ring                                | Empty-state placeholder                       |
| 9     | `strokeOpacity = 0.4`                                            | Soft KPI surround                             |
| 10    | Tiny status dots (60 x 60 panels)                                | Inline health indicators next to labels       |
| 11    | KPI accent ring with singleValue overlay                         | Canonical "ring + KPI" recipe                 |

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
