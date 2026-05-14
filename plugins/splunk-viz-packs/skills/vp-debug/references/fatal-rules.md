## FATAL — viz won't load at all

### Contents
- F1: Webpack must target ES5
- F2: Fonts must be base64 data URIs
- F3: Source must be pure ES5
- F4: getInitialDataParams must use ROW_MAJOR_OUTPUT_MODE
- F5: Only externalize what you import
- F6: Source MUST use require(), NEVER define()
- F7: MUST use extend({...}) object literal
- F8: Images must be bundled, never external URLs
- F9: Vizs in appserver/static/visualizations/
- F10: No jQuery
- F11: Webpack 5 IIFE may fail — flat AMD alternative
- F12: Formatter must use Splunk components

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

**NEVER set `outputMode` as a property on the extend object literal:**
```javascript
// WRONG — property evaluated at extend() time, may not resolve
SplunkVisualizationBase.extend({
    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,  // BAD
    // ...
});

// CORRECT — always inside getInitialDataParams method
SplunkVisualizationBase.extend({
    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },
    // ...
});
```

`getInitialDataParams` is REQUIRED, not optional. Without it, Splunk
doesn't know how to deliver data to the viz — you get "Unknown output
mode: undefined".

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

### F9. Vizs MUST be in appserver/static/visualizations/, NOT default/visualizations/

Splunk loads custom viz bundles from `appserver/static/visualizations/`.
Putting them in `default/visualizations/` causes REQUIREJS_ERROR_MESSAGE
on every viz with no useful error in the console.

```
WRONG — REQUIREJS Script error, viz won't load:
  {app}/default/visualizations/{viz_name}/visualization.js

RIGHT — Splunk finds and loads the viz:
  {app}/appserver/static/visualizations/{viz_name}/visualization.js
```

This is the #1 cause of "all vizs show Script error" after install.
`default/` is for conf files only. Viz JS/HTML/CSS go under `appserver/`.

### F10. No jQuery — use standard DOM APIs only

Dashboard Studio v2 custom vizs render inside a sandboxed iframe where
jQuery is NOT available. `this.$el` is `undefined`. Any jQuery call
crashes the viz at initialization.

```javascript
// WRONG — TypeError: Cannot read properties of undefined
this.$el.addClass('my-viz');
this.$el.find('.tooltip').remove();
$('.container').on('click', handler);

// CORRECT — standard DOM APIs
this.el.className = (this.el.className || '') + ' my-viz';
var tooltip = this.el.querySelector('.tooltip');
if (tooltip) tooltip.parentNode.removeChild(tooltip);
this.el.addEventListener('click', handler);
```

**Rule:** NEVER use `this.$el`, `$.fn`, `jQuery`, or any jQuery syntax.
Use `document.createElement`, `querySelector`, `addEventListener`,
`className`, `style.cssText`, etc.

### F11. Webpack 5 IIFE may fail in Dashboard Studio v2 sandbox — flat AMD alternative

Webpack 5 wraps modules in an IIFE inside the AMD factory. Splunk's
RequireJS + iframe sandbox + cross-origin restrictions can cause this
nested structure to fail silently as `REQUIREJS_ERROR_MESSAGE Script error`.

**If webpack bundles cause Script error despite correct config (F1),**
use flat AMD builds instead:

```javascript
// Flat AMD — no webpack needed
define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {
    // theme.js inlined as IIFE
    var theme = (function() {
        // ... theme.js contents ...
        return { getTheme: getTheme, /* ... */ };
    })();

    return SplunkVisualizationBase.extend({
        initialize: function() { /* ... */ },
        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },
        formatData: function(data) { /* ... */ },
        updateView: function(data, config) { /* ... */ },
        reflow: function() { /* ... */ },
        destroy: function() { /* ... */ }
    });
});
```

**Build with `build_flat.js`** (see `vp-create` for the script):
1. Reads `shared/theme.js`
2. Strips `require()` and `module.exports` lines from viz source
3. Converts `module.exports = X;` to `return X;`
4. Wraps in `define(["api/SplunkVisualizationBase"], function(...) { ... });`
5. Inlines theme.js as an IIFE

**When to use flat vs webpack:**
- Try webpack first (F1 config) — it works for most packs
- Switch to flat AMD if you get persistent Script errors in the
  sandboxed iframe that F1-F9 don't explain

### F12. Formatter HTML must use Splunk components, NEVER raw HTML

Splunk's visualization framework only reads its own custom elements.
Raw HTML (`<div>`, `<input>`, `<select>`, `<label>`, `<h3>`) is
silently ignored — the Format panel shows NO settings.

```html
<!-- WRONG — Splunk ignores all of this -->
<div class="section">
    <h3>Data Fields</h3>
    <div class="form-row">
        <label>Label field</label>
        <input type="text" name="myapp.myviz.labelField" />
    </div>
</div>

<!-- ALSO WRONG — no wrapper tags allowed -->
<html><body>
<form class="splunk-formatter-section" ...>
</form>
</body></html>

<!-- RIGHT — bare forms with Splunk components -->
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Label field" help="SPL field for row labels">
        <splunk-text-input name="myapp.myviz.labelField" default="label">
        </splunk-text-input>
    </splunk-control-group>
</form>
```

**Allowed components only:**
- `<splunk-text-input>` — text fields
- `<splunk-radio-input>` with `<option>` children — radio/dropdown/boolean
- `<splunk-color-picker>` with `<splunk-color>` children — color swatches
- `<splunk-range-input>` — slider (rare)

**Forbidden elements:** `<div>`, `<input>`, `<select>`, `<textarea>`,
`<label>`, `<h1>`-`<h6>`, `<span>`, `<style>`, `<script>`. No CSS, no
JavaScript. No `<html>` or `<body>` wrappers.

Every `<splunk-control-group>` MUST have `help="..."` attribute.

