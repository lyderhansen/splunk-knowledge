# splunk.image — gotchas

## 1. External URL images do NOT render in PDF/PNG export

Scheduled PDF reports will silently show blank panels where the
image was. **Upload to KV store** for any dashboard that gets
exported.

## 2. `src` must be on the Dashboards Trusted Domains List

Otherwise the panel shows the placeholder image and the browser
surfaces:

> *"External image URLs must now have their domains listed in the
> Dashboards Trusted Domains List by working with your administrator.
> Alternatively, you can upload the image directly into the dashboard."*

Configure in `$SPLUNK_HOME/etc/system/local/web.conf`:

```
[settings]
dashboards_image_allow_list = www.splunk.com, splunk.com, cdn.example.com
```

Restart Splunkweb to pick up changes. On Splunk Cloud, file a
support case to update the trust list.

Splunk-bundled `/en-US/static/...` paths are **always trusted**.

## 3. No grid-layout support

The dashboard must be **absolute** layout. Pasting an image panel
into a grid dashboard fails to render silently.

## 4. No `opacity` option

To make a faint watermark, **bake the opacity into the asset** before
upload (export from Figma/Sketch at 20% opacity). There's no
`opacity` or `alpha` option in `splunk.image`.

## 5. `preserveAspectRatio: false` is the default

Logos look distorted out of the box. **Always set `true`** unless you
specifically want stretch.

## 6. No token interpolation in `src`

Writing `"src": "$logo_url$"` renders literally as a missing image.
Use multiple image panels + layout visibility tokens for "swap image
based on dropdown".

## 7. Z-order is array-order

If your KPI is hidden behind the background image, move the KPI
**later** in `structure` (not earlier). There is no `z-index`.

## 8. Splunk-bundled paths are always safe

`/en-US/static/...` is allow-listed by default and renders in PDF.
Useful for placeholders while you wait for your real asset to be
uploaded.

## 9. SVGs scale, PNGs don't

Use SVG for logos, icons, and diagrams. Save PNGs at 2x or 3x panel
size to avoid blur on Retina displays.

## 10. GIF animation works in browser, freezes in PDF

GIF animation plays in the browser viewer but **freezes on first
frame** in PDF/PNG export. Use SVG or a video link instead if you
need motion.

## 11. No drilldown / `onSelectionChanged` events

`splunk.image` is static. For clickable regions over an image (floor
plans, maps, diagrams):

1. Place the image at `(x, y, w, h)`.
2. On top, place transparent `splunk.rectangle` panels at the
   click-targets, each with its own drilldown.

`splunk.rectangle` supports `onSelectionChanged` and `linkUrl` /
`linkColor`. See `ds-viz-rectangle` PATTERNS for the hit-zone recipe.

## 12. Custom-uploaded SVGs need `currentColor` strokes

If a custom SVG renders, but `iconColor`-style theming doesn't apply,
open the SVG and confirm the stroke / fill is `currentColor` rather
than a hard-coded hex. (This is more relevant to
`splunk.singlevalueicon`, but custom SVGs intended for dynamic
theming follow the same rule.)
