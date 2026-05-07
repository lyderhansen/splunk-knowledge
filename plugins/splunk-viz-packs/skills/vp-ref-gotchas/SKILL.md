---
name: vp-ref-gotchas
description: "Hard rules for Splunk custom visualization development — every rule learned the hard way from shipping icon_library, infographic_shapes, and 30+ viz apps. Organized by severity: FATAL (viz won't load), BROKEN (renders wrong), REJECTED (fails AppInspect), COSMETIC (works but looks bad). MUST be loaded before writing any visualization_source.js, formatter.html, webpack.config.js, or app.conf. Skipping these rules produces vizs that silently fail in Splunk."
---

# vp-ref-gotchas — hard rules for custom viz development

Every rule below was learned from real bugs, real AppInspect failures,
and real hours of debugging. They are organized by severity — what
happens if you violate the rule.

**MUST load this skill before writing ANY viz code.** No exceptions.

## FATAL — viz won't load at all

### F1. Webpack must target ES5

Splunk's AMD loader requires ES5. Webpack 5+ defaults to ES2015+.
If the bundle contains arrow functions, the viz silently fails to load.

```javascript
// webpack.config.js — MANDATORY for every viz
module.exports = {
    target: ['web', 'es5'],
    entry: './src/visualization_source.js',
    output: {
        filename: 'visualization.js',
        path: require('path').resolve(__dirname),
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
    externals: ['api/SplunkVisualizationBase']
};
```

**Verification after EVERY build:**
```bash
head -c 200 visualization.js
# MUST start with: define(["api/SplunkVisualizationBase"], function(
# MUST NOT contain: => or const or let
```

If you see `(` instead of `function(` in the AMD wrapper, the build is
broken.

### F2. Fonts must be base64 data URIs

Custom vizs render inside an `<iframe>` with `src="about:srcdoc"`.
The iframe origin is `null`. ALL external font requests are blocked
by CORS — including URLs to the same Splunk server.

**The ONLY working method:**

```css
@font-face {
    font-family: 'YourFont';
    src: url(data:font/woff2;base64,d09GMgABA...) format('woff2');
    font-weight: 100 700;
    font-display: swap;
}
```

Generate with: `base64 -i font.woff2 | tr -d '\n'`

**What does NOT work:**
- `url('/static/app/.../font.woff2')` — CORS block
- `url('./fonts/font.woff2')` — relative paths rewritten, still CORS
- JavaScript `FontFace` API with fetch — same CORS origin issue

### F3. Source must be pure ES5

No `const`, `let`, arrow functions, template literals, destructuring,
`for...of`, `async/await`, classes, or spread syntax anywhere in
`visualization_source.js`. Use `var`, `function`, string concatenation,
`for` loops.

```javascript
// WRONG
const color = config[`${ns}color`] || '#fff';
items.forEach(item => { ... });

// CORRECT
var color = config[ns + 'color'] || '#fff';
for (var i = 0; i < items.length; i++) { ... }
```

### F4. getInitialDataParams must use ROW_MAJOR_OUTPUT_MODE

`getInitialDataParams` MUST return `outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE`. 
Using the string `'json'` silently delivers data in a different structure — the viz receives
an object without `fields`/`rows`, every `fieldIndex()` returns `-1`, and every viz renders
its "No data" fallback with no error in the console.

```javascript
// WRONG — data arrives in wrong format, viz shows "No data"
getInitialDataParams: function() {
    return { outputMode: 'json', count: 10000 };
}

// CORRECT — data arrives as { fields: [{name:...}], rows: [[...]] }
getInitialDataParams: function() {
    return {
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 10000
    };
}
```

`SplunkVisualizationBase` is available as the AMD module parameter — use
the constant, not a string. Valid modes:
- `SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE` — `{fields, rows}` (use this)
- `SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE` — `{fields, columns}`
- `SplunkVisualizationBase.RAW_OUTPUT_MODE` — raw JSON

