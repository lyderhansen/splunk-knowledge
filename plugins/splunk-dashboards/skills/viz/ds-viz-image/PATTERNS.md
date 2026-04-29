# splunk.image — verified patterns

13 panels in `ds_viz_image_dark` / `ds_viz_image_light`.

## Top — Trusted Domains warning panel

Always include in image-heavy dashboards. A `splunk.markdown` panel
that explains why an external image might render as a placeholder.

```json
{
  "type": "splunk.markdown",
  "options": {
    "markdown": "**External images:** add domain to `dashboards_image_allow_list` in `web.conf`. PDF/PNG export requires uploaded images, NOT external URLs.",
    "backgroundColor": "#3D2A1E"
  }
}
```

## 1. Default stretch — `preserveAspectRatio: false`

```json
{
  "type": "splunk.image",
  "options": { "src": "/static/app/<app>/banner.jpg" }
}
```

Image stretches to fill panel. Logos look distorted unless panel is
exactly the source aspect ratio. Use only for backgrounds where
distortion is OK.

## 2. Letterbox — `preserveAspectRatio: true`

```json
{
  "options": {
    "src": "/static/app/<app>/logo.png",
    "preserveAspectRatio": true
  }
}
```

Image scales to fit, longer axis fills panel, shorter axis shows
whitespace. **Use for logos, photos, diagrams.**

## 3. Logo in square panel

Same options as #2; layout `w == h`. Header logo in a fixed corner.

## 4. Same logo in wide panel

Same options as #2; layout `w >> h`. Demonstrates panel-driven aspect
ratio — the SVG/raster doesn't change, just the rendered crop.

## 5. Splunk-bundled `/en-US/static/...` path

```json
{
  "options": {
    "src": "/en-US/static/app/<app>/placeholder.svg",
    "preserveAspectRatio": true
  }
}
```

Always trusted (allow-list bypass). Renders in PDF/PNG export.

## 6. External CDN URL — PNG

```json
{
  "options": {
    "src": "https://cdn.example.com/logo.png",
    "preserveAspectRatio": true
  }
}
```

Requires domain in `dashboards_image_allow_list`. **Does NOT render
in PDF/PNG export.**

## 7. SVG external URL

```json
{
  "options": {
    "src": "https://cdn.example.com/architecture.svg",
    "preserveAspectRatio": true
  }
}
```

SVG scales to any panel size without blur. Same allow-list +
PDF-export caveats as #6.

## 8. Image as background layer

```json
"structure": [
  { "item": "viz_bg",  "position": { "x": 0, "y": 0, "w": 1440, "h": 280 } },
  { "item": "viz_kpi", "position": { "x": 1180, "y": 100, "w": 240, "h": 80 } }
]
```

`viz_bg` is `splunk.image`; `viz_kpi` is `splunk.singlevalue` with
`backgroundColor: "transparent"`. KPI sits on top because it's later
in the array.

Foundation for **branded section backdrops, datacenter floor plans,
hero callouts**.

## 9. KPI overlay on top of background image

Same layout as #8. The image becomes context, the KPI is the
message.

## 10. Faint watermark layer (pre-faded asset)

```json
{
  "options": {
    "src": "/static/app/<app>/watermark-20pct.png",
    "preserveAspectRatio": false
  }
}
```

Position as **first** entry in `structure` so everything else renders
on top. **Bake opacity into the asset** (Figma/Sketch export at 20%)
— there's no `opacity` option.

## 11. Markdown fallback for missing `src` (empty state)

```json
{
  "type": "splunk.markdown",
  "options": {
    "markdown": "**No image configured.** Upload via Studio or set `options.src`.",
    "backgroundColor": "#1A2440",
    "fontColor": "#E8E8E8"
  }
}
```

Same panel size as the planned image. Replace with `splunk.image`
once asset is uploaded.

## 12. SVG architecture diagram

Inline-`<path>`-heavy SVG. Crisp at any panel size. Pair with
overlay KPIs / status dots placed on top via absolute layout.

## 13. Datacenter floor plan with overlay rectangles

```json
"structure": [
  { "item": "viz_image_floor", "position": { "x": 20, "y": 20, "w": 1400, "h": 700 } },
  { "item": "viz_room_a",      "position": { "x": 320, "y": 200, "w": 180, "h": 120 } },
  { "item": "viz_room_b",      "position": { "x": 540, "y": 200, "w": 180, "h": 120 } }
]
```

`viz_image_floor` is `splunk.image`; `viz_room_*` are transparent
`splunk.rectangle` panels with drilldown handlers. See `ds-viz-
rectangle` PATTERNS for the hit-zone recipe.

## Header logo (top-left)

Standard pattern for dashboard branding:

```json
"viz_logo": {
  "type": "splunk.image",
  "options": {
    "src": "/servicesNS/nobody/<app>/storage/collections/data/dashboardimages/<id>",
    "preserveAspectRatio": true
  }
}
```

Layout: `{ "x": 20, "y": 20, "w": 240, "h": 60 }`.
