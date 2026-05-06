---
name: ds-viz-infographic-shapes
description: "Splunk Dashboard Studio infographic_shapes custom visualization — 37 PowerPoint-style shapes with gradient fills, drop shadow, glow, reflection, dashed strokes, rotation, animations, embedded custom fonts, and data-driven threshold coloring. Requires the infographic_shapes Splunk app. Use when the user wants decorative shapes with real effects (gradient, glow, shadow) instead of flat splunk.rectangle, or needs arrows, stars, hearts, hexagons, or other geometric shapes."
---

# infographic_shapes — shape toolkit with effects

> **Requires:** The `infographic_shapes` Splunk app must be installed.
> Install the `.tar.gz` from the app package. Without it, panels
> using this viz type render empty.

## When to use

- **Decorative shapes with real gradient fills** — not faux layered rectangles.
- **Drop shadow and glow effects** — impossible in native Dashboard Studio.
- **Shapes beyond rectangle/ellipse** — arrows, chevrons, hexagons, stars,
  hearts, lightning, clouds, and 30+ more.
- **Animated elements** — pulse, glow_pulse, breathe, or spin for status
  indicators and hero panels.
- **Custom fonts on shapes** — 25+ fonts embedded as base64 woff2, zero
  network requests, air-gap safe.
- **Process flow markers** — chevrons and arrows with text labels.
- **Status indicators** — data-driven threshold coloring on any shape.
- **Branded design elements** — geometric shapes that match a visual identity.

## When NOT to use

- **Simple flat rectangles without effects** → `splunk.rectangle` (no app
  dependency, faster, PDF-export-safe).
- **Icons from the Material Symbols library** → `ds-viz-icon-library`
  (2500+ icons, no shape fill).
- **Custom SVG with data-driven region fills** → `ds-viz-choropleth-svg`.
- **Photographs or logos** → `ds-viz-image`.

## Quick start — gradient hexagon with glow

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "hexagon",
    "infographic_shapes.infographic_shapes.fillType": "gradient",
    "infographic_shapes.infographic_shapes.fillColor": "#1E3A5F",
    "infographic_shapes.infographic_shapes.gradientColor": "#06B6D4",
    "infographic_shapes.infographic_shapes.gradientDirection": "vertical",
    "infographic_shapes.infographic_shapes.glowEnabled": "true",
    "infographic_shapes.infographic_shapes.glowColor": "#06B6D4",
    "infographic_shapes.infographic_shapes.glowSize": "15",
    "infographic_shapes.infographic_shapes.text": "STATUS",
    "infographic_shapes.infographic_shapes.textColor": "#FFFFFF",
    "infographic_shapes.infographic_shapes.fontWeight": "bold"
  }
}
```

> **Namespace rule:** ALL option keys must be prefixed with
> `infographic_shapes.infographic_shapes.` — options without the prefix are
> silently ignored.

## Stub data source

The viz works with no meaningful search data. Use a minimal `ds.test` source:

```json
"ds_stub": {
  "type": "ds.test",
  "options": {
    "data": {
      "fields": [{ "name": "value" }],
      "columns": [["1"]]
    }
  }
}
```

For data-driven threshold coloring, replace with a real search returning
`value`, `color`, or `text` columns.

## All 37 shapes

| Category | Shapes |
|---|---|
| **Rectangles** | `rectangle`, `rounded_rectangle`, `pill` |
| **Circles** | `circle`, `ellipse`, `ring`, `arc` |
| **Polygons** | `triangle`, `right_triangle`, `diamond`, `pentagon`, `hexagon`, `octagon` |
| **Stars** | `star_4`, `star_5`, `star_6` |
| **Icons** | `heart`, `cross`, `lightning`, `cloud`, `sun`, `moon` |
| **Arrows** | `arrow_right`, `arrow_left`, `arrow_up`, `arrow_down`, `arrow_double`, `chevron` |
| **Geometric** | `parallelogram`, `trapezoid` |
| **Brackets** | `bracket_left`, `bracket_right`, `curly_left`, `curly_right` |
| **Lines** | `line_horizontal`, `line_vertical`, `line_diagonal` |

## Options reference

### Shape & Layout

| Option | Type | Default | Description |
|---|---|---|---|
| `shape` | enum | `rounded_rectangle` | Shape type (see list above) |
| `cornerRadius` | number | `12` | Corner radius for rounded rectangles (px) |
| `rotation` | number | `0` | Rotation angle 0-360 degrees |
| `padding` | number | `8` | Inner padding from panel edge (px) |
| `opacity` | number | `100` | Overall opacity 0-100 |

### Fill & Stroke

| Option | Type | Default | Description |
|---|---|---|---|
| `fillType` | enum | `solid` | `solid`, `gradient`, or `none` |
| `fillColor` | hex | `#1E3A5F` | Primary fill color |
| `gradientColor` | hex | `#06B6D4` | Second gradient color |
| `gradientColor2` | hex | *(empty)* | Third gradient stop (optional) |
| `gradientColor3` | hex | *(empty)* | Fourth gradient stop (optional) |
| `gradientDirection` | enum | `vertical` | `horizontal`, `vertical`, `diagonal`, `diagonal_rev`, `radial` |
| `strokeColor` | hex | `#06B6D4` | Outline color |
| `strokeWidth` | number | `0` | Outline width in px (0 = none) |
| `strokeDash` | enum | `solid` | `solid`, `dashed`, `dotted`, `dash_dot` |