**NEVER use `'json'`, `'xml'`, or any arbitrary string.**

### F5. Only externalize what you import

```javascript
// If you only use SplunkVisualizationBase:
externals: ['api/SplunkVisualizationBase']

// Only add SplunkVisualizationUtils if you actually import it:
externals: ['api/SplunkVisualizationBase', 'api/SplunkVisualizationUtils']
```

Externalizing unused modules wastes an AMD slot and webpack emits
warnings.

### F6. Source MUST use require(), NEVER define()

Webpack's `libraryTarget: 'amd'` wraps the output in `define()`.
If the source ALSO uses `define()`, you get a double AMD wrapper
that breaks RequireJS — every viz shows `REQUIREJS_ERROR_MESSAGE
Script error`.

```javascript
// WRONG — double AMD wrapper, viz won't load
define([
    'api/SplunkVisualizationBase'
], function(SplunkVisualizationBase) {
    var theme = require('shared/theme');
    return SplunkVisualizationBase.extend({ ... });
});

// CORRECT — webpack adds the AMD wrapper
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({ ... });
```

### F7. MUST use extend({...}) object literal, NEVER prototypal constructors

`SplunkVisualizationBase.extend()` expects a plain object with method
properties. Passing a constructor function does NOT register the
prototype methods — the viz loads but shows no data (blank panel).

```javascript
// WRONG — extend(Constructor) doesn't copy prototype methods
function MyViz(el) { SplunkVisualizationBase.call(this, el); }
MyViz.prototype.initialize = function() { ... };
MyViz.prototype.updateView = function() { ... };
SplunkVisualizationBase.extend(MyViz);   // BROKEN
module.exports = MyViz;                  // exports wrong thing

// ALSO WRONG — fragile, sub-method scoping issues
module.exports = SplunkVisualizationBase.extend(MyViz.prototype);

// CORRECT — always use an object literal
module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        // canvas setup, tooltip, event listeners...
    },
    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },
    formatData: function(data) { ... },
    updateView: function(data, config) { ... },
    reflow: function() { ... },
    destroy: function() { ... }
});
```

### F8. Images must be bundled in the app, never external URLs

Dashboard hero images, logos, and brand assets MUST be downloaded
and placed in `appserver/static/images/`. External URLs fail on
Splunk instances with domain allowlists, air-gapped environments,
and Splunk Cloud — where outbound requests are blocked.

```
WRONG:  "src": "https://images.unsplash.com/photo-abc123?w=1920"
RIGHT:  "src": "/static/app/{pack_name}/images/hero.jpg"
```

Download the image during build, save to `appserver/static/images/`,
and reference via the Splunk static path. This also eliminates
load-time latency from external CDNs.

## BROKEN — renders but wrong

### B1. Canvas font rendering requires explicit wait

CSS `@font-face` registers the font but Canvas 2D does NOT auto-swap
when the font loads. If you draw text before the font is ready, you
get tofu glyphs that NEVER update.

```javascript
var _fontReady = false;
var _fontPending = false;

function loadFont(fontFamily, onReady) {
    if (_fontReady) { onReady(); return; }
    if (typeof document === 'undefined' || !document.fonts ||
        !document.fonts.load) {
        setTimeout(onReady, 200);
        return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "' + fontFamily + '"').then(function() {
            _fontReady = true;
        });
    }
    var attempts = 0;
    var poll = function() {
        attempts++;
        if (_fontReady || attempts > 30) {
            _fontReady = true;
            onReady();
            return;
        }
        setTimeout(poll, 100);
    };
    poll();
}
```

**Do NOT use `document.fonts.ready`** — it resolves when ALL currently
loading fonts finish, not when YOUR specific font is ready. Use
`document.fonts.load()` targeting your exact font.

### B2. HiDPI canvas scaling is mandatory

Without this, canvas renders at 1x and looks blurry on Retina/4K.

