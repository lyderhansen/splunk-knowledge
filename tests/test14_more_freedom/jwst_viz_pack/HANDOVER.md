# JWST Viz Pack — Session Handover & Lessons Learned

## Session Summary

Built a 6-viz custom Canvas 2D pack for NASA JWST mission operations.
All 6 vizs now render: heat_grid, instrument_matrix, data_cascade,
observation_queue, power_horizon, kpi_tile.

Total builds to get working: **10** (build 1-10).
Total time debugging: ~70% of the session was debugging, not building.

---

## Critical Lessons for vp-ref-gotchas / vp-viz / vp-create

### L15. Viz files go in `appserver/static/visualizations/`, NOT `default/visualizations/`

**Symptom:** `REQUIREJS_ERROR_MESSAGE Script error for "/static/@hash/app/{pack}/visualizations/{viz}/visualization.js"`

**Root cause:** Files were placed in `default/visualizations/{viz}/` but Splunk serves custom viz assets from `appserver/static/visualizations/{viz}/`.

**The URL mapping:**
```
/static/@{hash}/app/{app_name}/visualizations/{viz_name}/visualization.js
  → $SPLUNK_HOME/etc/apps/{app_name}/appserver/static/visualizations/{viz_name}/visualization.js
```

**Correct directory structure:**
```
{app}/
├── default/
│   ├── app.conf                          # App metadata
│   ├── visualizations.conf               # Viz stanza declarations
│   └── data/ui/views/                    # Dashboard XML
├── appserver/static/
│   ├── visualizations/
│   │   ├── {viz_name}/
│   │   │   ├── visualization.js          # Built AMD module
│   │   │   ├── visualization.css         # Styles + embedded fonts
│   │   │   └── formatter.html            # Settings UI
│   │   └── ...
│   └── images/                           # Hero images, logos
├── lookups/                              # CSV demo data
└── metadata/default.meta                 # Permissions
```

**Rule:** `default/visualizations/` is ONLY for `visualizations.conf` stanza
declarations. The actual viz runtime files (JS, CSS, HTML) MUST be in
`appserver/static/visualizations/{viz_name}/`.

**Impact:** FATAL — every viz shows "Script error" if files are in wrong location.

---

### L16. Webpack 5 IIFE bundles cause RequireJS failures in Splunk

**Symptom:** `REQUIREJS_ERROR_MESSAGE Script error` for all vizs, even when
the AMD wrapper (`define([...], function(...) {...})`) looks correct.

**Root cause:** Webpack 5 wraps modules in an IIFE inside the AMD factory:
```javascript
define(["api/SplunkVisualizationBase"], function(t) {
    return (function() {
        var __webpack_modules__ = [...];
        // ... complex module system ...
        return __webpack_require__(0);
    })();
});
```

Splunk's RequireJS (older version) + iframe sandbox + cross-origin restrictions
cause this nested structure to fail silently. The actual JS error is masked
as "Script error" because the viz runs in a sandboxed `about:srcdoc` iframe.

**Fix:** Use flat AMD modules instead of webpack bundling:
```javascript
define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {
    // theme.js inlined as IIFE
    var theme = (function() { ... })();
    // viz code directly
    return SplunkVisualizationBase.extend({ ... });
});
```

**Build approach:** A simple Node.js script (`build_flat.js`) that:
1. Reads `shared/theme.js`
2. Strips `require()` and `module.exports` lines from viz source
3. Replaces `module.exports = X;` with `return X;`
4. Wraps everything in `define(["api/SplunkVisualizationBase"], function(...) { ... });`
5. Inlines theme.js as an IIFE

**Impact:** FATAL — no viz loads if webpack bundles are used.

**Gotcha for build_flat.js:**
- Must strip lines starting with `var X = require(` (exact pattern)
- Must convert `module.exports = X;` to `return X;`
- Must handle BOTH patterns: `module.exports = SplunkVisualizationBase.extend({...});`
  AND `module.exports = VarName;` where VarName was assigned earlier
- Comments containing "require" (like `// Required by...`) are harmless
- Module-level variables (constants, helpers) must be preserved in the output

---

### L17. No jQuery (`this.$el`) in Dashboard Studio v2 custom vizs

**Symptom:** `TypeError: Cannot read properties of undefined (reading 'addClass')`
at `initialize`.

**Root cause:** In Splunk's Classic Simple XML framework, custom vizs get
jQuery via `this.$el`. In Dashboard Studio v2, vizs run in a sandboxed
iframe where jQuery is NOT available. Only `this.el` (plain DOM element)
exists.

**Broken code:**
```javascript
this.$el.addClass('my-viz');          // TypeError: $el is undefined
this.$el.find('.tooltip').remove();   // same
```

**Fixed code:**
```javascript
this.el.className = (this.el.className || '') + ' my-viz';
var tooltip = this.el.querySelector('.tooltip');
if (tooltip) tooltip.parentNode.removeChild(tooltip);
```

