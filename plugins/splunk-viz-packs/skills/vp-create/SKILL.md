---
name: vp-create
description: "Scaffolds and packages themed Splunk custom visualization apps (multi-viz packs). Creates the complete app directory structure, generates theme.js design tokens from a design brief, writes all Splunk conf files, runs the webpack multi-entry build, and produces the deployable tarball. MUST load vp-ref-gotchas before writing any source code."
---

# vp-create — scaffold and package a viz pack

> **Cross-plugin rules apply:** Dashboard JSON follows `ds-create`
> hard defaults (from `splunk-dashboard-studio`). SPL follows
> `spl-gotchas` traps (from `splunk-spl`). Load both before writing.

## Output directory

All packs are created at:
```
/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-custom-visualizations/examples/{pack_name}/
```

## Directory structure

```
examples/{pack_name}/
  default/
    app.conf
    visualizations.conf
    transforms.conf              (lookup definitions)
    savedsearches.conf
    data/ui/nav/default.xml      (navigation bar)
    data/ui/views/               (bundled dashboards)
  lookups/
    demo_kpis.csv                (demo data for KPI vizs)
    demo_timeseries.csv          (demo data for charts)
    demo_table.csv               (demo data for tables)
  metadata/
    default.meta
  README/
    savedsearches.conf.spec
  static/
    appIcon.png                 (36x36 — ONLY app icons here)
    appIcon_2x.png              (72x72)
    appIconAlt.png              (36x36)
    appIconAlt_2x.png           (72x72)
  shared/
    theme.js                    (dev only — bundled into viz.js by webpack)
  _build/
    webpack.config.js
    package.json
  appserver/static/
    images/                     (logos, hero images, brand assets)
      logo.svg
      hero.jpg
    visualizations/
      {viz_1}/
        src/visualization_source.js
        formatter.html
        visualization.css
        preview.png
      {viz_2}/
        ...
```

## theme.js template

Replace `{{PLACEHOLDER}}` values from the design brief.

```javascript
/*
 * {{PACK_LABEL}} — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function withAlpha(hex, alpha) { /* hex -> rgba string */ }
function lerpColor(a, b, t) { /* linear interpolation between two hex colours */ }

var DARK = {
    name: 'dark',
    bg: '{{DARK_BG}}',
    panel: '{{DARK_PANEL}}',
    panelHi: '{{DARK_PANEL_HI}}',
    edge: '{{DARK_EDGE}}',
    edgeStrong: '{{DARK_EDGE_STRONG}}',
    grid: '{{DARK_GRID}}',
    text: '{{DARK_TEXT}}',
    textDim: '{{DARK_TEXT_DIM}}',
    textFaint: '{{DARK_TEXT_FAINT}}',
    s1: '{{DARK_S1}}',
    s2: '{{DARK_S2}}',
    s3: '{{DARK_S3}}',
    s4: '{{DARK_S4}}',
    s5: '{{DARK_S5}}',
    accent: '{{DARK_ACCENT}}',
    success: '{{DARK_SUCCESS}}',
    warn: '{{DARK_WARN}}',
    danger: '{{DARK_DANGER}}',
    invert: '{{DARK_INVERT}}'
};

var LIGHT = {
    name: 'light',
    bg: '{{LIGHT_BG}}',
    panel: '{{LIGHT_PANEL}}',
    panelHi: '{{LIGHT_PANEL_HI}}',
    edge: '{{LIGHT_EDGE}}',
    edgeStrong: '{{LIGHT_EDGE_STRONG}}',
    grid: '{{LIGHT_GRID}}',
    text: '{{LIGHT_TEXT}}',
    textDim: '{{LIGHT_TEXT_DIM}}',
    textFaint: '{{LIGHT_TEXT_FAINT}}',
    s1: '{{LIGHT_S1}}',
    s2: '{{LIGHT_S2}}',
    s3: '{{LIGHT_S3}}',
    s4: '{{LIGHT_S4}}',
    s5: '{{LIGHT_S5}}',
    accent: '{{LIGHT_ACCENT}}',
    success: '{{LIGHT_SUCCESS}}',
    warn: '{{LIGHT_WARN}}',
    danger: '{{LIGHT_DANGER}}',
    invert: '{{LIGHT_INVERT}}'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '{{FONT_DATA}}',   // numbers, KPIs, gauges — monospaced for alignment
    ui: '{{FONT_UI}}'        // labels, headers, descriptions — sans-serif
    // Packs can add more slots as needed, e.g.:
    //   display: '{{FONT_DISPLAY}}'  — hero headlines, oversized KPIs
    //   accent:  '{{FONT_ACCENT}}'   — decorative or special-purpose elements
    // Two slots is the standard; add only when the brief calls for it.
};
// Default (no custom fonts): data = system mono, ui = system sans
// '"SF Mono", Menlo, Consolas, monospace' + '"Helvetica Neue", Helvetica, Arial, sans-serif'
// Only embed custom fonts via base64 when the brand specifically requires them.

function severityColor(t, sev) { /* maps crit/warn/ok -> t.danger/t.warn/t.success */ }
function fmtNum(v, opts) { /* compact number format: 1.2k, 3.4M, 1.1B */ }
function roundRect(ctx, x, y, w, h, r) { /* Canvas rounded rectangle path */ }
function drawPanel(ctx, t, x, y, w, h) { /* panel chrome: fill + 1px edge + 6px radius */ }
function drawHGrid(ctx, t, x, y, w, h, divisions) { /* hairline horizontal gridlines */ }
function parseColors(raw, fallback) { /* CSV string -> array of hex colours */ }
function parseInts(raw) { /* CSV string -> array of integers */ }

module.exports = {
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    severityColor: severityColor,
    fmtNum: fmtNum,
    roundRect: roundRect,
    drawPanel: drawPanel,
    drawHGrid: drawHGrid,
    parseColors: parseColors,
    parseInts: parseInts,
    FONTS: FONTS
};
```