```javascript
var dpr = window.devicePixelRatio || 1;
canvas.width = w * dpr;
canvas.height = h * dpr;
canvas.style.width = w + 'px';
canvas.style.height = h + 'px';
var ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
// ALL drawing uses w, h (CSS pixels), NOT canvas.width/height
```

### B3. getOption helper is mandatory

Dashboard Studio may pass formatter-changed values as short keys
(without namespace) while initial JSON values use full namespace.
Direct `config[ns + 'key']` misses the short-key path.

```javascript
function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}
```

**Use `getOption` for EVERY config read. No exceptions.**

### B4. Never read config in formatData

`formatData` is called by Splunk's caching pipeline. Reading `config`
here causes stale/timing bugs. All config reading belongs in
`updateView`.

```javascript
formatData: function(data, config) {
    // ONLY data processing here — NO config reads
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        throw new SplunkVisualizationBase.VisualizationError(
            'Awaiting data'
        );
    }
    var fields = data.fields;
    var colIdx = {};
    for (var i = 0; i < fields.length; i++) {
        colIdx[fields[i].name] = i;
    }
    var result = { colIdx: colIdx, rows: data.rows };
    this._lastGoodData = result;
    return result;
}
```

### B5. Formatter section labels must be exact

Dashboard Studio merges formatter sections by matching `section-label`
**case-sensitively**. Wrong casing creates duplicate groups.

```html
<!-- CORRECT (exact match) -->
<form class="splunk-formatter-section" section-label="Data configurations">
<form class="splunk-formatter-section" section-label="Data display">
<form class="splunk-formatter-section" section-label="Color and style">
```

| Wrong | Right |
|---|---|
| `"Data Configuration"` (singular, capital C) | `"Data configurations"` |
| `"Data Display"` (capital D) | `"Data display"` |
| `"Color and Style"` (capital S) | `"Color and style"` |

**Structure rules:**
- No wrapper `<div>` around forms — bare `<form>` elements only
- No nested `<form>` inside `<form>`
- Every `<splunk-control-group>` MUST have `help="..."` attribute

### B6. Canvas shadow state leaks

Shadow settings persist across draw calls. Always reset after use:

```javascript
ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
```

### B7. JS defaults must match formatter HTML defaults

Splunk does NOT send formatter defaults on first load. If your JS
default for `accentColor` is `#06B6D4` but the formatter says
`value="#FF0000"`, the viz renders with cyan until the user touches
the color picker — then it jumps to red. Always keep them in sync.

### B8. Auto-scale by default, explicit override at non-zero

```javascript
var userSize = parseInt(getOption(config, ns, 'iconSize', '0'), 10);
var iconSize;
if (userSize > 0) {
    iconSize = userSize;
} else {
    iconSize = Math.max(16, Math.min(200, Math.min(w, h) * 0.6));
}
```

`0` = auto-scale. Positive value = user override. Never hardcode
pixel sizes — panels resize.

### B9. Dashboard Studio type format

```json
"type": "app_name.viz_name"
```

Format: `{app_id}.{viz_name}`. Nothing else.

| Wrong | Why |
|---|---|
| `viz.custom.app.viz` | Not a valid prefix |
| `custom.visualizations.app.viz` | Internal namespace |
| `splunk.custom.app.viz` | `splunk.*` is for built-ins |
| `splunk.viz_name` | Only for built-in vizs |

### B10. Option namespace — three formats for three contexts

| Context | Format | Example |
|---|---|---|
| Dashboard Studio JSON | `{app}.{viz}.settingName` | `f1_pack.ers_gauge.accentColor` |
| savedsearches.conf | `display.visualizations.custom.{app}.{viz}.settingName` | `display.visualizations.custom.f1_pack.ers_gauge.accentColor` |
| formatter.html | `{{VIZ_NAMESPACE}}.settingName` | `{{VIZ_NAMESPACE}}.accentColor` |

Get any one wrong and the setting silently fails.

