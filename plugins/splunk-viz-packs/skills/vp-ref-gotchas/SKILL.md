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

### F4. Only externalize what you import

```javascript
// If you only use SplunkVisualizationBase:
externals: ['api/SplunkVisualizationBase']

// Only add SplunkVisualizationUtils if you actually import it:
externals: ['api/SplunkVisualizationBase', 'api/SplunkVisualizationUtils']
```

Externalizing unused modules wastes an AMD slot and webpack emits
warnings.

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

```bash
find app_dir -name '._*' -delete
find app_dir -name '.DS_Store' -delete
COPYFILE_DISABLE=1 tar czf app.tar.gz --exclude='.*' app_dir
```

`.DS_Store`, `._*` files → AppInspect failure.

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

## COSMETIC — works but looks wrong

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

## Pre-commit checklist

Before writing ANY viz code, verify:

- [ ] webpack.config.js has `target: ['web', 'es5']` + all environment flags
- [ ] visualization_source.js is pure ES5 (no const/let/arrow/template)
- [ ] All fonts embedded as base64 in visualization.css
- [ ] Font readiness polled before Canvas text drawing
- [ ] HiDPI scaling with devicePixelRatio
- [ ] `getOption()` + `getNS()` helpers used for all config reads
- [ ] No config reads in `formatData`
- [ ] Formatter section labels are exact lowercase match
- [ ] JS defaults match formatter HTML defaults
- [ ] app.conf has all 5 stanzas with `is_configured = 0`
- [ ] default.meta has global `[]` stanza with `sc_admin`
- [ ] savedsearches.conf.spec documents every custom setting
- [ ] No `[triggers]` stanza in any conf file
- [ ] Bundle verified: starts with `define([...], function(`
- [ ] Package excludes: node_modules, src, .DS_Store, ._*, .git*
- [ ] README documents `"backgroundColor": "transparent"` requirement
- [ ] MutationObserver hides placeholders (if viz renders without data)
- [ ] Drilldown wrapped in try/catch
- [ ] All animations cleared in `destroy()`
- [ ] Canvas shadow state reset after every shadow/glow draw
