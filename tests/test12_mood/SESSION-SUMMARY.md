# SpaceX Mission Control Viz Pack — Session Summary

**Date:** 2026-05-06
**Pack:** `spacex_mission_control` v1.0.0 (7 custom visualizations)
**Purpose:** End-to-end test of `vp-couture` → `vp-create` → `vp-viz` pipeline with mood recipes

---

## What was built

| Viz | Type | Key features |
|---|---|---|
| `countdown_timer` | Hero KPI | LED-style digits, data glow, pulsing colons, ambient light, vignette |
| `telemetry_gauge` | Arc gauge | 270° arc, aerospace tick marks, smooth animation, center value glow |
| `fuel_gauge` | Fill gauge | Vertical tube, liquid gradient, meniscus effect, danger pulse |
| `stage_tracker` | Timeline | Diamond nodes, connection lines, active pulse ring animation |
| `burn_tracker` | XY chart | Trajectory line, phase-colored segments, grid, hover crosshair |
| `mission_kpi` | KPI tile | Instrument backlighting, trend arrows, threshold color shifts |
| `event_ticker` | Event feed | Status color bars, timestamped rows, row hover highlight |

Dashboard: `mission_control.xml` — 1920×1080 absolute layout with hero image, all 7 viz types, 13 makeresults data sources.

---

## Bugs found and fixed

### FATAL: Viz files in wrong directory

**Symptom:** `REQUIREJS_ERROR_MESSAGE Script error` on every viz.

**Root cause:** Viz files were placed in `default/visualizations/{viz}/` but Splunk expects them in `appserver/static/visualizations/{viz}/`.

**Fix:** Move `visualization.js`, `visualization.css`, and `formatter.html` to `appserver/static/visualizations/{viz}/`. The `default/visualizations.conf` stays in `default/` — it only contains metadata (label, description, search_fragment).

**Skill impact:** `vp-create` scaffolding must output viz files to `appserver/static/visualizations/`, not `default/visualizations/`. The `build.js` output path must match.

---

### FATAL: Double AMD wrapper from define() + webpack libraryTarget:'amd'

**Symptom:** `REQUIREJS_ERROR_MESSAGE Script error` — viz scripts fail to evaluate.

**Root cause:** Source files used AMD `define(['api/SplunkVisualizationBase', 'shared/theme'], function(SVB, theme) { ... })` but webpack's `libraryTarget: 'amd'` ALSO wraps the output in `define()`. Double-wrapping breaks RequireJS.

**Fix:** Source files MUST use CommonJS pattern:
```javascript
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({ ... });
```

Webpack handles the AMD wrapper via `libraryTarget: 'amd'`. The source must NOT contain `define()`.

**Skill impact:** `vp-viz` subagent prompts must explicitly state: "Use `require()` and `module.exports`, NEVER `define()`". Add to `vp-ref-gotchas` as a new FATAL rule.

---

### FATAL: Prototypal constructor pattern doesn't work with Splunk's extend()

**Symptom:** Viz loads (no RequireJS error) but shows no data — blank panel.

**Root cause:** Some subagents wrote vizs using a prototypal pattern:
```javascript
function MyViz(element) { SplunkVisualizationBase.call(this, element); ... }
MyViz.prototype.initialize = function() { ... };
MyViz.prototype.formatData = function() { ... };
// etc.
SplunkVisualizationBase.extend(MyViz);
module.exports = MyViz;
```

`SplunkVisualizationBase.extend(Constructor)` does NOT work — it expects a plain object with method properties, not a constructor function. The prototype methods are never registered.

Even `SplunkVisualizationBase.extend(MyViz.prototype)` is fragile — sub-methods called from `_draw()` can't access variables defined in `_draw()`.

**Fix:** Always use the standard pattern:
```javascript
module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        // setup...
    },
    getInitialDataParams: function() { ... },
    formatData: function(data) { ... },
    updateView: function(data, config) { ... },
    reflow: function() { ... },
    destroy: function() { ... }
});
```

**Skill impact:** `vp-viz` subagent prompts must include the exact extend pattern as a template. The prototypal pattern should be explicitly banned. Add to `vp-ref-gotchas`.

---

### BROKEN: Opaque canvas fill overrides Dashboard Studio backgroundColor

**Symptom:** Setting `"backgroundColor": "transparent"` on a panel has no effect — the viz paints its own solid background over it.

**Root cause:** Vizs filled the canvas with `ctx.fillStyle = t.bg; ctx.fillRect(0, 0, w, h)` which paints an opaque background, hiding the panel's CSS backgroundColor.

**Fix:** Use `ctx.clearRect(0, 0, w, h)` instead. Let Dashboard Studio's `backgroundColor` option control the panel background. Vizs should only draw their content, not a background.

**Skill impact:** Add to `vp-ref-gotchas` as BROKEN rule: "Canvas background must use clearRect(), never fillRect() with theme colors. The panel's backgroundColor option controls the background."

---

### BROKEN: Variable scoping in sub-methods (gi is not defined)

**Symptom:** `gi is not defined` error in telemetry_gauge and burn_tracker after adding accentIntensity.