**Rule:** NEVER use `this.$el`, `$.fn`, `jQuery`, or any jQuery syntax.
Use standard DOM APIs only: `document.createElement`, `querySelector`,
`addEventListener`, `className`, `style.cssText`, etc.

**Impact:** FATAL — viz fails to initialize, shows placeholder icon.

---

### L18. Never set `outputMode` as a property on the extend object

**Symptom:** `Error: Unknown output mode: undefined` from `DataTransformer.ts`

**Root cause:** Setting `outputMode` as a property on the extend object literal:
```javascript
SplunkVisualizationBase.extend({
    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,  // BAD
    // ...
});
```

The property is evaluated at `extend()` call time. In the flat AMD build,
`SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE` resolves correctly inside
`getInitialDataParams` (called later at runtime), but as a property on the
object literal, the constant may not be available depending on timing.

**Fix:** Always use `getInitialDataParams` method, never a property:
```javascript
SplunkVisualizationBase.extend({
    // NO outputMode property here
    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },
    // ...
});
```

**Impact:** FATAL — viz loads but never receives data.

---

### L19. `getInitialDataParams` is REQUIRED, not optional

**Symptom:** `Error: Unknown output mode: undefined` — same as L18 but
caused by the method being completely absent.

**Root cause:** Some agent-generated vizs omitted `getInitialDataParams`
entirely, relying on a property-level `outputMode` instead. When that
property was removed (per L18), there was no fallback.

**Rule:** Every viz MUST have `getInitialDataParams` as a method in the
extend object. It is NOT optional. Without it, Splunk doesn't know how
to deliver data to the viz.

**Impact:** FATAL — viz loads but never receives data.

---

### L20. `theme.setupCanvas(el)` must receive the CONTAINER element, not the canvas

**Symptom:** Canvas renders as 0×0 or the viz shows nothing.

**Root cause:** Calling `theme.setupCanvas(this._canvas)` passes the canvas
element itself. Inside `setupCanvas`:
```javascript
function setupCanvas(el) {
    var canvas = el.querySelector('canvas');  // fails on a canvas element
    if (!canvas) {
        canvas = document.createElement('canvas');
        el.appendChild(canvas);  // appends canvas TO canvas (broken)
    }
    var rect = el.getBoundingClientRect();  // wrong dimensions
}
```

**Fix:** Always pass `this.el` (the container div), not `this._canvas`:
```javascript
var setup = theme.setupCanvas(this.el);  // CORRECT
this._canvas = setup.canvas;
```

**Corollary:** If `initialize` creates its own canvas with
`document.createElement('canvas')`, DON'T also call `theme.setupCanvas`.
Either let `setupCanvas` create the canvas, or create it manually — not both.
If you create manually in `initialize`, bind events there. If you use
`setupCanvas` in `updateView`, bind events after the first `setupCanvas` call
using a `_eventsAttached` flag.

**Impact:** BROKEN — viz loads, data arrives, but nothing is visible.

---

### L21. `reflow` must call an existing method

**Symptom:** `TypeError: this._render is not a function`

**Root cause:** The `reflow` method was added referencing `this._render()`
but the viz's actual rendering method was named `_draw()` or the rendering
happened inline in `updateView`.

**Pattern for vizs with inline rendering in updateView:**
```javascript
reflow: function() {
    if (this._lastData && this._lastConfig) {
        this.updateView(this._lastData, this._lastConfig);
    }
}
```

**Pattern for vizs with a separate _draw method:**
```javascript
reflow: function() {
    if (this._lastData && this._lastConfig) {
        this._draw(this._lastData, this._lastConfig);
    }
}
```

**Rule:** Before writing `reflow`, grep the source for the actual render
method name. Don't assume `_render` — it could be `_draw`, `_update`,
`_redraw`, or inline in `updateView`.

**Impact:** BROKEN — viz renders once, then crashes on window resize or
panel resize.

---

### L22. Splunk static cache requires `build` number bump in app.conf

**Symptom:** Changes don't take effect after reinstalling the app. Browser
console shows the same `@hash` in URLs.

**Root cause:** Splunk caches static assets keyed by a hash derived from
`build` in `app.conf`. If `build` doesn't change, the hash doesn't change,
and browsers serve cached (old) JS/CSS.

**Fix:** Increment `build` in `app.conf` for EVERY package rebuild:
```ini
[install]
is_configured = 0
build = 10
```

**Also:** After installing, hard-refresh the browser (Cmd+Shift+R) to
bypass browser cache.

**Impact:** CONFUSING — old code runs despite new install. Wastes hours
debugging "fixed" code that isn't actually deployed.

---

### L23. `splunk.rectangle` `rx` must be a number, not a string

**Symptom:** Dashboard Studio validation errors:
```
/visualizations/viz_panel_right/options/rx: must be number
```

**Broken:** `"rx": "0"` (string)
**Fixed:** `"rx": 0` (number)

**Impact:** WARNING — dashboard loads but shows validation errors.

