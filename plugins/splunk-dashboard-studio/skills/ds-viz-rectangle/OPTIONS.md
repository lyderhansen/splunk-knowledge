# splunk.rectangle — full options reference

The 10.4 PDF lists exactly **9 options**. Both UI and source-editor
option tables agree.

| Option | Type | Default | Notes |
|---|---|---|---|
| `fillColor` | string (hex `#RRGGBB`) | `> themes.defaultFillColor` | Enterprise dark `#31373E`, prisma dark `#0B0C0E`, enterprise light `#C3CBD4`. **DOS-bindable.** |
| `fillOpacity` | number 0–1 (or `"80%"` string in UI) | `1` | Useful for layered cards. `0` = invisible. |
| `rx` | number (px) or % (≥ 0) | `0` | Horizontal corner radius. |
| `ry` | number (px) or % (≥ 0) | `> rx` | Vertical corner radius. **Defaults to `rx`** — set independently for elliptical corners. |
| `strokeColor` | string (hex) | `> themes.defaultStrokeColor` | Enterprise dark `#C3CBD4`, prisma dark `#ACACAD`, enterprise light `#3C444D`. **DOS-bindable.** |
| `strokeDashStyle` | number (px) | `0` (solid) | Dash & gap length, both equal. `6` = 6 px dashes, 6 px gaps. Higher = more space between dashes. |
| `strokeJoinStyle` | `arcs` \| `bevel` \| `miter` \| `miter-clip` \| `round` | `miter` | Corner join shape of the stroke path. **Visible only at large `strokeWidth`.** |
| `strokeOpacity` | number 0–1 | `1` | Independent of `fillOpacity`. |
| `strokeWidth` | number 1–25 (px) | `1` | **Hard-clipped at 25** per the PDF. |

The canonical option names are `fillColor` / `strokeColor`. Some
older PDF examples write `fill` / `stroke` (no "Color" suffix); those
are legacy and not in the 10.4 option table — use the long form.

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

## Layout: absolute only

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 900 },
  "structure": [...]
}
```

Pasting into a grid layout fails silently.

## What rectangle does NOT support

- **No drop shadow / blur primitives.** Approximate elevation with a
  slightly larger, faintly-filled rectangle behind the card. See
  PATTERNS.md.
- **No text rendering.** Always pair with `splunk.markdown` or
  `splunk.singlevalue` on top.
- **No `z-index`.** Z-order is `structure` array order: earlier =
  behind, later = in front.

## Source

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Rectangle options table.