### Effects

| Option | Type | Default | Description |
|---|---|---|---|
| `shadowEnabled` | boolean | `false` | Drop shadow on/off |
| `shadowColor` | hex | `#000000` | Shadow color |
| `shadowBlur` | number | `12` | Shadow blur radius (px) |
| `shadowOffsetX` | number | `4` | Shadow horizontal offset (px) |
| `shadowOffsetY` | number | `4` | Shadow vertical offset (px) |
| `shadowOpacity` | number | `60` | Shadow opacity 0-100 |
| `shadowSpread` | number | `1` | Shadow spread 1-5 |
| `glowEnabled` | boolean | `false` | Glow on/off |
| `glowColor` | hex | `#06B6D4` | Glow color |
| `glowSize` | number | `15` | Glow halo size (px) |
| `glowIntensity` | number | `2` | Glow intensity 1-5 |
| `reflectionEnabled` | boolean | `false` | Reflection on/off |
| `reflectionOpacity` | number | `0.15` | Reflection opacity 0-1 |
| `reflectionHeight` | number | `35` | Reflection height % |
| `animationType` | enum | `none` | `none`, `pulse`, `glow_pulse`, `breathe`, `spin` |
| `animationSpeed` | enum | `normal` | `slow`, `normal`, `fast` |

### Text & Font

| Option | Type | Default | Description |
|---|---|---|---|
| `text` | string | *(empty)* | Static text on shape |
| `fontFamily` | string | *(system)* | Font name (25+ embedded fonts available) |
| `fontSize` | number | `0` | Font size px (0 = auto-scale) |
| `fontWeight` | enum | `bold` | `bold`, `normal`, `light` |
| `textColor` | hex | `#FFFFFF` | Text color |
| `textAlign` | enum | `center` | `left`, `center`, `right` |
| `icon` | string | *(empty)* | Unicode emoji/symbol on shape |
| `iconSize` | number | `0` | Icon size px (0 = auto) |
| `iconPosition` | enum | `above` | `above`, `below`, `left`, `right` |

### Data Binding

| Option | Type | Default | Description |
|---|---|---|---|
| `field` | string | *(empty)* | Numeric field for threshold coloring |
| `colorField` | string | *(empty)* | Field with hex color to override fill |
| `textField` | string | *(empty)* | Field for dynamic text |
| `warningThreshold` | number | *(empty)* | Value >= this turns warning color |
| `criticalThreshold` | number | *(empty)* | Value >= this turns critical color |
| `normalColor` | hex | `#22C55E` | Color below all thresholds |
| `warningColor` | hex | `#F59E0B` | Color at warning level |
| `criticalColor` | hex | `#EF4444` | Color at critical level |

## Embedded fonts

All fonts embedded as base64 woff2 — zero network requests, air-gap safe.

| Font | Style |
|---|---|
| Inter | Clean sans-serif (modern UI) |
| Roboto | Google's sans-serif |
| Lato | Friendly sans-serif |
| Montserrat | Geometric sans-serif |
| Nunito | Rounded sans-serif |
| Oswald | Condensed sans-serif |
| Raleway | Elegant sans-serif |
| Bebas Neue | All-caps display |
| Playfair Display | Elegant serif |
| Lora | Contemporary serif |
| Merriweather | Screen-optimized serif |
| PT Serif | Professional serif |
| EB Garamond | Classic serif |
| Noto Serif | Unicode serif |
| JetBrains Mono | Developer monospace |
| Roboto Mono | Clean monospace |
| Source Code Pro | Adobe monospace |
| IBM Plex Sans | IBM's sans-serif |
| Anonymous Pro | Coding monospace |
| Courier Prime | Refined courier |
| Cutive Mono | Typewriter monospace |
| Special Elite | Typewriter display |
| Press Start 2P | Retro pixel |
| Bangers | Comic book display |
| Orbitron | Sci-fi display |

## Do / Don't

| Do | Don't |
|---|---|
| Use `gradient` fill for depth on card backgrounds | Use `solid` when gradient would add dimension |
| Use `glowEnabled: "true"` for hero/accent panels | Combine glow + shadow + reflection — pick max 2 |
| Use `animationType: "pulse"` sparingly for critical alerts | Animate everything — motion fatigue kills signal |
| Match `glowColor` to `fillColor` or brand accent | Random glow colors — looks like a rave |
| Use `rounded_rectangle` with `cornerRadius: 6` for cards | `cornerRadius: 12+` — bloated look |
| Prefix ALL options with `infographic_shapes.infographic_shapes.` | Forget namespace — options silently ignored |
| Use boolean values as strings: `"true"`, `"false"` | Use actual booleans `true`/`false` — treated as strings in custom viz |