### B11. parseFloat truncates string values

`parseFloat("1:21.584")` returns `1`. `parseFloat("+4.271s")` returns
`4`. Any KPI-type viz that displays a single value MUST detect
non-numeric strings and display them as-is.

```javascript
var rawStr = String(row[colIdx[field]]);
var rawValue = parseFloat(rawStr);
var isNumeric = !isNaN(rawValue) && String(rawValue) === rawStr.replace(/^[+\s]+/, '');

var displayValue;
if (!rawStr) {
    displayValue = '—';
} else if (!isNumeric) {
    displayValue = rawStr;  // lap times, gaps, formatted strings
} else if (decimals >= 0) {
    displayValue = rawValue.toFixed(decimals);
} else {
    displayValue = fmtNum(rawValue, { compact: true });
}
```

Common values that break: `1:21.584` (lap time), `+4.271s` (gap),
`P1` (position), `DNS` (did not start), `3.8%` (percentage with unit
baked in).

### B12. Gauge colors must match brand, not default green

The default gauge palette (green→yellow→red) is generic and
off-brand. Gauge segment colors MUST derive from the brand palette:

- **Red Bull:** blue→lightblue→gold→red (navy #1E3A6E → sky #4A8FE7)
- **Disney+:** blue→purple gradient (brand blue #0063E5)
- **Netflix:** dark grey→red (cinema feel)

Use `lerpColor(brandLow, brandHigh, segmentPct)` for smooth branded
transitions. Reserve red for the actual red zone only.

### B13. Canvas background must use clearRect, never fillRect

Vizs that fill the canvas with `ctx.fillStyle = t.bg; ctx.fillRect(0,
0, w, h)` paint an opaque background that overrides Dashboard Studio's
`"backgroundColor": "transparent"` option. The user loses control
over the panel background.

```javascript
// WRONG — overrides panel backgroundColor
ctx.fillStyle = t.bg;
ctx.fillRect(0, 0, w, h);

// CORRECT — transparent canvas, panel CSS controls background
ctx.clearRect(0, 0, w, h);
```

Let Dashboard Studio's `backgroundColor` option control the panel
background. Vizs should only draw their content on a clear canvas.

### B14. Variables in _draw() are not accessible from sub-methods

If your viz splits rendering into `_draw()` → `_drawCenter()`,
`_drawTicks()`, etc., local variables in `_draw()` are NOT in scope
inside the sub-methods. This causes `ReferenceError: x is not defined`
at runtime.

```javascript
// WRONG — gi is local to _draw, invisible to _drawCenter
_draw: function(parsed, config) {
    var gi = 0.8;
    this._drawCenter(ctx, parsed);     // gi is not defined!
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * gi;          // ReferenceError
}

// CORRECT — store on this
_draw: function(parsed, config) {
    this._gi = 0.8;
    this._drawCenter(ctx, parsed);
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * (this._gi || 1);
}
```

### B15. Always include formatData in the extend object

Splunk calls `formatData` during its data pipeline. If missing, the
viz may silently fail or receive data in an unexpected format. Always
include it, even as a passthrough:

```javascript
formatData: function(data) {
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        return data;
    }
    var fields = data.fields;
    var colIdx = {};
    for (var i = 0; i < fields.length; i++) {
        colIdx[fields[i].name] = i;
    }
    var result = { colIdx: colIdx, rows: data.rows };
    this._lastGoodData = result;
    return result;
},
```

### B15. Every visual property must be configurable via formatter

If the viz code uses a color, size, toggle, or position — there SHOULD
be a corresponding setting for every visual property that the user might
want to customize. Not every internal rendering detail needs a formatter
control — focus on colors, sizes, labels, and behavioral toggles.

**Mandatory formatter settings for every viz:**

| Category | Settings | Type |
|---|---|---|
| **Theme** | `theme` (dark/light) | radio |
| **Colors** | `accentColor`, `colors` (CSV hex) | color-picker / text |
| **Typography** | `label`, `labelPlacement` (top/bottom/left/none) | text / dropdown |
| **Values** | `field`, `unit`, `unitPosition` (before/after), `decimals` | text / radio |
| **Trends** | `showDelta`, `deltaField` | radio / text |
| **Effects** | `showGlow` (recommended); `accentIntensity` (0-100) RECOMMENDED for vizs with glow/shadow — lets users dial effects up or down; not required for vizs without accent effects | radio / text |
| **Layout** | `alignment` (left/center/right) | radio |

**Domain-specific settings (add when applicable):**

| Setting | When | Type |
|---|---|---|
| `maxValue`, `redZoneStart` | Gauges with threshold bands | text |
| `segments` | Segmented arcs | text |
| `showPosition` | Tables with ranking | radio |
| `badgeField` | Tables with category badges | text |
| `showReadout`, `showLegend` | Donuts/composition vizs | radio |
| `maxRows` | Tables | text |
| `colors` | Multi-series charts, donuts | text (CSV hex) |

**Test:** for every `var x = getOption(config, ns, 'something', default)`
in the source, there MUST be a matching `<splunk-control-group>` in
`formatter.html` with the same key and a matching default value (B7).

**Anti-pattern:** hardcoding `ctx.fillStyle = '#DC0000'` anywhere
except as a fallback default. Colors come from theme tokens OR
formatter settings — never inline hex in render logic.

## REJECTED — fails AppInspect / Splunk Cloud vetting

### R1. app.conf must have 5 stanzas

```ini
[install]
is_configured = 0
build = 1

[id]
name = app_name

[package]
id = app_name
check_for_updates = false

[ui]
is_visible = true
label = Display Name

[launcher]
author = Author
description = Description
version = 1.0.0
```

**Missing `[id]`** → AppInspect failure.
**`is_configured = true`** → non-standard, use `0`.
**Missing `check_for_updates = false`** → warning for private apps.

### R2. default.meta must include sc_admin

```ini
[]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[visualizations/viz_name]
export = system
```

**Missing global `[]` stanza** → blocked by
`check_meta_default_write_access`.
**Missing `sc_admin`** → blocked by `check_kos_are_accessible` (Cloud
has no `admin` role).

### R3. No macOS artifacts in tarball

macOS tar silently adds `._` resource fork entries to the archive.
Splunk sees these as extra top-level directories and rejects the
upload: **"archive contains more than one immediate subdirectory:
and {app_name}"**.

`COPYFILE_DISABLE=1` is MANDATORY on macOS:

```bash
find app_dir -name '._*' -delete
find app_dir -name '.DS_Store' -delete
COPYFILE_DISABLE=1 tar czf app.tar.gz --exclude='.*' app_dir
```

`.DS_Store`, `._*` files → AppInspect failure. Missing
`COPYFILE_DISABLE=1` → Splunk install rejection.

### R4. No nested archives

Remove old `.tar.gz` files from `dist/` before packaging. Nested
archives → AppInspect failure.

### R5. No real-time saved searches

```ini
# WRONG
dispatch.earliest_time = rt-1m
dispatch.latest_time = rt

# CORRECT
dispatch.earliest_time = -1m
dispatch.latest_time = now
```

Splunk Cloud vetting rejects real-time (`check_for_real_time_saved_searches`).

### R6. README/savedsearches.conf.spec required

Must document every custom setting:

```
display.visualizations.custom.{app}.{viz}.setting = <type>
```

Missing → btool compliance warning.

### R7. No [triggers] stanza

`visualizations.conf` is a Splunk-defined conf file. Adding
`[triggers] reload.visualizations = simple` causes
`check_for_trigger_stanza` failure on Cloud.

## INTERACTIVE — must have for production

### I1. Hover tooltip is mandatory on data-displaying vizs

Every viz that displays DATA must show a tooltip on hover. Decorative
vizs (background shapes, texture overlays) don't need tooltips. Canvas
has no built-in tooltip — use a DOM element positioned at the cursor.

```javascript
initialize: function() {
    // ... after canvas creation ...
    this._tooltip = document.createElement('div');
    this._tooltip.style.cssText =
        'position:absolute;display:none;padding:6px 10px;' +
        'background:rgba(0,0,0,0.85);color:#fff;font-size:12px;' +
        'border-radius:4px;pointer-events:none;white-space:nowrap;' +
        'z-index:100;font-family:sans-serif;';
    this.el.style.position = 'relative';
    this.el.appendChild(this._tooltip);

    var self = this;
    this.canvas.addEventListener('mousemove', function(e) {
        self._onMouseMove(e);
    });
    this.canvas.addEventListener('mouseleave', function() {
        self._tooltip.style.display = 'none';
    });
},

_onMouseMove: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Hit-test against drawn elements (viz-specific logic)
    var hit = this._hitTest(mx, my);
    if (hit) {
        this._tooltip.textContent = hit.label + ': ' + hit.value;
        this._tooltip.style.display = 'block';
        this._tooltip.style.left = (mx + 12) + 'px';
        this._tooltip.style.top = (my - 8) + 'px';
        this.canvas.style.cursor = 'pointer';
    } else {
        this._tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
    }
},
```

**Hit-test patterns per viz type:**
- **KPI tile:** single hit zone = entire panel. Show field name + value.
- **Ring gauge:** arc region. Show percentage + raw value.
- **Donut:** angle-based. Compute angle from center, match to segment.
- **Area chart:** x-position to data index. Show all series values at
  that time point.
- **Table:** row index from y-position. Highlight row, show full row
  data.

**Always clean up in destroy:**
```javascript
destroy: function() {
    if (this._tooltip && this._tooltip.parentNode) {
        this._tooltip.parentNode.removeChild(this._tooltip);
    }
    // ... other cleanup ...
}
```

### I2. Hover highlight on charts and tables

Beyond the tooltip, hovering should visually highlight the element:
- **Donut:** increase segment opacity or add stroke
- **Area chart:** draw vertical crosshair line + data point dots
- **Table:** brighten row background
- **Gauge:** show exact value label near the arc

Store hit regions during `_render` and re-use in `_hitTest`.

## COSMETIC — works but looks wrong

> COSMETIC rules prevent visual bugs. For design quality guidelines
> (color choices, typography, spacing), see `vp-couture` and
> `vp-ref-patterns`.

### C1. Panel backgroundColor must be transparent

You CANNOT control the Dashboard Studio panel background from inside
the viz. It must be set in the dashboard JSON:

```json
"options": {
    "backgroundColor": "transparent",
    "app.viz.setting": "value"
}
```

`backgroundColor` is a built-in Studio option (no namespace prefix).
Document this in every README and demo dashboard.

### C2. MutationObserver hides Splunk placeholders

Vizs that render without data (static icons, decorative elements) get
overlaid with Splunk's "no results" placeholder. Hide it:

```javascript
initialize: function() {
    var self = this;
    this._observer = new MutationObserver(function() {
        var nodes = self.el.querySelectorAll(
            '.viz-placeholder, .shared-viz-no-results, ' +
            '[data-test="viz-no-results"], .viz-controller-no-results'
        );
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].style.display = 'none';
        }
    });
    this._observer.observe(this.el, { childList: true, subtree: true });
},
destroy: function() {
    if (this._observer) this._observer.disconnect();
}
```

### C3. Cursor pointer on drilldown

```javascript
if (drilldownEnabled) {
    this.el.style.cursor = 'pointer';
    this.canvas.style.cursor = 'pointer';
}
```

Without this, users don't know the viz is clickable.

### C4. Drilldown must be wrapped in try/catch

```javascript
try {
    self.drilldown({
        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
        data: payload
    }, event);
} catch (e) { /* test harness has no drilldown infra */ }
```

### C5. Animation timers must be cleaned up in destroy

```javascript
destroy: function() {
    if (this._animTimer) {
        clearInterval(this._animTimer);
        this._animTimer = null;
    }
    if (this._observer) this._observer.disconnect();
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

### C6. Reflow should use direct re-render

```javascript
reflow: function() {
    if (this._lastConfig) {
        this._render(this._lastData, this._lastConfig);
    }
}
```

Faster and flicker-free. Cache `_lastData` and `_lastConfig` in
`updateView`.

### C7. Viz app name must match the brand/project

The app ID and viz stanza names create the Dashboard Studio type
prefix: `{app_id}.{viz_name}`. Always name the app after the
brand/project so the dashboard JSON reads naturally:

```
disney_plus_viz.kpi_tile       ← clear: this is a Disney+ KPI
f1_viz_pack.ers_gauge          ← clear: this is an F1 ERS gauge
soc_viz_pack.threat_radar      ← clear: this is a SOC threat radar

custom_viz.kpi_tile            ← bad: what brand? generic
my_viz.gauge                   ← bad: meaningless
```

The app ID appears in every `"type":` reference in every dashboard
JSON. Make it count.

## Pre-commit checklist — tiered

### TIER 1: MUST (blocks shipping — viz won't work without these)

- [ ] webpack target `['web', 'es5']` + all environment flags
- [ ] Source is pure ES5 (no const/let/arrow/template)
- [ ] Source uses `require()`/`module.exports`, NOT `define()` (F6)
- [ ] Uses `SplunkVisualizationBase.extend({...})` object literal (F7)
- [ ] `getInitialDataParams` returns `outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE`
- [ ] Canvas uses `clearRect()`, NOT `fillRect()` with bg color (B13)
- [ ] HiDPI scaling with `devicePixelRatio`
- [ ] `getOption()` + `getNS()` for ALL config reads
- [ ] No config reads in `formatData`
- [ ] JS defaults match formatter HTML defaults (B7)
- [ ] app.conf: 5 stanzas, `is_configured = 0`, `build` incremented
- [ ] default.meta: global `[]` with `sc_admin`, `[lookups]` exported
- [ ] No `[triggers]` stanza anywhere
- [ ] Dashboard JSON: `"backgroundColor": "transparent"` on every custom viz panel
- [ ] Dashboard JSON: type = `{app_id}.{viz_name}` (not `custom.X`)
- [ ] Bundle starts with `define([...], function(`
- [ ] Package: `COPYFILE_DISABLE=1`, excludes node_modules/src/.DS_Store

### TIER 2: SHOULD (quality — dashboard looks wrong without these)

- [ ] Hover tooltip (DOM div + mousemove + hitTest)
- [ ] Hover highlight (crosshair, row bg, segment glow)
- [ ] Every `getOption()` has matching formatter control (B15)
- [ ] No hardcoded hex in `_render()` — theme tokens or settings
- [ ] KPI vizs: `decimals` setting (default -1 = auto)
- [ ] KPI vizs: string passthrough for non-numeric values (B11)
- [ ] Gauge vizs: brand-colored segments, not green→red (B12)
- [ ] App name = brand name (not `custom_viz`)
- [ ] Images in `appserver/static/images/` (never external URLs)
- [ ] Z-order: bg layers first → panels → vizs → overlays
- [ ] Animations cleared in `destroy()`
- [ ] Shadow state reset after every glow draw
- [ ] Drilldown wrapped in try/catch

### TIER 3: POLISH (distinguishes good from great)

- [ ] Fonts embedded as base64, font readiness polled
- [ ] savedsearches.conf.spec documents every setting
- [ ] Demo data via CSV lookups (not makeresults)
- [ ] Markdown panels sized to avoid scrollbars
- [ ] `aria-label` on canvas with primary value for accessibility
- [ ] Canvas `cursor: pointer` on hoverable elements