## app.conf template

```ini
[install]
is_configured = 0
build = 1

[id]
name = {{PACK_ID}}

[package]
id = {{PACK_ID}}
check_for_updates = false

[ui]
is_visible = true
label = {{PACK_LABEL}}

[launcher]
author = {{AUTHOR}}
description = {{DESCRIPTION}}
version = {{VERSION}}
```

## default.meta template

```ini
[]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[visualizations/{{VIZ_1}}]
export = system

[visualizations/{{VIZ_2}}]
export = system

[lookups]
export = system
```

One `[visualizations/name]` stanza per viz in the pack.

## visualizations.conf template

Character limits: label max 30, description max 80, search_fragment max 80.

**CRITICAL: Every stanza MUST include `allow_user_selection = true` and
`disabled = 0`.** Without these, the viz appears in the picker but
formatter settings are READ-ONLY in ad-hoc search — the user can see
settings but changes have no effect.

```ini
[{{VIZ_1}}]
label = {{LABEL_30}}
description = {{DESC_80}}
default_height = {{HEIGHT}}
allow_user_selection = true
disabled = 0
search_fragment = {{FRAGMENT_80}}

[{{VIZ_2}}]
label = {{LABEL_30}}
description = {{DESC_80}}
default_height = {{HEIGHT}}
allow_user_selection = true
disabled = 0
search_fragment = {{FRAGMENT_80}}
```

## Demo data — CSV lookups (preferred over makeresults)

Since viz packs are installable Splunk apps, bundle demo data as
CSV lookup files. This produces cleaner SPL, realistic data, and
dashboards that work immediately after install — no index needed.

### transforms.conf template

```ini
[{{PACK_ID}}_demo_kpis]
filename = {{PACK_ID}}_demo_kpis.csv

[{{PACK_ID}}_demo_timeseries]
filename = {{PACK_ID}}_demo_timeseries.csv

[{{PACK_ID}}_demo_table]
filename = {{PACK_ID}}_demo_table.csv
```

### CSV file conventions

**CRITICAL: `inputlookup` uses the FILENAME, not the transforms.conf
stanza name.** The filename in `lookups/` must EXACTLY match what the
SPL query references.

```
transforms.conf:
  [mypack_demo_kpis]
  filename = mypack_demo_kpis.csv    ← THIS filename

lookups/:
  mypack_demo_kpis.csv               ← MUST match

SPL:
  | inputlookup mypack_demo_kpis.csv ← uses filename, not stanza
```

**Convention:** prefix ALL lookup filenames with `{{PACK_ID}}_` to avoid
collisions with other apps. Use the SAME prefixed name in transforms.conf
`filename=` AND in SPL `| inputlookup`.

Place CSV files in `lookups/` at the app root. Use descriptive
column names that match the viz's expected field names.

**KPI data** (`lookups/demo_kpis.csv`):
```csv
metric,value,delta,unit
Revenue,4200000,12.3,$
Users,287000,5.1,
Latency,42,-8.2,ms
Error Rate,0.3,0.05,%
```

**Time series** (`lookups/demo_timeseries.csv`):
```csv
_time,speed,throttle,brake
1714900000,312,98,0
1714900004,280,85,12
1714900008,95,20,85
1714900012,240,92,0
```

**Table data** (`lookups/demo_table.csv`):
```csv
Driver,Lap,Sector1,Sector2,Sector3,Compound,Gap
Verstappen,42,28.412,24.891,28.281,Medium,
Norris,42,28.721,25.044,28.437,Hard,+1.234
Leclerc,42,28.903,25.102,28.612,Soft,+3.456
```

### Dashboard data source using lookup

```json
"ds_kpis": {
    "type": "ds.search",
    "options": {
        "query": "| inputlookup {{PACK_ID}}_demo_kpis.csv",
        "queryParameters": { "earliest": "-24h", "latest": "now" }
    },
    "name": "Demo KPIs"
}
```

For time series that need `_time` as epoch:
```json
"ds_trace": {
    "type": "ds.search",
    "options": {
        "query": "| inputlookup {{PACK_ID}}_demo_timeseries.csv | eval _time=_time",
        "queryParameters": { "earliest": "-24h", "latest": "now" }
    },
    "name": "Demo trace"
}
```

### When to use makeresults instead

Use `| makeresults` only when the data must be dynamic (random
values, current timestamps). For static demo data that shows off
the viz, CSV lookups are always better — cleaner SPL, realistic
values, and no `random()%20` artifacts.

## savedsearches.conf template

One example search per viz using the bundled lookup data:

