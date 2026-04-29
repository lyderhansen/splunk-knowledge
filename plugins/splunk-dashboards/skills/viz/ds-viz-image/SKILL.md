---
name: ds-viz-image
description: Splunk Dashboard Studio splunk.image visualization — the only way to put a real image (logo, screenshot, diagram, background canvas, watermark) on a dashboard. Provides patterns for header logos, background canvases with KPI overlays, datacenter floor plans with rectangle hit-zones, faint watermarks, and the upload-vs-URL trade-off (PDF export caveat). Use when the user asks about images, logos, screenshots, architecture diagrams, floor plans, watermarks, or branded backgrounds in Splunk Dashboard Studio.
---

# splunk.image — image renderer

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_image_dark` / `ds_viz_image_light`.

The only image renderer in Dashboard Studio. For logos, screenshots,
architecture diagrams, datacenter floor plans, branded backgrounds,
and watermarks.

## When to use

- **Logos** in dashboard headers / footers.
- **Screenshots** of UIs / third-party tools as part of a runbook.
- **Architecture diagrams** (prefer SVG — stays crisp at any panel
  size).
- **Background canvases** under a section, with KPIs on top.
- **Watermarks** behind a dashboard ("CONFIDENTIAL", "DEMO DATA").
- **Floor plans / facility maps** with rectangles + singlevalues
  layered on top.

## When NOT to use

- **Inline icons next to text** → unicode glyphs or
  `splunk.markdown` with inline image references.
- **Decorative shapes / gradients** → `splunk.rectangle` /
  `splunk.ellipse` (they render in PDF/PNG export, external URL
  images don't).
- **Dynamic image driven by SPL** — `src` is **static**, no token
  interpolation. Workaround: multiple pre-set image panels with
  visibility tokens.
- **Grid layouts** — image only renders in **absolute** layout.

## Quick start

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

Layout: `{ "x": 20, "y": 20, "w": 240, "h": 60 }`.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **PDF / PNG export:** upload to KV store. | Reference external URL — does NOT render in PDF/PNG export, silently breaks scheduled deliveries. |
| **Logos / photos / diagrams:** `preserveAspectRatio: true`. | Default `false` for logos — image stretches to fill panel and looks distorted. |
| **External URLs:** allow-list domain via `dashboards_image_allow_list` in `web.conf`. | Reference any domain expecting it to load — Splunk shows placeholder + warning until allow-listed. |
| **SVG for diagrams** — scales infinitely, renders crisp. | PNG diagrams expecting scale — they blur on Retina. Save PNGs at 2x–3x panel size. |
| **Watermark opacity:** bake it into the asset (export from Figma at 20%). | Look for an `opacity` option — there isn't one. |
| **Hit-zones over images:** transparent `splunk.rectangle` ON TOP. | Try to wire drilldown on `splunk.image` — it has no `onSelectionChanged`. |
| **Splunk-bundled paths** (`/en-US/static/...`) — always trusted. | Use Splunk-bundled paths for production logos — they're better as placeholders. |

## Two options total

| Option | Type | Default | Notes |
|---|---|---|---|
| `src` | string | — | URL of the image. Required. |
| `preserveAspectRatio` | boolean | `false` | `false` stretches; `true` letterboxes. |

That's the entire option surface. Sizing, positioning, layering all
come from `layout.structure`.

## Image source: uploaded vs URL

### 1. Uploaded to KV store (recommended for production)

- Upload via Dashboard Studio editor → Add panel → Image → Upload.
- Or upload directly via REST.
- **Renders in PDF/PNG exports.**
- No CSP / allow-list configuration required.
- Image travels with the dashboard.

### 2. Referenced by URL

Set `src` to `http(s)://...` or Splunk-bundled `/en-US/static/...`.

**Caveats:**

- **Domain must be on Dashboards Trusted Domains List** ("dashboards
  image allow list" in older docs). Configure in
  `$SPLUNK_HOME/etc/system/local/web.conf`:

  ```
  [settings]
  dashboards_image_allow_list = www.splunk.com, splunk.com, cdn.example.com
  ```

  Restart Splunkweb. On Splunk Cloud, file a support case.

- **External URL images do NOT render in PDF/PNG export.**
  Scheduled PDF reports show blank panels where the image was.

- Splunk-bundled paths (`/en-US/static/app/<app>/...`) are always
  trusted.

**Rule of thumb:** for dashboards exported as PDF, always upload. For
internal-only views, URLs are fine — but verify domain is on the
trusted list.

## Layout: absolute only

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 900 },
  "structure": [...]
}
```

## Z-order = `structure` array order

Earlier item = behind, later item = in front.

```json
"structure": [
  { "item": "viz_background_layer", "position": { "x": 0,   "y": 0,   "w": 1440, "h": 400 } },
  { "item": "viz_overlay_kpi",      "position": { "x": 950, "y": 80,  "w": 240,  "h": 80  } }
]
```

This is the foundation for **floor plans, branded headers, hero
callouts**.

## Supported formats

| Format | Recommended for | PDF/PNG? |
|---|---|---|
| `png` | Logos, screenshots, photos | ✅ if uploaded |
| `jpeg` | Photos | ✅ if uploaded |
| `gif` | Static placeholders | ✅ if uploaded (animation freezes on first frame) |
| `webp` | Smaller-file photos | ✅ if uploaded |
| `svg` | Diagrams, logos, icons | ✅ if uploaded |

PDF/PNG export rules are governed by the **image source**, not the
format.

## Drilldown

`splunk.image` does **not** fire `onSelectionChanged` events. For
clickable regions:

1. Place the image at `(x, y, w, h)`.
2. On top, place transparent `splunk.rectangle` panels at the
   click-targets, each with its own drilldown.

See `ds-viz-rectangle` PATTERNS for the hit-zone recipe.

## See also

- [PATTERNS.md](PATTERNS.md) — 13 verified patterns: stretch /
  letterbox, logo in square vs wide panel, Splunk-bundled paths,
  external CDN URLs, SVG architecture diagrams, background layers,
  KPI overlays, faint watermarks, markdown fallbacks for missing
  `src`, datacenter floor plans with overlay rectangles.
- [GOTCHAS.md](GOTCHAS.md) — PDF-export caveat, allow-list rule,
  no `opacity` option, no token interpolation in `src`,
  `currentColor` requirement for custom SVGs.
- `ds-viz-markdown` — typographic content, lighter than images.
- `ds-viz-rectangle` — coloured shapes + click-targets over images.
- `ds-viz-ellipse` — circular highlights, status indicators.
- `ds-design-principles` — when to reach for image vs shape.
