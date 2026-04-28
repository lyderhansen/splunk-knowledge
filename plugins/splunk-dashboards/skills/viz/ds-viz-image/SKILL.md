---
name: ds-viz-image
description: |
  splunk.image - the only way to put a real image (logo, screenshot, diagram,
  background canvas, watermark) on a Dashboard Studio dashboard. Absolute
  layout only. Verified against the 10.4 Dashboard Studio docs.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_image_dark
  - ds_viz_image_light
related:
  - ds-viz-markdown
  - ds-viz-rectangle
  - ds-viz-ellipse
---

# splunk.image

For logos in headers, screenshots in runbooks, architecture diagrams, datacenter
floor plans, branded backgrounds, and faint watermarks. The only image renderer
in Dashboard Studio.

## When to use

- **Logos** in dashboard headers (left of the title) or footers.
- **Screenshots** of UIs or third-party tools as part of a runbook.
- **Architecture diagrams** (prefer SVG so they stay crisp at any panel size).
- **Background canvases** under a section, with KPIs layered on top.
- **Watermarks** behind a dashboard ("CONFIDENTIAL", "DEMO DATA").
- **Floor plans / facility maps** with rectangles and singleValues for sensors
  and rooms placed at absolute coordinates on top.
- **Branded section dividers** that go further than `splunk.rectangle` alone.

## When NOT to use

- For inline icons next to text - use unicode glyphs or `splunk.markdown` with
  inline image references.