## Patterns

### 1. Gradient card background

A `rounded_rectangle` with vertical gradient and subtle shadow — a drop-in
replacement for the faux-depth layered rectangle pattern.

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "rounded_rectangle",
    "infographic_shapes.infographic_shapes.cornerRadius": "6",
    "infographic_shapes.infographic_shapes.fillType": "gradient",
    "infographic_shapes.infographic_shapes.fillColor": "#0F2040",
    "infographic_shapes.infographic_shapes.gradientColor": "#1A3860",
    "infographic_shapes.infographic_shapes.gradientDirection": "vertical",
    "infographic_shapes.infographic_shapes.shadowEnabled": "true",
    "infographic_shapes.infographic_shapes.shadowBlur": "12",
    "infographic_shapes.infographic_shapes.shadowOpacity": "40"
  }
}
```

### 2. Glowing status indicator

A `circle` whose fill color is driven by a threshold search. Glow amplifies
the status signal without text.

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_cpu_status" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "circle",
    "infographic_shapes.infographic_shapes.field": "cpu_pct",
    "infographic_shapes.infographic_shapes.warningThreshold": "70",
    "infographic_shapes.infographic_shapes.criticalThreshold": "90",
    "infographic_shapes.infographic_shapes.normalColor": "#22C55E",
    "infographic_shapes.infographic_shapes.warningColor": "#F59E0B",
    "infographic_shapes.infographic_shapes.criticalColor": "#EF4444",
    "infographic_shapes.infographic_shapes.glowEnabled": "true",
    "infographic_shapes.infographic_shapes.glowSize": "20",
    "infographic_shapes.infographic_shapes.glowIntensity": "3"
  }
}
```

SPL: `index=os sourcetype=cpu | stats latest(cpu_pct) as cpu_pct by host | head 1`

### 3. Process flow arrow

A `chevron` with a text label for pipeline / workflow diagrams. Repeat with
token-driven `fillColor` to show stage status.

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "chevron",
    "infographic_shapes.infographic_shapes.fillType": "solid",
    "infographic_shapes.infographic_shapes.fillColor": "#1E3A5F",
    "infographic_shapes.infographic_shapes.strokeColor": "#06B6D4",
    "infographic_shapes.infographic_shapes.strokeWidth": "1",
    "infographic_shapes.infographic_shapes.text": "INGEST",
    "infographic_shapes.infographic_shapes.fontFamily": "Montserrat",
    "infographic_shapes.infographic_shapes.fontWeight": "bold",
    "infographic_shapes.infographic_shapes.textColor": "#FFFFFF"
  }
}
```

### 4. Animated critical alert

A `hexagon` with `glow_pulse` animation — use sparingly for panels that
demand immediate operator attention.

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "hexagon",
    "infographic_shapes.infographic_shapes.fillType": "gradient",
    "infographic_shapes.infographic_shapes.fillColor": "#7F1D1D",
    "infographic_shapes.infographic_shapes.gradientColor": "#EF4444",
    "infographic_shapes.infographic_shapes.glowEnabled": "true",
    "infographic_shapes.infographic_shapes.glowColor": "#EF4444",
    "infographic_shapes.infographic_shapes.glowSize": "25",
    "infographic_shapes.infographic_shapes.animationType": "glow_pulse",
    "infographic_shapes.infographic_shapes.animationSpeed": "fast",
    "infographic_shapes.infographic_shapes.text": "CRITICAL",
    "infographic_shapes.infographic_shapes.fontFamily": "Orbitron",
    "infographic_shapes.infographic_shapes.textColor": "#FFFFFF"
  }
}
```

### 5. Section divider with dashed stroke

A `line_horizontal` with a dashed stroke for lightweight visual separation
between dashboard sections.

```json
{
  "type": "infographic_shapes.infographic_shapes",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "infographic_shapes.infographic_shapes.shape": "line_horizontal",
    "infographic_shapes.infographic_shapes.fillType": "none",
    "infographic_shapes.infographic_shapes.strokeColor": "#06B6D4",
    "infographic_shapes.infographic_shapes.strokeWidth": "1",
    "infographic_shapes.infographic_shapes.strokeDash": "dashed",
    "infographic_shapes.infographic_shapes.opacity": "50"
  }
}
```

## See also

- `ds-viz-icon-library` — 2500+ Material Symbols icons (no shape fill, no effects)
- `ds-viz-rectangle` — native Splunk rectangle (no app dependency, no effects,
  PDF-export-safe)
- `ds-viz-ellipse` — native Splunk ellipse
- `ds-svg` — custom SVG canvas generation
- `ds-ref-layout-grid` — faux glow patterns (fallback when app not installed)
