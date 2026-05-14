# test22c_nike — session handover

## What was built

Single-viz Splunk app `nike_gauge` with one viz: `engagement_gauge`.
Circular arc gauge (270° sweep), volt (#CDFF00) on black, animated fill,
target marker, glow effects, bottom metrics bar. Packaged as tarball.

**Path:** `splunk-custom-visualizations/examples/nike_gauge/`
**Tarball:** `splunk-custom-visualizations/examples/nike_gauge.tar.gz` (12 KB)

## Skills used

1. `vp-ref-gotchas` — loaded first (mandatory)
2. `vp-create` — scaffolding, conf templates, packaging
3. `vp-viz` — viz source skeleton, formatter templates

## What went well

- **Formatter copy-paste templates (vp-viz)** — saved significant time.
  `{{VIZ_NAMESPACE}}`, `type="custom"`, `value=` not `default=` all
  correct on first attempt because the templates are explicit.
- **Directory structure (vp-create)** — unambiguous, no guesswork.
- **Gotchas severity tiers** — FATAL/BROKEN/REJECTED ordering lets me
  focus on what matters. F4 (ROW_MAJOR_OUTPUT_MODE), F6 (no define()),
  F12 (Splunk components only) all caught at write time.
- **Webpack config template** — copy-paste-ready, worked first try.
- **B13 (clearRect not fillRect)** — would have defaulted to fillRect
  without this rule.
- **B18/B20 theme auto-detection** — the detectTheme pattern with
  getCurrentTheme + DOM fallback is production-ready.

## Friction / skill gaps found

### 1. Validator false positives on minified bundles

**Problem:** The `validate_viz.sh` script greps the webpack OUTPUT
(`visualization.js`) for patterns like `!= null|safeStr`. Webpack
minification renames `safeStr` and rewrites `!= null` to `null!=`.
Both checks fail on correct code.

**Also:** The color picker check counts ALL `splunk-color-picker`
occurrences (opening + closing tag = 2) vs `type="custom"` (1, only
on opening tag). Always reports false failure.

**Fix suggestion:** Either:
- Run J5 (null guards) and J4 (theme detection) against the SOURCE
  file (`src/visualization_source.js`), not the minified bundle
- Or update the grep patterns: `null!=\|!=\s*null\|safeStr` and
  count only `<splunk-color-picker` (opening tag) not `splunk-color-picker`

### 2. B18 vs B20 contradiction on theme formatter

**B18 says:** "Do NOT add a theme radio to the formatter."
**B20 says:** "Every viz formatter MUST offer: auto | dark | light
(default: auto)."

These directly contradict. B20 is the correct one for production vizs
(user needs an override for testing). B18's blanket "no theme radio"
should be softened to "default MUST be auto, never dark or light" —
which is what B20 already says.

### 3. theme.js template missing function bodies

The template in `vp-create` lists exports like `loadFonts`,
`setupCanvas`, `parseNum`, `getNS`, `getOption` but the template body
only has placeholder comments for some of them. I had to write
`loadFonts`, `parseNum`, `getNS`, `getOption` from scratch by
referencing the gotchas (B1, B3).

**Fix suggestion:** Include full implementations of ALL exported
functions in the theme.js template. These are boilerplate that never
changes between brands — only the color tokens change.

### 4. No animation guidance

The viz has an eased entrance animation (arc sweeps from 0 to value
over 40 frames). Neither vp-viz nor vp-ref-patterns covers:
- How to structure `setInterval`-based frame animation
- Easing functions (I used custom ease-in-out quadratic)
- How `_animProgress` interacts with `_render()`
- The pattern of `_startAnim()` called from `updateView()`

C5 says "clean up timers in destroy" but doesn't show the animation
lifecycle pattern.

**Fix suggestion:** Add an animation recipe to vp-ref-patterns or
vp-viz covering: startAnim → frame loop → easing → cleanup. This is
common across gauges, progress bars, and any KPI with entrance motion.

### 5. Minimum formatter controls warning too aggressive

vp-viz says "minimum 10 controls" for simple vizs. This gauge has 7
controls and covers every user-configurable property. The warning
fires on every single-viz app with < 10 controls, creating noise.

**Fix suggestion:** Lower simple viz minimum to 7, or make the
validator count proportional to viz complexity (gauge/kpi = 7+,
table/chart = 12+).

### 6. preview.png and appIcon generation not actionable

The skill lists multiple generation methods (cairosvg, ImageMagick,
Pillow) but doesn't give a copy-paste Python snippet for the most
common case: Pillow (which is almost always available). I wrote my
own Pillow scripts for both.

**Fix suggestion:** Add a concrete Pillow snippet to vp-create for:
- `preview.png`: draw simplified viz silhouette at 200x100
- `appIcon.png`: brand-colored square with white glyph at 36x36 + 72x72

### 7. Single-viz app vs multi-viz pack

The skills are written assuming a multi-viz pack (5+ vizs, design
brief, vp-couture orchestration). For a single-viz app like this one,
~60% of the vp-couture workflow is unnecessary. There's no
"single-viz fast path" documented.

**Fix suggestion:** Add a note at the top of vp-create:
"For single-viz apps, skip vp-couture. Load vp-ref-gotchas + vp-viz
directly. Use the templates below with one viz stanza."

## Files written (complete list)

```
nike_gauge/
  shared/theme.js                          — Nike design tokens (volt/black)
  default/app.conf                         — 5 stanzas, build=1, v1.0.0
  default/visualizations.conf              — engagement_gauge stanza
  default/transforms.conf                  — demo lookup definition
  default/savedsearches.conf               — example saved search
  default/data/ui/nav/default.xml          — nav bar with volt accent
  default/data/ui/views/nike_engagement.xml — bundled DS v2 dashboard
  lookups/nike_gauge_demo.csv              — value=78.4, target=85.0
  metadata/default.meta                    — sc_admin, lookups exported
  README/savedsearches.conf.spec           — all 8 settings documented
  static/appIcon.png + _2x + Alt variants  — volt background icons
  appserver/static/visualizations/engagement_gauge/
    src/visualization_source.js            — Canvas 2D source (ES5)
    visualization.js                       — webpack AMD bundle
    formatter.html                         — 7 controls, {{VIZ_NAMESPACE}}
    visualization.css                      — container sizing
    preview.png                            — 200x100 gauge silhouette
  _build/webpack.config.js                 — multi-entry ES5 config
  _build/package.json                      — webpack 5 deps
  _build/build_flat.js                     — flat AMD fallback
```

## Build result

- Webpack: compiled successfully, 11.8 KB bundle
- AMD wrapper: `define([...], function(` confirmed
- ES5: 0 violations
- Tarball: 12 KB, no nested archives, correct top-level dir
- Validator: 2 false positives (minification artifacts), 0 real failures