**Root cause:** `var gi = ...` was defined inside `_draw()` but referenced in `_drawCenter()`, `_drawDots()` — separate methods that don't share `_draw()`'s local scope.

**Fix:** Store shared state on `this`: `this._gi = gi;` in `_draw()`, read as `this._gi || 1` in sub-methods.

**Skill impact:** `vp-ref-gotchas` should warn: "Variables in `_draw()` are NOT accessible from sub-methods like `_drawCenter()`. Use `this._propName` for values that sub-methods need."

---

### COSMETIC: Data sources show as "Unnamed" in Dashboard Studio editor

**Symptom:** All data sources appear as "Unnamed" in the Data Source Overview panel.

**Root cause:** Data source definitions lacked the `"name"` property.

**Fix:** Add `"name": "Human Label"` to every data source in the dashboard JSON:
```json
"ds_countdown": {
    "type": "ds.search",
    "name": "Countdown",
    "options": { "query": "..." }
}
```

**Skill impact:** `ds-create` and any dashboard generation should always include `name` on data sources.

---

### COSMETIC: SplunkVisualizationUtils imported but unused

**Symptom:** Build fails with `Module not found: Can't resolve 'api/SplunkVisualizationUtils'`.

**Root cause:** Subagent imported `SplunkVisualizationUtils` in the define() array but never used it, and it wasn't listed in webpack externals.

**Fix:** Only import `api/SplunkVisualizationBase`. Only add `SplunkVisualizationUtils` to externals AND imports if actually used.

**Skill impact:** Already covered in `vp-ref-gotchas` F5, but subagent prompts should reinforce: "Only import SplunkVisualizationBase unless you specifically need Utils."

---

## Feature added: accentIntensity

**Setting:** `accentIntensity` (0-100, default 50)
- 0 = no glow/accent effects
- 50 = standard (1x multiplier)
- 100 = double intensity (2x multiplier)

**Affects:** shadowBlur, ambient light opacity, accent line opacity, text glow radius, vignette strength, backlight opacity.

**Pattern:** Read in `_draw()` or `updateView()`:
```javascript
var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
this._gi = gi; // for sub-methods
```

Apply to effects:
```javascript
theme.drawAmbientLight(ctx, w, h, accent, 0.07 * gi);
ctx.shadowBlur = 12 * gi;
theme.drawTextGlow(ctx, text, x, y, font, color, 14 * gi);
```

**Skill impact:** `vp-couture` design brief should include `accentIntensity` as a standard setting. `vp-viz` should implement it in every viz.

---

## Subagent quality observations

### Inconsistent module patterns
4 of 7 subagents used AMD `define()`, 3 used CommonJS `require()`. The prompt said "Import theme via `require('shared/theme')`" but didn't explicitly ban `define()`. **Fix: The prompt must say "NEVER use define() — webpack adds the AMD wrapper".**

### Inconsistent extend patterns
2 of 7 subagents used prototypal constructor pattern, 5 used standard `extend({...})`. **Fix: Include the exact extend template in the prompt.**

### Missing formatData in some vizs
Some subagents didn't include `formatData` at all. Splunk calls it — if missing, the viz may silently fail. **Fix: Require formatData in the prompt template.**

### Formatter namespace inconsistency
Some formatters used `{{VIZ_NAMESPACE}}.setting`, others used `display.visualizations.custom.app.viz.setting`. Both work, but mixing them in one app is confusing. **Fix: Standardize on one format in vp-viz prompts.**

---

## Checklist for skill updates

### vp-ref-gotchas — new rules to add

- [ ] **F6.** Source MUST use `require()`/`module.exports`, NEVER `define()`. Webpack `libraryTarget:'amd'` adds the AMD wrapper.
- [ ] **F7.** MUST use `SplunkVisualizationBase.extend({...})` object literal pattern. NEVER use prototypal constructor pattern.
- [ ] **B13.** Canvas background MUST use `clearRect()`, NEVER `fillRect()` with theme colors. Panel `backgroundColor` controls the background.
- [ ] **B14.** Variables in `_draw()` are NOT accessible from sub-methods. Use `this._prop` for shared state.
- [ ] **B15.** Always include `formatData` in the extend object, even if it's a passthrough.

### vp-create — scaffolding fixes

- [ ] Output viz files to `appserver/static/visualizations/{viz}/`, NOT `default/visualizations/`
- [ ] Build.js output path must be `appserver/static/visualizations/{viz}/visualization.js`
- [ ] `default/visualizations.conf` stays in `default/` (metadata only)

### vp-viz — subagent prompt improvements

- [ ] Include exact `module.exports = SplunkVisualizationBase.extend({...})` template
- [ ] Explicitly state: "NEVER use define() — webpack adds the AMD wrapper"
- [ ] Explicitly state: "NEVER use prototypal constructor pattern"
- [ ] Require `formatData` in every viz
- [ ] Standardize formatter namespace format
- [ ] Include `accentIntensity` as a standard setting

### vp-couture — design brief additions

- [ ] Include `accentIntensity` as a standard formatter setting in every viz
- [ ] Data source definitions must include `"name"` property
- [ ] Document that `backgroundColor: transparent` is the default and vizs must not override it

### ds-create — dashboard generation

- [ ] Always include `"name"` on every data source
