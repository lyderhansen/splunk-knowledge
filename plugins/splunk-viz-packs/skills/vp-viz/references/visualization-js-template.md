# visualization.js Template (Extension API)

This is the Extension API Canvas 2D viz wrapper. Copy the template below, fill in
`{{PLACEHOLDER}}` values and the Canvas rendering section, then run `yarn build`.

The Canvas 2D drawing code inside `render()` is **identical to Classic** — only the module
wrapper changes. All `ctx.fillRect`, `ctx.arc`, `ctx.fillText` calls transfer unchanged.

**Key differences from Classic:**

- ESM import (`import { VisualizationAPI } from '...'`), not AMD `define([...])`
- Four listener callbacks replace `updateView` / `formatData` / `reflow`
- Columnar data format: `data.columns[fieldIdx][rowIdx]`, not `data.rows[rowIdx][colIdx]`
- Option names are bare (`state.options.barColor`), not namespaced (`config[ns + '.barColor']`)
- `document.getElementById('root')` replaces `this.el`
- `state.theme` from listener replaces `SplunkVisualizationUtils.getCurrentTheme()`

---

## visualization.js Template

```javascript
import { VisualizationAPI } from '@splunk/dashboard-studio-extension';
import './visualization.css'; // Optional for Canvas vizs — add only if you need CSS

// === Theme Tokens ===
// Fill these from theme-template.md. All tokens must be hex strings.
// VISUAL_LANG drives check_design.js D01: set fillTechnique to 'gradient' | 'flat' | 'textured'.
var VISUAL_LANG = {
    fillTechnique:     '{{FILL_TECHNIQUE}}',
    backgroundType:    '{{BG_TYPE}}',
    backgroundPattern: '{{BG_PATTERN}}'
};

var DARK = {
    name: 'dark',
    bg:          '{{DARK_BG}}',
    panel:       '{{DARK_PANEL}}',
    panelHi:     '{{DARK_PANEL_HI}}',
    edge:        '{{DARK_EDGE}}',
    edgeStrong:  '{{DARK_EDGE_STRONG}}',
    grid:        '{{DARK_GRID}}',
    text:        '{{DARK_TEXT}}',
    textDim:     '{{DARK_TEXT_DIM}}',
    textFaint:   '{{DARK_TEXT_FAINT}}',
    accent:      '{{DARK_ACCENT}}',
    series:      ['{{DARK_S1}}', '{{DARK_S2}}', '{{DARK_S3}}', '{{DARK_S4}}', '{{DARK_S5}}'],
    success:     '{{DARK_SUCCESS}}',
    warn:        '{{DARK_WARN}}',
    danger:      '{{DARK_DANGER}}'
};

// Light theme is NOT an inversion of dark — design independently.
// See theme-template.md for established LIGHT defaults.
var LIGHT = {
    name: 'light',
    bg:          '#F0F2F5',
    panel:       '#FFFFFF',
    panelHi:     '#F7F8FA',
    edge:        'rgba(0,0,0,0.10)',
    edgeStrong:  'rgba(0,0,0,0.20)',
    grid:        'rgba(0,0,0,0.06)',
    text:        '#0B0E1A',
    textDim:     '#3D4050',
    textFaint:   '#6B7080',
    accent:      '{{LIGHT_ACCENT}}',
    series:      ['{{LIGHT_S1}}', '{{LIGHT_S2}}', '{{LIGHT_S3}}', '{{LIGHT_S4}}', '{{LIGHT_S5}}'],
    success:     '#00875A',
    warn:        '#A66200',
    danger:      '#C7001E'
};

// === Utility Functions ===
// These are plain JS — identical to Classic; no framework dependency.
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br-ar)*t), gg = Math.round(ag + (bg-ag)*t), bl = Math.round(ab + (bb-ab)*t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

function safeStr(v) { return v == null ? '' : String(v); }
function safeNum(v, fb) { var n = parseFloat(v); return isNaN(n) ? (fb || 0) : n; }

function hexFromSplunk(val, fallback) {
    if (typeof val === 'number') {
        return '#' + ('000000' + (val >>> 0).toString(16)).slice(-6);
    }
    return (typeof val === 'string' && val.charAt(0) === '#') ? val : (fallback || '#ffffff');
}

// === Canvas Setup ===
var root = document.getElementById('root');
var canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
root.appendChild(canvas);
var ctx = canvas.getContext('2d');

// === State ===
var state = {
    data:    null,
    loading: false,
    options: {},
    theme:   'dark',
    width:   500,
    height:  300
};

// === Render ===
function render() {
    // Gate 1: data still arriving
    if (state.loading) return;

    var data = state.data;

    // Gate 2: no-data fallback — render brand typography, not a blank panel
    if (!data || !data.columns || data.columns.length === 0 || data.columns[0].length === 0) {
        canvas.width  = state.width;
        canvas.height = state.height;
        var tb = state.theme === 'dark' ? DARK : LIGHT;
        ctx.fillStyle = tb.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = tb.textFaint;
        ctx.font = '14px "Splunk Platform Sans", sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText('No data', 16, 16);
        return;
    }

    canvas.width  = state.width;
    canvas.height = state.height;

    // Theme selection
    var t = state.theme === 'dark' ? DARK : LIGHT;
    var opts = state.options;

    // themeMode override (default: 'auto')
    var themeMode = opts.themeMode || 'auto';
    if (themeMode !== 'auto') {
        t = themeMode === 'dark' ? DARK : LIGHT;
    }

    // Columnar data access
    var fields   = data.fields;          // [{name: "host"}, {name: "count"}, ...]
    var columns  = data.columns;         // [["host-1","host-2"], [100, 250], ...]
    var rowCount = columns[0].length;

    // Read options — bare names, no namespace prefix.
    // All values arrive as strings — use parseFloat/parseInt for numbers.
    // Example: var barColor = hexFromSplunk(opts.barColor, t.accent);
    //          var showGlow = opts.showGlow !== 'false';
    //          var lineWidth = safeNum(opts.lineWidth, 2);

    // ===== CANVAS RENDER CODE =====
    // {{CANVAS_RENDER_CODE}}
    // Replace the line above with brand-specific Canvas 2D drawing.
    // All ctx.* calls are identical to Classic — nothing changes here.
    // ===== END CANVAS RENDER CODE =====
}

// === Listeners ===
// invokeImmediately fires the callback once with current state on registration.
VisualizationAPI.addDataSourcesListener(function(ds) {
    state.loading = ds.loading;
    state.data = (ds.dataSources && ds.dataSources.primary)
        ? ds.dataSources.primary.data
        : null;
    render();
}, { invokeImmediately: true });

VisualizationAPI.addOptionsListener(function(o) {
    state.options = o.options;
    render();
});

VisualizationAPI.addThemeListener(function(t) {
    state.theme = t.theme; // "dark" | "light"
    render();
});

VisualizationAPI.addDimensionsListener(function(d) {
    state.width  = d.width;
    state.height = d.height;
    render();
});

// === Drilldown (optional) ===
// Enable in config.json: "showDrilldown": true, "hasEventHandlers": true
// Approach 1 — element-based (framework manages click):
//   VisualizationAPI.addDrilldownListener(canvas, 'custom.click', function() {
//       return { action: 'custom.click', payload: { name: 'selectedRow', value: hitValue } };
//   });
//
// Approach 2 — programmatic (use inside your own click handler):
//   canvas.addEventListener('click', function(evt) {
//       var hitValue = /* your hit-test logic */ '';
//       VisualizationAPI.triggerDrilldown({
//           action: 'custom.click',
//           payload: { name: 'selectedRow', value: hitValue },
//           originalEvent: evt
//       });
//   });
//
// Token setting (requires "canSetTokens": ["dynamic"] in config.json):
//   VisualizationAPI.triggerDrilldown({
//       action: 'setToken',
//       payload: { name: 'selected_host', value: hitValue }
//   });
```