```ini
[{{PACK_LABEL}} - {{Viz Label}}]
search = | inputlookup {{PACK_ID}}_demo_kpis.csv | head 1
dispatch.earliest_time = -24h
dispatch.latest_time = now
display.general.type = visualizations
display.visualizations.type = custom
display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.theme = dark
```

## savedsearches.conf.spec template

```
# ─── {{viz_name}} ──────────────────────────────────────────────
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.theme = <string>
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.{{setting1}} = <string>
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.{{setting2}} = <string>
```

One block per viz documenting every formatter setting.

**NOTE:** The spec file uses the LONG format
(`display.visualizations.custom.{app}.{viz}.setting`) but formatter.html
uses `{{VIZ_NAMESPACE}}.setting`. These are different formats for different
purposes — the spec registers settings with Splunk, the formatter uses
the template variable for runtime resolution. Both are required.

**Formatter default values:** color picker defaults must use the pack's
theme accent token, not a hardcoded hex. In formatter.html, write
`value="{{ACCENT}}"` where `{{ACCENT}}` is replaced with the actual
accent hex from the design brief during scaffolding. Never ship a
formatter with generic defaults like `value="#1a91a8"`.

## webpack.config.js (_build/)

```javascript
var path = require('path');
var fs = require('fs');

var VIZ_ROOT = path.resolve(__dirname, '..', 'appserver', 'static', 'visualizations');

var vizNames = fs.readdirSync(VIZ_ROOT).filter(function (n) {
    var p = path.join(VIZ_ROOT, n);
    return fs.statSync(p).isDirectory() &&
           fs.existsSync(path.join(p, 'src', 'visualization_source.js'));
});

var entries = {};
vizNames.forEach(function (name) {
    entries[name] = path.join(VIZ_ROOT, name, 'src', 'visualization_source.js');
});

module.exports = {
    entry: entries,
    target: ['web', 'es5'],
    output: {
        filename: '[name]/visualization.js',
        path: VIZ_ROOT,
        libraryTarget: 'amd',
        environment: {
            arrowFunction: false,
            bigIntLiteral: false,
            const: false,
            destructuring: false,
            forOf: false,
            dynamicImport: false,
            module: false
        }
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ],
    resolve: {
        alias: {
            'shared': path.resolve(__dirname, '..', 'shared')
        },
        modules: [path.resolve(__dirname, 'node_modules')]
    }
};
```

## package.json (_build/)

```json
{
  "name": "{{PACK_ID}}",
  "version": "{{VERSION}}",
  "description": "Multi-entry build for {{PACK_LABEL}}",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  },
  "devDependencies": {
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.4"
  }
}
```

## Alternative: flat AMD build (build_flat.js)

If webpack bundles cause `REQUIREJS_ERROR_MESSAGE Script error` in
Dashboard Studio v2's sandboxed iframe (see vp-ref-gotchas F11), use
a flat AMD build instead. This is a fallback — try webpack first.

### _build/build_flat.js

```javascript
var fs = require('fs');
var path = require('path');

var VIZ_ROOT = path.resolve(__dirname, '..', 'appserver', 'static', 'visualizations');
var SHARED = path.resolve(__dirname, '..', 'shared');
var themeRaw = fs.readFileSync(path.join(SHARED, 'theme.js'), 'utf8');

// Strip require/module.exports from theme to make it inlineable
// NOTE: The module.exports regex must NOT use the m flag.
// With m, $ matches end-of-line, stripping only the first line
// and leaving a stray } that breaks the IIFE. Without m, $
// matches end-of-string, stripping the entire block.
var themeBody = themeRaw
    .replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '')
    .replace(/module\.exports\s*=\s*\{[\s\S]*$/, '');

var vizDirs = fs.readdirSync(VIZ_ROOT).filter(function(n) {
    var srcPath = path.join(VIZ_ROOT, n, 'src', 'visualization_source.js');
    return fs.existsSync(srcPath);
});

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_ROOT, vizName, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_ROOT, vizName, 'visualization.js');
    var src = fs.readFileSync(srcPath, 'utf8');

    // Strip require lines
    src = src.replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '');

    // Convert module.exports = X; to return X;
    src = src.replace(/^module\.exports\s*=\s*/m, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], ' +
        'function(SplunkVisualizationBase, SplunkVisualizationUtils) {',
        '',
        '// ── Inlined theme.js ──',
        'var theme = (function() {',
        themeBody,
        '    return { getTheme:getTheme, withAlpha:withAlpha, lerpColor:lerpColor,',
        '        severityColor:severityColor, fmtNum:fmtNum, roundRect:roundRect,',
        '        drawPanel:drawPanel, drawHGrid:drawHGrid, parseColors:parseColors,',
        '        parseInts:parseInts, FONTS:FONTS, getNS:getNS, getOption:getOption,',
        '        parseNum:parseNum, loadFonts:loadFonts, setupCanvas:setupCanvas };',
        '})();',
        '',
        '// ── Viz source ──',
        src,
        '',
        '});'
    ].join('\n');

    fs.writeFileSync(outPath, output);
    console.log('  Built: ' + vizName + '/visualization.js');
});

console.log('Done — ' + vizDirs.length + ' vizs built (flat AMD).');
```

**Usage:**
```bash
cd examples/{{PACK_ID}}/_build
node build_flat.js
```

**When to use:** only if webpack builds produce Script errors in
Dashboard Studio v2 that can't be explained by F1-F9.