---

### L24. Console errors from iframe sandboxing are NOT your bugs

**Ignorable errors:**
- `SecurityError: Failed to read the 'cookie' property` — sandboxed iframe
- `Content Security Policy directive 'img-src'` — Splunk's own CSP
- `502 Connection refused` on `orchestrator/v1/spl2/enabled` — Splunk Cloud feature
- `404 on tenantinfo` — on-prem Splunk, not Cloud
- `web-client-content-script.js: MutationObserver` — browser extension

These are Splunk framework noise. Focus on errors from YOUR visualization.js files.

---

## Error Diagnosis Flowchart

```
Viz shows placeholder icon (bar chart in grey box)
├── Check Console for errors
│   ├── "Script error for .../visualization.js"
│   │   ├── File not found? → L15 (wrong directory)
│   │   ├── Webpack IIFE? → L16 (use flat AMD)
│   │   └── jQuery used? → L17 (no $el in DS v2)
│   ├── "Unknown output mode: undefined"
│   │   ├── getInitialDataParams missing? → L19
│   │   └── outputMode as property? → L18
│   ├── "X is not a function"
│   │   ├── _render? → L21 (wrong method name)
│   │   └── addClass? → L17 (jQuery)
│   └── "CustomVizClassDef is not a constructor"
│       └── Syntax error in viz JS → check with Node.js
├── No console errors but blank
│   ├── setupCanvas wrong element? → L20
│   ├── formatData returns null? → check data flow
│   └── Canvas dimensions 0×0? → check el.getBoundingClientRect()
└── Changes not taking effect → L22 (build number + hard refresh)
```

---

## Build Pipeline (Final Working Version)

```bash
# 1. Write source files
#    default/visualizations/{viz}/src/visualization_source.js
#    default/visualizations/shared/theme.js

# 2. Flat AMD build (no webpack)
node build_flat.js
# → reads source + theme.js
# → strips require(), converts module.exports to return
# → inlines theme as IIFE
# → writes default/visualizations/{viz}/visualization.js

# 3. Copy to Splunk-expected location
for VIZ in jwst_*; do
    cp default/visualizations/$VIZ/visualization.js \
       appserver/static/visualizations/$VIZ/visualization.js
done

# 4. Bump build number
# Edit default/app.conf → build = N+1

# 5. Package
COPYFILE_DISABLE=1 tar czf dist/app.tar.gz \
    --exclude='node_modules' --exclude='*/src' --exclude='dist' \
    --exclude='default/visualizations/jwst_*' \
    app_name

# 6. Install + restart Splunk + hard refresh browser
```

---

## What to Add to vp-ref-gotchas

Add these as new entries:

| ID | Severity | Rule |
|----|----------|------|
| F8 | FATAL | Viz files in `appserver/static/visualizations/`, not `default/visualizations/` |
| F9 | FATAL | Use flat AMD build, not webpack 5 IIFE bundles |
| F10 | FATAL | No jQuery (`this.$el`, `$.fn`) — use standard DOM only |
| F11 | FATAL | `getInitialDataParams` is REQUIRED, never use property-level `outputMode` |
| B16 | BROKEN | `setupCanvas()` must receive container `this.el`, not `this._canvas` |
| B17 | BROKEN | `reflow` must call the actual render method name (check source first) |
| C8 | COSMETIC | Bump `build` in app.conf for every release |
| C9 | COSMETIC | `rx` on `splunk.rectangle` must be number, not string |

---

## What to Add to vp-create

The scaffold skill should:
1. Place viz files in `appserver/static/visualizations/` (not `default/visualizations/`)
2. Include `build_flat.js` in the scaffold
3. Generate `getInitialDataParams` in EVERY viz template
4. Never generate `this.$el` references
5. Never set `outputMode` as a property on the extend object
6. Include a `copy_to_appserver.sh` step in the build pipeline

---

## What to Add to vp-viz (per-viz subagent prompts)

Add to EVERY subagent prompt:
1. "Place runtime files in `appserver/static/visualizations/{viz}/`"
2. "MUST include `getInitialDataParams` method with `ROW_MAJOR_OUTPUT_MODE`"
3. "Use `this.el` (plain DOM), NEVER `this.$el` (jQuery)"
4. "Never set `outputMode` as a property on the extend object literal"
5. "The `reflow` method must call the same method used for rendering (verify the name)"
6. "Pass `this.el` to `theme.setupCanvas()`, never `this._canvas`"

---

## Remaining Issues (for next session)

1. **Scaling:** Right-panel vizs need better responsive sizing
2. **Title:** Markdown title could be larger (Dashboard Studio fontSize limits)
3. **CSP warnings:** Hundreds of `img-src` warnings from an old Unsplash URL — clean up
4. **Font loading:** Oxanium/JetBrains Mono load slowly on first visit (base64 in CSS helps but is 85KB)
5. **Light theme:** Not tested yet — palette defined but vizs untested in light mode
