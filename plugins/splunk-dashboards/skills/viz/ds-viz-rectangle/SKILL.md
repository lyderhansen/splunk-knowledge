---
name: ds-viz-rectangle
description: Splunk Dashboard Studio splunk.rectangle shape primitive — flat shape for background cards, depth layers, pill chips, section dividers, status badges, and clickable hit-zones over images. Provides patterns for static fills, DOS-bound RAG status cards, token-driven colour, the "card + KPI overlay" recipe, rounded-corner pills via rx/ry, and image hit-zones with onSelectionChanged. Use when the user asks about rectangles, background cards, pill chips, status badges, KPI cards, hit-zones, or section dividers in Splunk Dashboard Studio.
---

# splunk.rectangle — flat shape primitive

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_rectangle_dark` / `ds_viz_rectangle_light`.

The flat shape primitive in Dashboard Studio. Cheap, fast, and
PDF-export-safe. Use any time you need a coloured background, a card
behind a KPI, a pill chip, a status badge, a section divider, or a
clickable region overlaid on an image.

## When to use

- **Background cards** behind KPIs, charts, tables to create depth.
- **Section dividers** between groups of panels (full-width thin
  rectangles).
- **Pill chips** for status badges (`rx >= h/2`).
- **Outlined cards** with coloured stroke for emphasis.
- **Clickable hit-zones** over `splunk.image` panels (floor plans,
  diagrams). Rectangles fire `onSelectionChanged`.
- **Empty-slot placeholders** with dashed border.
- **Colour swatches** in legends or design-system documentation.

## When NOT to use

- **Circles or oval highlights** → `splunk.ellipse`.
- **Photographic content / logos / diagrams** → `splunk.image`.
- **Typographic content** (titles, paragraphs) → `splunk.markdown`
  (rectangles render no text).
- **Drop shadows or blurs** — Dashboard Studio has no shadow
  primitive. Approximate with a slightly larger, faintly-filled
  rectangle behind the card.
- **Grid layouts** — rectangles only render in **absolute** layout.

## Quick start — KPI card with overlay

```json
"structure": [
  { "item": "viz_card_background", "position": { "x": 20, "y": 20, "w": 320, "h": 160 } },
  { "item": "viz_card_kpi",        "position": { "x": 40, "y": 50, "w": 280, "h": 100 } }
]
```

```json
"viz_card_background": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#1A2440",
    "fillOpacity": 0.95,
    "strokeColor": "transparent",
    "rx": 8
  }
},
"viz_card_kpi": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_uptime" },
  "options": {
    "backgroundColor": "transparent",
    "underLabel": "Uptime",
    "trendDisplay": "off"
  }
}
```

**Z-order = `structure` array order:** earlier = behind, later = in
front.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Layout:** absolute only. | Paste into grid layout — fails silently. |
| **Pill chips:** `rx >= h/2` (e.g. `h: 24, rx: 12`). | Forget `rx` for status pills — corners look like cards, not chips. |
| **Independent corners:** `ry: 4, rx: 8` for asymmetric pill / chamfer. | Set only `rx` and expect `ry` to differ — `ry` defaults to `rx`. |
| **Status card RAG:** disjoint, gap-free buckets. | Overlap `[{to:70}, {from:60, to:80}]` — second bucket dead because top-down + first-match wins. |
| **Hit-zones:** transparent `fillColor` AND `strokeColor`, layered ON TOP of `splunk.image`. | Try to wire drilldown directly on `splunk.image` — image has no `onSelectionChanged`; rectangle does. |
| **KPI card:** rectangle BEHIND, singlevalue ON TOP with `backgroundColor: "transparent"`. | Reverse the order — rectangle covers the KPI. |
| **Default fill explicitly:** `fillColor` set on every rectangle. | Bare `options: {}` — default differs dark vs light. |
| **DOS picker:** `seriesByName('field')` (refactor-safe). | `seriesByIndex(0)` when SPL field order isn't stable. |
| **Drilldown:** hardcode handlers per rectangle — payload is `n/a`. | Read `$row.<field>$` / `$click.value$` — rectangle clicks have no contextual payload. |

## Three colour-source patterns

### 1. Static colour (most common)

```json
"options": { "fillColor": "#1A2440" }
```

### 2. DOS-bound colour — data-driven status card

Canonical alias-in-context form (what the editor produces):

```json
{
  "type": "splunk.rectangle",
  "dataSources": { "primary": "ds_health" },
  "context": {
    "fillDataValue": "> primary | seriesByType('number') | lastPoint()",
    "fillColorEditorConfig": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  },
  "options": {
    "fillColor": "> fillDataValue | rangeValue(fillColorEditorConfig)",
    "strokeColor": "transparent",
    "rx": 8
  }
}
```

Inline form is also valid:

```json
"fillColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)"
```

Both forms work. The alias-in-context form survives the editor
round-trip cleanly.

### 3. Token-driven — input-driven colour

```json
"options": { "fillColor": "$colour_token$" }
```

Pair with `input.dropdown`. Token must produce a valid hex string.

## Nine options total

| Option | Type | Default | Notes |
|---|---|---|---|
| `fillColor` | string (hex) | `> themes.defaultFillColor` | DOS-bindable. |
| `fillOpacity` | number 0–1 | `1` | UI also accepts `"80%"`. |
| `rx` | number (px) or % | `0` | Horizontal corner radius. |
| `ry` | number (px) or % | `> rx` | Defaults to `rx`. Set independently for elliptical corners. |
| `strokeColor` | string (hex) | `> themes.defaultStrokeColor` | DOS-bindable. |
| `strokeDashStyle` | number (px) | `0` (solid) | Dash & gap length, both equal. |
| `strokeJoinStyle` | `arcs` \| `bevel` \| `miter` \| `miter-clip` \| `round` | `miter` | Corner join — visible only at large `strokeWidth`. |
| `strokeOpacity` | number 0–1 | `1` | Independent of `fillOpacity`. |
| `strokeWidth` | number 1–25 (px) | `1` | Hard-clipped at 25. |

> Legacy PDF examples occasionally use `fill`/`stroke` (no "Color"
> suffix). Canonical 10.4 names are `fillColor`/`strokeColor`.

## Image hit-zone recipe

For each clickable region of a floor plan / diagram:

1. Place the underlying `splunk.image` at `(x, y, w, h)`.
2. Stack a `splunk.rectangle` ON TOP with `fillColor: "transparent"`
   AND `strokeColor: "transparent"` (invisible, still clickable).
3. Wire `eventHandlers` → `setToken` / `link.navigate.url` on the
   rectangle.

The handler fires with the rectangle's `viz_id`. Map that to your
downstream search.

## See also

- [PATTERNS.md](PATTERNS.md) — verified patterns: card, divider, pill,
  outlined card, dashed empty-state, status badge, DOS RAG card,
  hit-zone, swatch.
- `ds-viz-ellipse` — circular twin (no `rx`/`ry`).
- `ds-viz-image` — what the rectangles overlay.
- `ds-viz-singlevalue` — overlay number on top of card.
- `ds-viz-markdown` — overlay text on top of card.
- `ds-design-principles` — depth, hierarchy, RAG.
