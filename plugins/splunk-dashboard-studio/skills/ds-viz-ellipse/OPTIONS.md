# splunk.ellipse — full options reference

The 10.4 PDF lists exactly **6 options**. There are **no** corner-
radius options (`rx` / `ry`) and **no** `strokeJoinStyle` option —
shape and straightness aren't applicable to ellipses.

| Option | Type | Default | Notes |
|---|---|---|---|
| `fillColor` | string (hex) | `> themes.defaultFillColor` | Enterprise dark `#31373E`, prisma dark `#0B0C0E`, enterprise light `#C3CBD4`. **DOS-bindable.** |
| `fillOpacity` | number 0–1 | `1` | UI also accepts `"80%"`. |
| `strokeColor` | string (hex) | `> themes.defaultStrokeColor` | Enterprise dark `#C3CBD4`, prisma dark `#ACACAD`, enterprise light `#3C444D`. **DOS-bindable.** |
| `strokeDashStyle` | number (px) | `0` (solid) | Dash & gap length, both equal. |
| `strokeOpacity` | number 0–1 | `1` | Independent of `fillOpacity`. |
| `strokeWidth` | number 1–25 (px) | `1` | **Hard-clipped at 25** per the PDF. |

Same caveat as rectangles: legacy PDF examples occasionally write
`fill` / `stroke` (no "Color" suffix). The canonical 10.4 option
table names are `fillColor` / `strokeColor` — use those.

## Three colour-source patterns

### 1. Static colour (most common)

```json
"options": { "fillColor": "#0E7C70" }
```

### 2. DOS-bound colour — data-driven status dot

```json
{
  "type": "splunk.ellipse",
  "dataSources": { "primary": "ds_health" },
  "options": {
    "fillColor": "> primary | seriesByName('health') | lastPoint() | rangeValue(thresholds)",
    "strokeColor": "transparent"
  },
  "context": {
    "thresholds": [
      { "to": 60,             "value": "#FF2D95" },
      { "from": 60, "to": 80, "value": "#FFB627" },
      { "from": 80,           "value": "#33FF99" }
    ]
  }
}
```

Both `fillColor` and `strokeColor` are DOS-bindable. You can use
**different** threshold tables on each so the ring "burns hot at the
edge" before the centre flips.

### 3. Token-driven — input-driven colour

```json
"options": { "fillColor": "$colour_token$" }
```

Pair with `input.dropdown`. Token must produce a valid hex string.

## Shape: panel aspect ratio decides circle vs oval

Ellipses have no `rx` / `ry` / radius option. Shape is set entirely
by panel `position.w` / `position.h`:

- `w == h` → **perfect circle**
- `w != h` → **oval** (horizontal if `w > h`, vertical if `h > w`)

```json
"structure": [
  { "item": "viz_circle", "position": { "x": 20,  "y": 20, "w": 200, "h": 200 } },
  { "item": "viz_oval",   "position": { "x": 240, "y": 20, "w": 460, "h": 200 } }
]
```

## Layout: absolute only

Like all shape primitives, `splunk.ellipse` only renders inside
`layout.type: "absolute"`. Pasting into grid layout fails silently.

## What ellipse does NOT support

- **No `rx` / `ry`** — shape is panel-aspect-driven.
- **No `strokeJoinStyle`** — no corners on a curve.
- **No drop shadow / blur primitives.**
- **No text rendering.** Always pair with `splunk.markdown` or
  `splunk.singlevalue` on top.
- **No `z-index`.** Z-order is `structure` array order: earlier =
  behind, later = in front.
- **Drilldown payload is `n/a`** — `onSelectionChanged` fires with
  no contextual data. Use hardcoded handlers per ellipse.

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Ellipse options table.