---

## Classic vs Extension Lifecycle

| Classic method | Extension equivalent |
|---|---|
| `formatData(data, config)` | No equivalent — raw data arrives in `addDataSourcesListener` callback |
| `updateView(data, config)` | `render()` called from all four listeners |
| `reflow()` | `addDimensionsListener` callback — sets `state.width`/`state.height` |
| `getInitialDataParams()` | `config.json` `dataContract.requiredDataSources` |
| `this.drilldown({field,value})` | `addDrilldownListener` or `triggerDrilldown` |
| `SplunkVisualizationUtils.getCurrentTheme()` | `addThemeListener` — stores into `state.theme` |
| `config[ns + '.key']` | `state.options.key` — no namespace, no prefix |
| `this.el` | `document.getElementById('root')` |

---

## package.json Template

Node.js 22.0.0+ required. `build.mjs` and `package.mjs` are auto-generated by the CLI
scaffold — do not hand-write them.

```json
{
    "name": "{{APP_ID}}",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "build": "node build.mjs",
        "dev":   "node build.mjs --watch",
        "package": "node package.mjs"
    },
    "dependencies": {
        "@splunk/dashboard-studio-extension": "latest"
    },
    "devDependencies": {
        "esbuild": "latest"
    }
}
```

---

## app.conf Template

Extension API app.conf is simpler than Classic — only `[package]`, `[launcher]`, and `[ui]`
stanzas needed. `visualizations.conf` and `default.meta` are auto-generated by `yarn package`.

```ini
[package]
id = {{APP_ID}}
version = 1.0.0

[launcher]
version = 1.0.0
author = {{AUTHOR}}
description = {{APP_DESCRIPTION}}

[ui]
label = {{APP_LABEL}}
is_visible = true
```

**Package ID constraints:** Lowercase letters, numbers, hyphens, underscores only. 1-100 chars.

---

## WRONG / RIGHT Patterns

| WRONG | RIGHT |
|---|---|
| `define(['splunkjs/mvc'], function(mvc) {...})` (AMD) | `import { VisualizationAPI } from '@splunk/dashboard-studio-extension'` (ESM) |
| `data.rows[rowIdx][colIdx]` (Classic row-major) | `data.columns[fieldIdx][rowIdx]` (Extension columnar) |
| `state.options['myapp.myviz.barColor']` (namespaced) | `state.options.barColor` (bare name, no namespace) |
| `this.el.appendChild(canvas)` or `SplunkVisualizationBase` | `document.getElementById('root').appendChild(canvas)` |
| `var n = data.columns[1][0]` — using raw string as number | `var n = parseFloat(data.columns[1][0])` — always parse; all values arrive as strings |
| Calling `render()` without checking `state.loading` | `if (state.loading) return;` as the first line of `render()` |
