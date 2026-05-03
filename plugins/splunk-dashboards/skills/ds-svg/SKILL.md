---
name: ds-svg
description: "Generate custom SVGs for Splunk Dashboard Studio — icons for singlevalueicon, images for splunk.image, choropleth canvases for splunk.choropleth.svg. Three modes (icon / image / choropleth-canvas), two paths (standalone explore→refine→deliver for complex SVGs, inline one-shot for simple icons). Inherits design context from ds-couture. Use when the user asks to create a custom icon, design an SVG, make a floor plan, rack diagram, pipeline visualization, branded logo, or any custom visual asset for a dashboard."
---

# ds-svg — custom SVG generator for Splunk dashboards

## When to use

Invoke this skill when:

- The user asks to create a custom icon for a `singlevalueicon` panel.
- The user asks to design an SVG — logo, wordmark, background illustration.
- The user wants a floor plan, rack diagram, or pipeline visualization as a Splunk panel.
- The user wants a branded logo or custom visual asset embedded in a dashboard.
- The user wants data-driven SVG fills: a choropleth panel where the canvas is a custom shape
  (building, network topology, datacenter grid) rather than a standard map.
- `ds-create` or `ds-mock` encounters a panel definition that requires a custom SVG asset and
  delegates here.
- The user says "make me an icon for X", "draw me a pipeline", "I need a rack view".

## When NOT to use

- **Standard geographic maps** (countries, states, zip codes) — use `ds-viz-map` with a
  choropleth layer instead.
- **Built-in Splunk icons** — if a Splunk-bundled icon name works, use `singlevalueicon` with
  `"icon": "<name>"` and skip SVG entirely.
- **Photographs or raster screenshots** — use `splunk.image` with a KV-store-uploaded raster.
  SVG is not the right format for photos.
- **Standard country/state choropleth** — use `splunk.map` with a choropleth layer; custom
  canvas adds no value there.

## Three modes

| Mode | viewBox | Delivery target |
|---|---|---|
| **Icon** | 64×64 | `singlevalueicon` (KV-store) or inline data-URI via `choropleth.svg` hack |
| **Image** | Variable (logo 400×120, background 1440×900) | `splunk.image` (KV-store or app-static) |
| **Choropleth canvas** | Variable (rack 200×800, floor 1200×800) | `splunk.choropleth.svg` (data-URI or KV-store) |

Choose the mode before generating. If unsure: icons are small, symbolic, monochrome-friendly;
images are decorative or structural; choropleth canvases have named `<path id>` elements that
receive data-driven color fills.

## Context inheritance from ds-couture

When `ds-couture` has already run and established design context for the current session, this
skill inherits that context automatically. Do not re-ask questions that couture already answered.

**Palette:** Every fill, stroke, and gradient stop must use colors from the established palette.
Do not introduce independent color choices. Reference the couture palette by hex value.

**Tone:**
- "bold / corporate" direction → thick strokes (2–3px at 64px viewBox), solid fills, minimal
  negative space, high contrast.
- "minimal / geometric" direction → thin lines (1px), open shapes, generous whitespace, flat
  fills only.
- "playful" direction → rounded corners, organic curves, multiple palette colors, gradient fills
  permitted.

**Theme:** SVGs must work in both dark and light Splunk themes. Use `currentColor` for strokes
wherever possible. Avoid hardcoded near-white or near-black fills that will become invisible on
the opposite theme. Test contrast at both extremes before delivering.