## Build process

### Option A: webpack (default)

```bash
cd examples/{{PACK_ID}}/_build
npm install
npm run build
```

### Option B: flat AMD (fallback for DS v2 iframe issues)

```bash
cd examples/{{PACK_ID}}/_build
node build_flat.js
```

Use Option B only if webpack bundles cause Script errors in Dashboard
Studio v2 (see vp-ref-gotchas F11). Try Option A first.

Verify every bundle after build:

```bash
for viz in ../appserver/static/visualizations/*/visualization.js; do
  echo "--- $viz ---"
  head -c 200 "$viz"
  echo
done
# Each MUST start with: define(["api/SplunkVisualizationBase"
# Each MUST NOT contain: => or const or let
```

## Post-build validation — MANDATORY

After EVERY build (webpack or flat AMD), run ALL of these checks on
each `visualization.js`. If ANY check fails, do NOT package. Fix and
rebuild.

```bash
for viz in ../appserver/static/visualizations/*/visualization.js; do
  echo "=== Validating $viz ==="
  FAIL=0

  # 1. Syntax check
  node --check "$viz" || FAIL=1

  # 2. AMD wrapper start
  head -1 "$viz" | grep -q 'define(\[' || { echo "FAIL: missing AMD define"; FAIL=1; }

  # 3. AMD wrapper end
  tail -1 "$viz" | grep -q '});' || { echo "FAIL: missing AMD close"; FAIL=1; }

  # 4. ES5 compliance (no const, let, arrow functions)
  ES6=$(grep -cE '\bconst \b|\blet \b| => ' "$viz" || true)
  [ "$ES6" -gt 0 ] && { echo "FAIL: ES6 syntax found ($ES6 occurrences)"; FAIL=1; }

  # 5. Theme detection present
  grep -q 'detectTheme\|getCurrentTheme' "$viz" || { echo "FAIL: no theme detection"; FAIL=1; }

  # 6. Null guard present
  grep -q '!= null\|safeStr' "$viz" || { echo "FAIL: no null guards"; FAIL=1; }

  [ "$FAIL" -eq 0 ] && echo "OK" || echo "BLOCKED — fix before packaging"
done
```

## Packaging

**ALWAYS use absolute paths for tar packaging.** Build steps may change
cwd — never assume cwd after build. ALWAYS verify after packaging.

```bash
APP_DIR="/absolute/path/to/{{PACK_ID}}"
PARENT_DIR="$(dirname "$APP_DIR")"
cd "$PARENT_DIR"

```bash
find "{{PACK_ID}}" -name '._*' -delete
find "{{PACK_ID}}" -name '.DS_Store' -delete
rm -f "{{PACK_ID}}.tar.gz"

COPYFILE_DISABLE=1 tar czf "{{PACK_ID}}.tar.gz" \
  --exclude='._*' \
  --exclude='.DS_Store' \
  --exclude='.git*' \
  --exclude='node_modules' \
  --exclude='_build' \
  --exclude='*.tar.gz' \
  --exclude='src' \
  --exclude='*/shared' \
  --exclude='build_flat.js' \
  "{{PACK_ID}}"

# MANDATORY verification — catches empty archives and nested tarballs
echo "--- Verify archive ---"
tar tzf "{{PACK_ID}}.tar.gz" | head -1
# Must be: {{PACK_ID}}/
tar tzf "{{PACK_ID}}.tar.gz" | grep '\.tar\.gz' && echo "ERROR: nested archive!" && exit 1
SIZE=$(wc -c < "{{PACK_ID}}.tar.gz")
[ "$SIZE" -lt 1000 ] && echo "ERROR: archive too small ($SIZE bytes)" && exit 1
echo "OK — $SIZE bytes"
```

## Completion output — MANDATORY

When the build and packaging is complete, ALWAYS print:

```
✅ Viz pack ready for install

  File: {{PACK_ID}}.tar.gz
  Path: /full/absolute/path/to/{{PACK_ID}}.tar.gz
  Size: XX KB
  Vizs: kpi_tile, ring_gauge, area_chart, data_table, content_donut

Install: Upload via Splunk Web → Manage Apps → Install from File
Restart: Required for static images to be served
```

This tells the user exactly where the file is and what to do with it.
Do NOT skip this output. Do NOT abbreviate the path.

## Bundled images

Brand logos, hero images, icons, and other static assets go in
`appserver/static/images/` — NOT in the root `static/` directory.
Splunk serves `appserver/static/` at `/static/app/{pack_id}/`.

```
appserver/static/images/
  logo.svg                    (brand logo — SVG preferred for crisp scaling)
  logo_dark.svg               (dark-background variant if needed)
  hero.jpg                    (hero/background image if applicable)
```

App icons are the only files that belong in root `static/`:

```
static/
  appIcon.png                 (36x36 Splunk app icon)
  appIcon_2x.png              (72x72 HiDPI)
  appIconAlt.png              (36x36 alternate)
  appIconAlt_2x.png           (72x72 alternate HiDPI)
