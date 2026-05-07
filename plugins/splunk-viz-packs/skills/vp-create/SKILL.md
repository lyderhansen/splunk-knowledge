---
name: vp-create
description: "Scaffolds and packages themed Splunk custom visualization apps (multi-viz packs). Creates the complete app directory structure, generates theme.js design tokens from a design brief, writes all Splunk conf files, runs the webpack multi-entry build, and produces the deployable tarball. MUST load vp-ref-gotchas before writing any source code."
---

# vp-create — scaffold and package a viz pack

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
filename = demo_kpis.csv

[{{PACK_ID}}_demo_timeseries]
filename = demo_timeseries.csv

[{{PACK_ID}}_demo_table]
filename = demo_table.csv
```

### CSV file conventions

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

## Build process

```bash
cd examples/{{PACK_ID}}/_build
npm install
npm run build
```

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

## Packaging

```bash
cd examples/
find {{PACK_ID}} -name '._*' -delete
find {{PACK_ID}} -name '.DS_Store' -delete
rm -f {{PACK_ID}}.tar.gz

COPYFILE_DISABLE=1 tar czf {{PACK_ID}}.tar.gz \
  --exclude='._*' \
  --exclude='.DS_Store' \
  --exclude='.git*' \
  --exclude='node_modules' \
  --exclude='_build' \
  --exclude='*.tar.gz' \
  --exclude='src' \
  {{PACK_ID}}
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

```json
"layout": {
    "type": "absolute",
    "options": { "width": 1920, "height": 1080, "backgroundColor": "{{CANVAS_BG}}" }
}
```

Height can exceed 1080 for scrollable dashboards, but width is
ALWAYS 1920. This matches `ds-create` hard default #0.

`{{CANVAS_BG}}` comes from the design brief's dark or light palette `bg`
token. Do not hardcode a color here — every pack has its own canvas background.

## Markdown panels in bundled dashboards

`splunk.markdown` has strict schema validation:

**fontFamily** — ONLY these 7 values:
`Splunk Platform Sans`, `Splunk Data Sans`, `Splunk Platform Mono`,
`Arial`, `Helvetica`, `Times New Roman`, `Comic Sans MS`

Custom fonts (Inter, Roboto, Georgia, system-ui) → schema error.

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
- [ ] All viz dirs contain: formatter.html, visualization.css
- [ ] savedsearches.conf.spec documents every custom setting
- [ ] Bundle starts with `define([` after build
- [ ] Tarball excludes: node_modules, _build, src, .DS_Store, ._*, .git*, *.tar.gz
- [ ] Demo data in `lookups/` as CSV (not `makeresults` with `random()`)
- [ ] `transforms.conf` defines each lookup with `filename = <csv>`
- [ ] Dashboard data sources use `| inputlookup` for demo data
- [ ] SPL in savedsearches.conf checked against `spl-gotchas` traps
- [ ] No hardcoded accent color defaults in formatter.html — use `{{ACCENT}}` or the pack's `theme.accent` token, not a literal hex like `#1a91a8` or `#0088CC`
