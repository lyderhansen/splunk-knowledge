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
  README.md
  default/
    app.conf
    visualizations.conf
    savedsearches.conf
  metadata/
    default.meta
  README/
    savedsearches.conf.spec
  static/
    appIcon.png                 (36x36)
    appIcon_2x.png              (72x72)
    appIconAlt.png              (36x36)
    appIconAlt_2x.png           (72x72)
  shared/
    theme.js
  _build/
    webpack.config.js
    package.json
  appserver/static/visualizations/
    {viz_1}/
      src/visualization_source.js
      formatter.html
      visualization.css
      preview.png
      harness.json
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
    ui: '{{FONT_UI}}',
    mono: '{{FONT_MONO}}'
};

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

## savedsearches.conf template

One example search per viz using makeresults for zero-dependency rendering:

```ini
[{{PACK_LABEL}} - {{Viz Label}}]
search = | makeresults count=24 | streamstats count as i | eval value=round(100+50*sin(i/3.0)+random()%20,0) | stats latest(value) as value
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

## Bundled images

Brand logos, icons, and other images go in `static/` at the app root.
Splunk serves these at `/static/app/{pack_id}/filename`.

```
static/
  logo.svg                    (brand logo — SVG preferred for crisp scaling)
  logo_dark.svg               (dark-background variant if needed)
  appIcon.png                 (36x36 Splunk app icon)
  appIcon_2x.png              (72x72 HiDPI)
  appIconAlt.png              (36x36 alternate)
  appIconAlt_2x.png           (72x72 alternate HiDPI)
```

Reference in dashboard JSON:
```json
"viz_logo": {
    "type": "splunk.image",
    "options": {
        "src": "/static/app/{{PACK_ID}}/logo.svg",
        "preserveAspectRatio": true
    }
}
```

**NEVER use external URLs** for images — they require domain allow-list
configuration and fail in PDF export. Always bundle images in `static/`.

**Splunk restart required** after installing the app for new static
files to be served.

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

## Quality checks after scaffolding

- [ ] All 5 stanzas in app.conf (`[install]`, `[id]`, `[package]`, `[ui]`, `[launcher]`)
- [ ] `is_configured = 0` (not `true`)
- [ ] `sc_admin` in default.meta global `[]` stanza
- [ ] No `[triggers]` stanza anywhere
- [ ] theme.js exports ES5 module (var, function, no const/let/arrow)
- [ ] webpack targets `['web', 'es5']` with all environment flags
- [ ] All viz dirs contain: formatter.html, visualization.css, harness.json
- [ ] savedsearches.conf.spec documents every custom setting
- [ ] Bundle starts with `define([` after build
- [ ] Tarball excludes: node_modules, _build, src, .DS_Store, ._*, .git*, *.tar.gz