```

## App icon and viz preview images — MUST generate

**App icon (`static/appIcon.png`):** MUST be generated for every pack.
Without it, the app shows a generic placeholder in Splunk's app manager.
Generate a simple brand-colored SVG and convert to PNG:

```
Size: 36x36 (1x) and 72x72 (2x)
Content: brand accent color background + white initial/symbol
Format: PNG with transparency
```

Use a simple Canvas script or SVG→PNG to generate. The icon should be
recognizable at 36px — a letter, symbol, or simple glyph. Not a
detailed logo.

**Per-viz preview (`appserver/static/visualizations/{viz}/preview.png`):**
MUST be generated for every viz. This is the thumbnail shown in
Splunk's visualization picker when the user selects a custom viz type.
Without it, the viz shows a generic bar chart placeholder.

```
Size: 200x100 (recommended), minimum 120x60
Content: simplified representation of what the viz draws
Format: MUST be actual PNG binary — NOT an SVG renamed to .png
```

**CRITICAL: The file MUST be a real PNG.** Splunk checks the binary
format. An SVG file renamed to `preview.png` renders as a black box
in the visualization picker. You MUST convert SVG to PNG.

**How to generate preview.png:**

**Option A (Python — always works):**
```python
# pip install cairosvg (or Pillow for simple shapes)
import cairosvg
svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">...</svg>'
cairosvg.svg2png(bytestring=svg.encode('utf-8'), write_to='preview.png')
```

**Option B (ImageMagick CLI):**
```bash
convert preview.svg -resize 200x100 preview.png
# or with rsvg-convert:
rsvg-convert preview.svg -w 200 -h 100 -o preview.png
```

**Option C (Pillow for simple shapes — no SVG needed):**
```python
from PIL import Image, ImageDraw
img = Image.new('RGBA', (200, 100), (20, 20, 30, 255))
draw = ImageDraw.Draw(img)
# Draw simplified viz shape
draw.rounded_rectangle([10, 10, 190, 90], radius=4, fill=(255, 128, 0))
img.save('preview.png')
```

If NONE of these tools are available, generate a 1x1 transparent PNG
as absolute minimum (better than SVG-as-PNG black box):
```python
import base64, os
# 1x1 transparent PNG
b = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
open('preview.png', 'wb').write(b)
```

**Simplified approach (works without browser):** Create a small HTML
file that loads the viz with sample data at 200x100, open in browser,
screenshot. Or generate an SVG representation:

| Viz type | Preview content |
|---|---|
| KPI tile | Large number "42.7" with small label |
| Gauge | Arc with needle at 70% |
| Heatmap | 4x6 grid of colored cells |
| Table | 3 rows with column headers |
| Bar chart | 4 horizontal bars of different lengths |
| Feed/ticker | 3 stacked entry rows |

The preview doesn't need to be pixel-perfect — it needs to be
recognizable enough that the user can identify the viz type in the
picker.

**Do NOT generate solid-color placeholder PNGs.** A black or grey box
is worse than no preview — the user sees what looks like a broken image.

If you cannot render the actual viz, generate a SIMPLE SVG that
represents the viz type and convert to PNG. A recognizable silhouette
(bar shapes, arc, grid dots) is better than a solid rectangle.

**Minimal SVG approach (always works, no browser needed):**
```python
# Generate a simple SVG preview for a gauge viz
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
  <rect width="200" height="100" fill="#1a1a2e"/>
  <path d="M40,80 A60,60 0 0,1 160,80" fill="none" stroke="#E50914" stroke-width="8" stroke-linecap="round"/>
  <text x="100" y="70" text-anchor="middle" fill="#fff" font-size="20" font-family="sans-serif">73%</text>