**Fallback (no couture context):** If no design context has been established, ask exactly two
quick questions before proceeding:
1. Palette — provide hex values or a brand reference (e.g. "Cisco blue #049FD9, dark navy
   #1D2D3E").
2. Style direction — pick one: minimal / bold / playful.

Do not start generating until these two answers are in hand.

## Standalone workflow

Use the standalone workflow when:
- The SVG is the primary deliverable (not an incidental asset inside a larger ds-create run).
- The shape is complex enough that the user would want to compare concepts before committing.
- Mode is choropleth-canvas or image (icons may use inline workflow instead).

### Explore phase

Generate 3–5 distinct concepts. Each concept explores a different visual approach: different
shapes, metaphors, or levels of detail. Run concepts in parallel using Agent tool calls so the
user receives all concepts at once rather than waiting for sequential generation.

**Each agent receives:**
- The full contents of `SVG-CONVENTIONS.md` in this directory (mandatory read).
- The target file path: `svgs/concepts/concept-N.svg` (N = 1…5).
- Creative direction: mode, palette hex values, tone, intended meaning of the icon/image.
- viewBox dimensions appropriate to the mode.

**Agent parameters:**
```
model: "sonnet"
mode: "bypassPermissions"
```

After all agents complete, generate `svgs/preview.html` using the template below. Open the
preview HTML and invite the user to identify their favorite concept or request changes.

### Preview HTML template

Write `svgs/preview.html` with this exact structure — replace `{{PHASE}}`, `{{CARDS}}`,
`{{PATH}}`, and `{{LABEL}}` tokens:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SVG Preview — {{PHASE}}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; transition: background-color 0.3s, color 0.3s; }
  body.light { background: #f5f5f5; color: #333; }
  body.dark { background: #1a1a1a; color: #eee; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  h1 { font-size: 1.5rem; font-weight: 600; }
  .toggle { padding: 0.5rem 1rem; border: 1px solid currentColor; border-radius: 6px; background: transparent; color: inherit; cursor: pointer; font-size: 0.875rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  .card { border: 1px solid rgba(128,128,128,0.3); border-radius: 12px; overflow: hidden; }
  .card-img { display: flex; align-items: center; justify-content: center; padding: 2rem; min-height: 240px; }
  body.light .card-img { background: #fff; }
  body.dark .card-img { background: #2a2a2a; }
  .card-img img { max-width: 100%; max-height: 200px; }
  .card-label { padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; border-top: 1px solid rgba(128,128,128,0.3); }
  body.light .card-label { background: #fafafa; }
  body.dark .card-label { background: #222; }
</style>
</head>
<body class="light">
  <div class="header">
    <h1>SVG Preview — {{PHASE}}</h1>
    <button class="toggle" onclick="document.body.classList.toggle('dark');document.body.classList.toggle('light');this.textContent=document.body.classList.contains('dark')?'Light':'Dark';">Dark</button>
  </div>
  <div class="grid">{{CARDS}}</div>
</body>
</html>
```

Each card in `{{CARDS}}`:
```html
<div class="card"><div class="card-img"><img src="{{PATH}}" alt="{{LABEL}}"></div><div class="card-label">{{LABEL}}</div></div>
```

### Favicon size check strip (icon mode only)

After the main grid, append a second section to `preview.html` that renders each icon SVG at
three fixed pixel sizes: 64px, 32px, and 16px. Use inline `<img>` with explicit `width` and
`height` attributes. Label each size clearly.

If details (thin lines, fine text, small secondary shapes) become invisible at 32px, note this
in the preview and suggest a simplified variant. An icon that only reads at 64px is fragile —
Splunk may render `singlevalueicon` smaller than expected.

### Refine phase

After the user selects a concept:

- **Single tweak** (one feedback item): apply it directly. Write the result to
  `svgs/iterations/iteration-1.svg`. Regenerate preview. Increment iteration number on each
  subsequent single-tweak pass.
- **Batch variations** (three or more feedback items, or "show me three variations of X"):
  spin up parallel agents, one per variation, writing to `svgs/iterations/iteration-N.svg`.
  Regenerate preview after all complete.
- **Regression**: if the user says "go back to iteration N" or "I liked concept 2 better",
  use that file as the new base for subsequent refinement. Do not lose old files.

Keep iterating until the user explicitly approves a result or says "deliver this".

### Deliver phase

Once the user approves an SVG, deliver in the format matching the mode.

**Icon — inline data-URI (no upload required):**
```json
{
  "type": "splunk.choropleth.svg",
  "options": {
    "svg": "data:image/svg+xml;utf8,<svg ...>...</svg>",
    "backgroundColor": "transparent"
  }
}
```
Percent-encode `#` as `%23` in all hex color values inside the data-URI. Do not URL-encode
the entire SVG string — only `#` characters. Validate the resulting JSON parses cleanly.

**Image — KV-store upload:**
```
Upload via: Splunk UI → Dashboard Editor → Add Panel → Image → Upload
Reference path: /servicesNS/nobody/<app>/storage/collections/data/dashboardimages/<id>
```
Provide the finalized SVG file and the reference path template. Remind the user that
`splunk.image` rejects data-URIs silently — upload is the only supported path for images.

**Choropleth canvas — data-binding:**
```json
{
  "type": "splunk.choropleth.svg",
  "dataSources": { "primary": "ds_region_health" },
  "options": {
    "svg": "data:image/svg+xml;utf8,<svg ...>...</svg>",
    "areaIds": "> primary | seriesByName('region') | values()",
    "areaValues": "> primary | seriesByName('value') | values()",
    "areaColor": "> primary | seriesByName('value') | values() | rangeValue(thresholds)"
  },
  "context": {
    "thresholds": [
      { "value": 0, "label": "OK", "color": "#2ECC71" },
      { "value": 50, "label": "Warning", "color": "#F1C40F" },
      { "value": 80, "label": "Critical", "color": "#E74C3C" }
    ]
  }
}
```
Replace `ds_region_health` and column names with actual data source ID and field names from
the user's SPL. Replace threshold values and colors with the established couture palette
where applicable. Confirm that every `<path id>` in the SVG matches a value returned by the
`region` series — mismatches silently produce no fill.

## Inline workflow

Use the inline workflow for simple icons generated during a `ds-create` or `ds-mock` run,
where stopping to explore concepts would interrupt the dashboard build unnecessarily.

1. Read `ICON-PATTERNS.md` in this directory.
2. Pick the closest exemplar from the pattern library. If an exact match exists, adapt it
   directly rather than generating from scratch.
3. Adjust all colors to the current couture palette (or the fallback palette if couture has
   not run).
4. Embed the final SVG as a data-URI in a `splunk.choropleth.svg` panel definition and
   return it inline to the calling skill.
5. No preview loop, no concept phase, no iteration files. If the user later wants to refine
   the icon, switch to the standalone workflow at that point.

## Required reading

Before generating any SVG for this skill, read `SVG-CONVENTIONS.md` in this directory. All
conventions defined there are mandatory — not advisory. Do not skip this step.

- For icon mode: also read `ICON-PATTERNS.md` before generating.
- For choropleth canvas mode: also read `CANVAS-PATTERNS.md` before generating.

These files contain encoding rules, viewBox standards, path-naming requirements, and
theme-safety checks that are not repeated in this file.

## Icon quality gate

**Always copy from exemplars first.** ICON-PATTERNS.md contains ~30
verified icon SVGs. If the requested icon matches or is close to an
exemplar, adapt it — do not generate from scratch.

**For concepts without an exemplar:** complex or unfamiliar shapes
(vehicles, anatomy, gauges, machinery) are hard to get right from a
text description alone. Before generating, use web search to study how
the concept looks in established icon libraries (Lucide, Heroicons,
Feather, Material Symbols). Study the geometry — which shapes, what
proportions — then build your SVG from that understanding.

**Manual QA required for:** gauges/dials, animals, human figures,
vehicles, buildings, tools, musical instruments — anything where
proportions determine recognizability. Generate, preview, and ask the
user before delivering.

## See also

- `ds-couture` — design context provider; run before this skill for any aesthetically
  significant SVG deliverable.
- `ds-viz-choropleth-svg` — inline SVG hack details, `areaIds` binding recipe, threshold
  palette patterns, and verified Splunk version compatibility notes.
- `ds-viz-image` — KV-store upload workflow, app-static path patterns, and PDF export
  caveats for raster vs. SVG images.
- `ds-viz-singlevalueicon` — icon rendering details, UUID portability across Splunk
  instances, and KV-store upload path for custom icon sets.
- `ds-ref-color` — canonical palette colors, brand hex values, and dark/light theme
  contrast guidance for SVG fills.