- For decorative shapes/gradients - use `splunk.rectangle` or
  `splunk.ellipse` (they render in PDF/PNG export, external URL images don't).
- For dynamic images driven by SPL - the `src` is **static**, no token
  interpolation. (Workaround: use layout visibility tokens with multiple
  pre-set image panels.)
- In **grid** layouts - `splunk.image` requires **absolute** layout.

## Data shape

`splunk.image` does not take a data source. The `src` option is the entire
content.

## Options (10.4 PDF)

| Option                  | Type    | Default  | Notes                                                                  |
| ----------------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `src`                   | string  | -        | URL of the image. Required. See "Image source" below.                  |
| `preserveAspectRatio`   | boolean | `false`  | `false` stretches to fill panel; `true` letterboxes inside the panel.  |

That's the entire option surface. Everything else - sizing, positioning,
layering - comes from the `layout.structure` block, not from the visualization
options.

## Supported formats

| Format | Recommended for                    | Renders in PDF/PNG? |
| ------ | ---------------------------------- | ------------------- |
| `png`  | Logos, screenshots, photos         | Yes (if uploaded)   |
| `jpeg` | Photos, dense images               | Yes (if uploaded)   |
| `gif`  | Static placeholders                | Yes (if uploaded)   |
| `webp` | Photos with smaller file size      | Yes (if uploaded)   |
| `svg`  | Diagrams, logos, icons (any size)  | Yes (if uploaded)   |

PDF/PNG export rules are governed by the **image source**, not the format.

## Image source: uploaded vs URL

There are **two** ways to source an image, and which you pick has real
operational consequences.

### 1. Uploaded to KV store (recommended for production)

Who can upload:

- Splunk Enterprise: admins
- Splunk Cloud: `sc_admins`
- Power users with the right capability

How:

- Dashboard Studio editor -> Add panel -> Image -> Upload.
- Or upload directly to the KV store via REST.

Why prefer it:

- **Renders in PDF/PNG exports** (URL images do not).
- No CSP / allow-list configuration required.
- Image travels with the dashboard.

### 2. Referenced by URL (any user, but with caveats)

Who can do it: anyone who can edit a dashboard.

How:

- Set `src` to an `http(s)://` URL or a Splunk-bundled `/en-US/static/...`
  path.

Caveats:

- The URL **domain must be on the Dashboards Trusted Domains List** (also
  surfaced in older docs as "dashboards image allow list"). Splunk blocks
  unlisted domains as a security control. The exact in-app error reads:

  > *External image URLs must now have their domains listed in the
  > Dashboards Trusted Domains List by working with your administrator.
  > Alternatively, you can upload the image directly into the dashboard.*

  Configure in `$SPLUNK_HOME/etc/system/local/web.conf`:

  ```
  [settings]
  dashboards_image_allow_list = www.splunk.com, splunk.com, cdn.example.com
  ```

  Restart Splunkweb to pick up changes. On Splunk Cloud, file a support
  case to update the trust list.
- **External URL images do NOT render in PDF/PNG export.** This silently
  breaks scheduled PDF deliveries.
- Splunk-bundled paths (`/en-US/static/app/<app>/...`) are always trusted
  and never need allow-listing.

Rule of thumb: for **dashboards that get exported as PDF**, always upload.
For internal-only views, URLs are fine - but verify the domain is on the
Trusted Domains List or every external panel will render as a placeholder.

## Layout: absolute only

`splunk.image` will not render inside a **grid** layout. The dashboard must
use:

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 900 },
  "structure": [...]
}
```

Inside `structure`, place the image with explicit `position` coordinates:

```json
{
  "item": "viz_logo",
  "type": "block",
  "position": { "x": 20, "y": 20, "w": 240, "h": 80 }
}
```

## Sizing & aspect ratio

The `preserveAspectRatio` option works exactly like the SVG attribute of the
same name:

- **`false` (default):** image **stretches** in both dimensions to fill the
  panel. Logos and photos look distorted unless the panel is exactly the
  source aspect ratio. Use only for backgrounds where distortion is OK.
- **`true`:** image is **scaled to fit** within the panel, preserving the
  source aspect ratio. The longer axis fills the panel; the shorter axis
  shows whitespace (letterboxing). Use for **logos, photos, diagrams**.

## Layering (z-order)

Z-order in Dashboard Studio is the **order of `structure` array items**:

- Earlier item -> rendered **first** -> visually **lower** (background).
- Later item -> rendered **after** -> visually **on top** (foreground).

To put a KPI on top of an image background:

```json
"structure": [
  { "item": "viz_background_layer", "position": { "x": 0,   "y": 0,   "w": 1440, "h": 400 } },
  { "item": "viz_overlay_kpi",      "position": { "x": 950, "y": 80,  "w": 240,  "h": 80  } }
]
```

This is the foundation for **datacenter floor plans, branded headers, and
hero callouts**.

## Verified patterns (test-dashboard reference)

The patterns below are **all rendered and verified** in
`ds_viz_image_dark` / `ds_viz_image_light`.

| Panel    | What it demonstrates                                  | Where to use                                |
| -------- | ----------------------------------------------------- | ------------------------------------------- |
| (top)    | Trusted Domains List warning panel                    | Always include in image-heavy dashboards    |
| 1        | Default `preserveAspectRatio=false` (stretches)       | Backgrounds where distortion is OK          |
| 2        | `preserveAspectRatio=true` (letterboxes)              | Logos, photos, diagrams                     |
| 3        | Logo in a square panel                                | Header logos in fixed corners               |
| 4        | Same logo in a wide panel                             | Demonstrates panel-driven aspect ratio      |
| 5        | Local Splunk-bundled `/en-US/static/...` path         | Always trusted; renders in PDF              |
| 6        | External CDN URL (PNG)                                | Requires trust list; **no** PDF export      |
| 7        | SVG image (external URL)                              | Diagrams, logos, anything that scales       |
| 8        | Image as background layer                             | Branded section backdrops                   |
| 9        | KPI overlay on top of background image                | Hero callouts, floor plan sensors           |
| 10       | Faint watermark layer (pre-faded asset)               | "DEMO DATA", "CONFIDENTIAL"                 |
| 11       | Markdown fallback panel for missing `src`             | Empty-state pattern (no image yet)          |
| 12       | SVG architecture diagram pattern                      | Crisp at any panel size                     |
| 13       | Datacenter floor plan                                 | Layer rectangles/sensors on top             |

## Drilldown

`splunk.image` does **not** fire `onSelectionChanged` events - it's a static
visual. There is no "click on this region of the image to drill down".

If you need clickable regions over an image (floor plans, maps, diagrams):

1. Place the image at coordinates `(x, y, w, h)`.
2. On top, place transparent **`splunk.rectangle`** panels at the click-
   targets, each with its own drilldown.

`splunk.rectangle` supports `onSelectionChanged` and `linkUrl`/`linkColor`.

## Common gotchas

1. **External URL images don't render in PDF/PNG export.** Scheduled PDF
   reports will silently show blank panels where the image was. Upload to
   KV store for any dashboard that gets exported.
2. **`src` must be on the Dashboards Trusted Domains List.** Otherwise the
   panel shows the placeholder image and the browser surfaces *"External
   image URLs must now have their domains listed in the Dashboards Trusted
   Domains List by working with your administrator."* Configure in
   `web.conf` -> `dashboards_image_allow_list`. Splunk-bundled
   `/en-US/static/...` paths are always trusted. The bench dashboard
   (`ds_viz_image_dark`) embeds an explicit info-panel about this so
   future editors don't have to re-discover it.
3. **No grid-layout support.** The dashboard must be absolute layout.
   Pasting an image panel into a grid dashboard fails to render.
4. **No opacity option.** To make a faint watermark, **bake the opacity
   into the asset** before upload (export from Figma/Sketch at 20%
   opacity). There's no `opacity` or `alpha` option in `splunk.image`.
5. **`preserveAspectRatio=false` is the default.** Logos look distorted
   out of the box. Always set `true` unless you want stretch.
6. **No token interpolation in `src`.** Writing `"src": "$logo_url$"`
   renders literally as a missing image. Use multiple image panels +
   layout visibility tokens for "swap image based on dropdown".
7. **Z-order is array-order.** If your KPI is hidden behind the
   background image, move the KPI **later** in `structure` (not earlier).
8. **Splunk-bundled paths (`/en-US/static/...`) are always safe** -
   allow-listed by default and render in PDF. Useful for placeholders
   while you wait for your real asset to be uploaded.
9. **SVGs scale, PNGs don't.** Use SVG for logos, icons, and diagrams.
   Save PNGs at 2x or 3x panel size to avoid blur on Retina displays.
10. **GIF animation works** in browser but **freezes on first frame** in
    PDF/PNG export. Use SVG or a video link instead if you need motion.

## Quick recipes

### Header logo (top-left)

```json
{
  "viz_logo": {
    "type": "splunk.image",
    "options": {
      "src": "/servicesNS/nobody/<app>/storage/collections/data/dashboardimages/<id>",
      "preserveAspectRatio": true
    }
  }
}
```

Layout: `{"x": 20, "y": 20, "w": 240, "h": 60}`.

### Background canvas with KPI overlay

```json
"structure": [
  {
    "item": "viz_bg",
    "position": { "x": 0, "y": 0, "w": 1440, "h": 280 }
  },
  {
    "item": "viz_kpi",
    "position": { "x": 1180, "y": 100, "w": 240, "h": 80 }
  }
]
```

`viz_bg` is `splunk.image` with `preserveAspectRatio: false`. `viz_kpi`
sits on top because it's later in the array.

### Faint watermark across the dashboard

```json
{
  "viz_watermark": {
    "type": "splunk.image",
    "options": {
      "src": "/static/app/<app>/watermark-20pct.png",
      "preserveAspectRatio": false
    }
  }
}
```

Position it as the **first** entry in `structure` so everything else
renders on top.

### Empty-state fallback (no image yet)

Use `splunk.markdown` with the same panel size:

```json
{
  "viz_no_src": {
    "type": "splunk.markdown",
    "options": {
      "markdown": "**No image configured.** Upload via Studio or set `options.src`.",
      "backgroundColor": "#1A2440",
      "fontColor": "#E8E8E8"
    }
  }
}
```

## See also

- `ds-viz-markdown` - typographic content, lighter than images
- `ds-viz-rectangle` - colored shapes for click-targets over images
- `ds-viz-ellipse` - circular highlights, status indicators
- `ds-design-principles` - when to reach for an image vs a shape