</svg>'''
# Convert: cairosvg.svg2png(bytestring=svg.encode(), write_to='preview.png')
# Or save as SVG and use: convert preview.svg preview.png (ImageMagick)
```

Reference images in dashboard JSON:
```json
"viz_logo": {
    "type": "splunk.image",
    "options": {
        "src": "/static/app/{{PACK_ID}}/images/logo.svg",
        "preserveAspectRatio": true
    }
}
```

**NEVER use external URLs** for images — they require domain allow-list
configuration and fail in PDF export. Always bundle in
`appserver/static/images/`.

**Splunk restart required** after installing the app for new static
files to be served.

## Canvas size — ALWAYS 1920 × 1080 minimum

**THIS RULE IS REPEATEDLY IGNORED.** Agents keep generating 1440×900
or 1440×1100 dashboards. CHECK THE WIDTH BEFORE COMMITTING.

```
WRONG: "width": 1440    ← looks cramped on every modern monitor
WRONG: "width": 1280    ← wastes 30% of screen real estate
WRONG: "width": 1600    ← awkward on both 1080p and 1440p

RIGHT: "width": 1920    ← fits 100% of target screens
```

**CRITICAL: Layout schema requires tabs+layoutDefinitions wrapper.**
Even for single-page dashboards with no tabs, Splunk's schema validator
requires the `tabs` + `layoutDefinitions` wrapper. The flat format
(`"layout": { "type": "absolute", ... }`) is rejected. Set
`"showTabBar": false` to hide the tab bar on single-page dashboards.

```json
"layout": {
    "globalInputs": [],
    "tabs": {
        "items": [
            { "layoutId": "layout_main", "label": "Overview" }
        ],
        "options": { "barPosition": "top", "showTabBar": false }
    },
    "layoutDefinitions": {
        "layout_main": {
            "type": "absolute",
            "options": { "width": 1920, "height": 1080 },
            "structure": [...]
        }
    }
}
```

**Canvas background:** `layout.options` only accepts `width` and `height`.
For canvas background color, add a full-canvas `splunk.rectangle` as the
FIRST item in `structure`:
```json
{
    "item": "viz_canvas_bg",
    "type": "block",
    "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 }
}
```
with viz:
```json
"viz_canvas_bg": {
    "type": "splunk.rectangle",
    "options": {
        "fillColor": "{{CANVAS_BG}}",
        "strokeColor": "transparent"
    }
}
```

Height can exceed 1080 for scrollable dashboards, but width is
ALWAYS 1920. This matches `ds-create` hard default #0.

`{{CANVAS_BG}}` comes from the design brief's dark or light palette `bg`
token. Use it as the `fillColor` on the `viz_canvas_bg` rectangle — do
not hardcode a color, and do NOT set it via `layout.options.backgroundColor`
(that property does not exist in the schema).

## Markdown panels in bundled dashboards

`splunk.markdown` has strict schema validation:

**fontFamily** — ONLY these 7 values:
`Splunk Platform Sans`, `Splunk Data Sans`, `Splunk Platform Mono`,
`Arial`, `Helvetica`, `Times New Roman`, `Comic Sans MS`

Custom fonts (Inter, Roboto, Georgia, system-ui) → schema error.

**System font → Splunk equivalent mapping:**

| You might write | Splunk equivalent |
|---|---|
| `monospace`, `Courier`, `Courier New` | `Splunk Platform Mono` |
| `sans-serif`, `system-ui`, `Segoe UI` | `Splunk Platform Sans` |
| `Inter`, `Roboto`, `DM Sans` | `Splunk Platform Sans` |
| `serif`, `Georgia` | `Times New Roman` |

NEVER use generic CSS font names (`monospace`, `sans-serif`) in
markdown panel options. Splunk rejects them. Use the Splunk equivalent.

**fontSize** — ONLY these enum values:
`extraSmall`, `small`, `default`, `large`, `extraLarge`

Numeric values ("14", "11") → schema error.

## Custom viz type format in dashboard JSON

When a dashboard references a custom viz, the `type` field MUST use
the format `{app_id}.{viz_name}`:

```json
"viz_speed_gauge": {
    "type": "redbull_viz.ring_gauge",
    "dataSources": { "primary": "ds_speed" },
    "options": {
        "backgroundColor": "transparent",
        "redbull_viz.ring_gauge.field": "value",
        "redbull_viz.ring_gauge.maxValue": "370"
    }
}
```

| Part | Value | Source |
|---|---|---|
| `type` | `{app_id}.{viz_name}` | app.conf `[id] name` + visualizations.conf stanza |
| `options` prefix | `{app_id}.{viz_name}.{setting}` | Namespace from formatter.html |
| `backgroundColor` | `"transparent"` | ALWAYS — lets Canvas control the background |

**Common mistakes:**
- `"type": "custom.ring_gauge"` — wrong, `custom` is not the app id
- `"type": "ring_gauge"` — wrong, missing app id prefix
- Missing `"backgroundColor": "transparent"` — Splunk's panel bg covers the Canvas

## backgroundColor on custom viz panels

Every custom viz panel MUST set `"backgroundColor": "transparent"` at
the viz level. Without this, Splunk renders a default panel background
ON TOP of the Canvas — the viz draws behind it, invisible.

```json
"viz_kpi": {
    "type": "mypack.kpi_tile",
    "options": {
        "backgroundColor": "transparent",
        "mypack.kpi_tile.field": "value"
    }
}
```

This is the **viz-level** `backgroundColor` property, NOT a namespaced
option. It sits alongside the namespaced settings in `options`.

If the user wants a custom background (gradient, panel color), add it
as a configurable setting in the viz source code and renderer — NOT
via the Dashboard Studio `backgroundColor` property.

## Z-order in absolute layout

`structure` array order = z-order. Earlier items render BEHIND later
items.

```json
"structure": [
    {"item": "viz_hero_image"},      // z=0 (furthest back)
    {"item": "viz_dimming_overlay"},  // z=1
    {"item": "viz_panel_bg"},        // z=2
    {"item": "viz_kpi_tile"},        // z=3 (furthest front)
]
```

**Common mistake:** putting a `splunk.rectangle` shadow card AFTER the
viz it's supposed to be behind. The rectangle renders ON TOP and
covers the viz.

**Rule:** background layers first, then panels/cards, then data vizs,
then overlays (tooltips, badges).

## Cache busting — increment `build` on every update

When you update a viz pack and reinstall, Splunk caches the old
`visualization.js`. Users see old rendering despite the new code.

**Fix:** increment `build` in `app.conf` on every release:

```ini
[install]
is_configured = 0
build = 2       # was 1 → increment on EVERY code change
```

The browser uses `build` as a cache key. Same build number = cached.
Different build number = fresh load.

**Rule:** before packaging, ALWAYS check app.conf and increment `build`.

## Navigation bar (default.xml)

Every Splunk app MUST include a navigation bar so users can find the
bundled dashboards and access standard Splunk views. Without it, the
app has no clickable entry point.

Create `default/data/ui/nav/default.xml`:

```xml
<nav search_view="search" color="{{ACCENT_HEX}}">
  <view name="search" default="true" />
  <view name="{{DASHBOARD_VIEW_NAME}}" />
  <view name="reports" />
  <view name="alerts" />
  <view name="dashboards" />
</nav>
```

| Placeholder | Value | Example |
|---|---|---|
| `{{ACCENT_HEX}}` | Brand accent color (6-char hex) | `#06C167` |
| `{{DASHBOARD_VIEW_NAME}}` | Filename of bundled dashboard (without .xml) | `uber_operations` |

For multiple dashboards, add one `<view>` per dashboard:
```xml
<nav search_view="search" color="#D5001C">
  <view name="search" default="true" />
  <collection label="Dashboards">
    <view name="porsche_telemetry" />
    <view name="porsche_strategy" />
  </collection>
  <view name="reports" />
  <view name="dashboards" />
</nav>
```

**Rule:** the `name` attribute must match the XML filename exactly
(without `.xml` extension) in `default/data/ui/views/`.

## Complete dashboard JSON example

Agents repeatedly get the layout format wrong. Here is a COMPLETE,
COPY-PASTE-READY example of a valid Dashboard Studio v2 JSON structure.
Use this as the starting template for EVERY bundled dashboard:

```json
{
    "dataSources": {
        "ds_example": {
            "type": "ds.search",
            "options": {
                "query": "| inputlookup {{PACK_ID}}_demo_kpis.csv",
                "queryParameters": { "earliest": "-24h", "latest": "now" }
            },
            "name": "Example Data"
        }
    },
    "visualizations": {
        "viz_canvas_bg": {
            "type": "splunk.rectangle",
            "options": {
                "fillColor": "#0B0C0E",
                "strokeColor": "transparent"
            }
        },
        "viz_kpi": {
            "type": "{{PACK_ID}}.kpi_tile",
            "dataSources": { "primary": "ds_example" },
            "options": {
                "backgroundColor": "transparent",
                "{{PACK_ID}}.kpi_tile.field": "value",
                "{{PACK_ID}}.kpi_tile.theme": "dark"
            }
        }
    },
    "inputs": {},
    "layout": {
        "globalInputs": [],
        "tabs": {
            "items": [
                { "layoutId": "layout_main", "label": "Overview" }
            ],
            "options": { "barPosition": "top", "showTabBar": false }
        },
        "layoutDefinitions": {
            "layout_main": {
                "type": "absolute",
                "options": { "width": 1920, "height": 1080 },
                "structure": [
                    { "item": "viz_canvas_bg", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
                    { "item": "viz_kpi", "type": "block", "position": { "x": 20, "y": 20, "w": 400, "h": 120 } }
                ]
            }
        }
    },
    "title": "{{PACK_LABEL}}",
    "description": "{{DESCRIPTION}}"
}
```

**WRONG patterns that agents generate (all rejected by schema):**
```
WRONG: "layout": { "type": "absolute", "options": {...}, "structure": [...] }
       → flat format, no tabs wrapper

WRONG: "layout": { "type": "absolute", "layoutDefinitions": { "tabLayout": { "tabs": [...] } } }
       → "type" at top level + nested tabLayout

WRONG: "layout": { ..., "options": { "width": 1920, "display": "auto-scale" } }
       → "display" is not a valid layout option

RIGHT: "layout": { "globalInputs": [], "tabs": { "items": [...] }, "layoutDefinitions": { "layout_main": { "type": "absolute", ... } } }
       → no "type" at top level, named layouts in layoutDefinitions

WRONG: defining a viz in "visualizations" but not placing it in any structure array
       → "Visualization X is not present in any Layout" error
```

**Every viz in `visualizations` MUST appear in at least one `structure`
array.** If a viz is not placed in the layout, DELETE it from
`visualizations`. Orphaned vizs cause schema validation errors.

**Global elements in tabbed dashboards:** There is NO shared structure
area across tabs. Canvas background, banner, accent line, and title
markdown MUST be repeated in EACH tab's `structure` array. If you
define `viz_canvas_bg` once but only place it in tab 1's structure,
tab 2 will have no background.

## Ad-hoc search compatibility

Custom vizs are used in TWO contexts: Dashboard Studio and ad-hoc
search (Classic UI). The ad-hoc search environment differs:

| Property | Dashboard Studio | Ad-hoc search |
|---|---|---|
| Theme | From dashboard JSON config | Page theme (usually light) |
| Panel size | Fixed by `position` in structure | Resizable by user |
| Formatter | Settings sidebar in editor | Format dropdown in viz tab |
| Background | Controlled by `splunk.rectangle` | White panel bg (light theme) |

**Formatter must work in both:** Every `<splunk-control-group>` must
have sensible defaults that render correctly on BOTH dark and light
backgrounds. The viz must auto-detect theme via `getCurrentTheme()`
(see B18) so it doesn't render dark-on-dark or light-on-light.

**Test in ad-hoc search BEFORE shipping:** Run a demo query, switch to
Visualization tab, select the custom viz, verify it renders correctly
on the white background. If text is invisible, the theme detection is
broken.

## Drilldown from custom vizs

Custom Canvas vizs can fire drilldown events that navigate to other
dashboards or set tokens.

```javascript
// In initialize():
this.canvas.addEventListener('click', function(e) {
    self._onClick(e);
});

// Click handler:
_onClick: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var hit = this._hitTest(mx, my);
    if (hit !== null) {
        var region = this._hitRegions[hit];
        var payload = {
            action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
            data: region.drilldownData
        };
        this.drilldownToPayload(payload);
    }
},
```

The `drilldownData` object should contain the field name and value:
```javascript
{ drilldownData: { 'click.name': 'host', 'click.value': 'web01' } }
```

Dashboard JSON wires the event handler:
```json
"eventHandlers": [
    {
        "type": "drilldown.setToken",
        "options": {
            "tokens": [
                { "token": "selected_host", "value": "$click.value$" }
            ]
        }
    }
]
```

**Note:** `drilldownToPayload` is a method on `SplunkVisualizationBase`.
Wrap in try/catch (vp-ref-gotchas C5) since the parent frame may
block the navigation.

## XML dashboard generation

Dashboard Studio v2 stores dashboards as JSON inside XML CDATA. When
the dashboard JSON changes, the XML MUST be regenerated:

```xml
<dashboard version="2" theme="dark">
    <label>Dashboard Title</label>
    <description>Description</description>
    <definition><![CDATA[{...compact JSON...}]]></definition>
</dashboard>
```

**Compact the JSON** (no whitespace) before embedding — XML CDATA
doesn't require escaping but large whitespace wastes file size.

**Rule: every time you modify dashboard.json, regenerate the XML.**
Stale XML = users install the app and see an old dashboard.

## Required cross-plugin skills

Before writing ANY SPL in savedsearches.conf or dashboard JSON data
sources, load **`spl-gotchas`** from the `splunk-spl` plugin. Key
traps that affect viz pack SPL:

- **#22**: `tostring()` format arg only accepts `hex`/`commas`/`duration`
- **#23**: `strftime` on `_time` kills chart x-axis — only use in tables
- **#2**: `case()` without default returns NULL silently
- **#5**: `sort` default limit is 10,000 — use `sort 0` for unlimited

For full command syntax, read `splunk-spl/reference/<command>.md`.

When writing dashboard JSON (bundled in `default/data/ui/views/`),
ALL rules from **`ds-create`** in the `splunk-dashboard-studio` plugin
apply. The most critical hard defaults:

- **#0**: Canvas minimum **1920 × 1080 px** — no 1440, no 1280
- **#6**: `fontFamily` on markdown — only 7 allowed values
- **#7**: `fontSize` on markdown — only 5 enum values
- **#8**: Markdown panels sized to avoid scrollbars

Also load **`ds-ref-syntax`** from `splunk-dashboard-studio` for the
full Dashboard Studio JSON schema.

**The bundled dashboard IS a Dashboard Studio dashboard.** Every rule
that applies to ds-create output applies equally to viz pack dashboards.
There is no special exemption for bundled dashboards.

## Quality checks after scaffolding

- [ ] All 5 stanzas in app.conf (`[install]`, `[id]`, `[package]`, `[ui]`, `[launcher]`)
- [ ] `is_configured = 0` (not `true`)
- [ ] `sc_admin` in default.meta global `[]` stanza
- [ ] `[lookups]` stanza with `export = system` in default.meta
- [ ] No `[triggers]` stanza anywhere
- [ ] theme.js exports ES5 module (var, function, no const/let/arrow)
- [ ] webpack targets `['web', 'es5']` with all environment flags
- [ ] All viz dirs contain: formatter.html, visualization.css, preview.png
- [ ] `static/appIcon.png` (36x36) and `static/appIcon_2x.png` (72x72) generated
- [ ] savedsearches.conf.spec documents every custom setting
- [ ] Bundle starts with `define([` after build
- [ ] Tarball excludes: node_modules, _build, src, .DS_Store, ._*, .git*, *.tar.gz
- [ ] Demo data in `lookups/` as CSV (not `makeresults` with `random()`)
- [ ] `transforms.conf` defines each lookup with `filename = <csv>`
- [ ] Dashboard data sources use `| inputlookup` for demo data
- [ ] SPL in savedsearches.conf checked against `spl-gotchas` traps
- [ ] No hardcoded accent color defaults in formatter.html — use `{{ACCENT}}` or the pack's `theme.accent` token, not a literal hex like `#1a91a8` or `#0088CC`
- [ ] Every viz has `getInitialDataParams` as a METHOD (not a property on extend)
- [ ] No jQuery (`this.$el`, `$.fn`) in any viz source
- [ ] `setupCanvas()` uses `this.el` — no wrapper div, no getBoundingClientRect, no width/height on el (B17)
- [ ] No `new Date(string)` — use regex for ISO timestamp parsing (B19)
- [ ] Theme formatter default is `'auto'` with `detectTheme()` fallback (B20)
- [ ] All row field reads null-guarded before `String()` (B21)
- [ ] Post-build validation passed (syntax, AMD, ES5, theme, null guards)
- [ ] `preview.png` is real PNG binary, not renamed SVG (R8)
- [ ] `build` in app.conf incremented before packaging
- [ ] `default/data/ui/nav/default.xml` exists with dashboard view references
- [ ] Dashboard JSON uses `tabs` + `layoutDefinitions` wrapper (no flat layout)
- [ ] Every viz in `visualizations` is placed in at least one `structure` array (no orphans)
- [ ] No `"display"` or `"backgroundColor"` in `layout.options` (only `width` + `height`)
