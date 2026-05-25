---
name: vp-viz
description: "Generates Splunk custom visualization code — formatter HTML, Canvas 2D source, and app config. Includes copy-paste templates with correct Splunk-specific syntax for ad-hoc search compatibility."
when_to_use: "Use when building or writing code for custom Splunk vizs. Triggers on 'build viz', 'write visualization', 'create custom viz', 'scaffold viz app', 'formatter template', 'visualization source'."
effort: high
allowed-tools: Read Bash(node *) Bash(head *) Bash(grep *) Bash(chmod *)
---

# vp-viz — build one Splunk custom visualization

> **Prerequisite:** If building a multi-viz pack, load vp-design first for the design brief. For debugging failed vizs, load vp-debug instead.

## STOP — read this first (failed in every test)

**Dashboard Studio viz type is `{app_id}.{viz_name}` — nothing else.**

```
WRONG: "type": "custom"                              ← Classic XML, not DS v2
WRONG: "type": "custom.myapp.myviz"                  ← No custom. prefix
WRONG: "type": "splunk.custom.myapp.myviz"           ← No splunk.custom. prefix
WRONG: "type": "custom", "customVizId": "myapp.myviz" ← Not a thing in DS v2

RIGHT: "type": "myapp.myviz"                         ← Just app_id.viz_name
```

This has failed in test25 AND test26. Splunk's training data uses the old `"type": "custom"` format from Classic Simple XML. Dashboard Studio v2 uses `"type": "{app_id}.{viz_name}"` directly.

**Dashboard JSON option keys must also be namespaced:**
```
WRONG: "options": { "scoreField": "score" }
RIGHT: "options": { "myapp.myviz.scoreField": "score" }
```

**Extension API exception:** When format=extension, config.json uses bare option names (no namespace prefix) and Dashboard Studio reads them directly. The VIZ_NAMESPACE and namespace rules above apply to Classic format only.

## Workflow

```
1. Read conf templates    → references/conf-templates.md
2. Read theme template    → references/theme-template.md
3. Write formatter.html   → use EXACT templates in this file
4. Write source JS        → use EXACT template in this file
5. Build (flat AMD)       → node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js
6. Validate and fix (max 2 iterations):
   1. Run: bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
   2. If XFILE or D08 failures: read the error output, identify which viz + which control is missing
   3. Edit the failing viz's visualization_source.js to add the missing opt() call
   4. Run: node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js /path/to/app
   5. Re-run: bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
   6. If still failing after 2 iterations, report the remaining failures and continue to vp-create
7. Package                → see vp-create
```

### Format-conditional workflow

**If format=extension** (from visual language):
1. Read conf templates    → references/conf-templates.md (app.conf only — no visualizations.conf formatter_app_name)
2. Read theme template    → references/theme-template.md (same)
3. Write config.json      → use references/config-json-template.md (replaces formatter.html)
4. Write visualization.js → use references/visualization-js-template.md (ESM, replaces visualization_source.js)
   Put source in visualizations/{viz}/src/visualization.js
5. Write build.mjs        → MUST LOAD before writing: [references/build-mjs-template.md](references/build-mjs-template.md). Copy the template verbatim, fill {{APP_ID}}, write to app root. Skip build_flat.js — Extension uses node build.mjs (run by vp-create).
6. Write package.mjs      → MUST LOAD before writing: [references/package-mjs-template.md](references/package-mjs-template.md). Copy the template verbatim, fill {{APP_ID}}, {{ACCENT_HEX}}, {{PRIMARY_HEX}}/{{SECONDARY_HEX}}/{{TERTIARY_HEX}}, write to app root. This handles app.conf, visualizations.conf (bare stanzas), preview.png, and .spl tarball.
7. Validate and fix (same loop, different checks — see Phase 31)
8. Package → see vp-create

**If format=classic** (default): follow the workflow above unchanged.

## Pre-code checklist — MUST READ before writing any code

**Read [references/pre-code-checklist.md](references/pre-code-checklist.md)** — 43 items covering formatter syntax, JS patterns, accent/series roles, auto-field discovery, dashboard JSON, and mandatory interactivity. Verify every item before writing visualization_source.js or formatter.html.

```
CRITICAL SUBSET (12 most-failed rules):
□ JS: first line MUST be: // @viz-type: <type> (kpi, gauge, bars, grid, line, timeline, radar, progress, scatter, network)
□ Formatter: {{VIZ_NAMESPACE}}.key in ALL name= attrs — NEVER hardcoded namespace
□ JS: pure ES5 — no const/let/arrow/template literals
□ JS: hexFromSplunk() wraps ALL color picker reads (Splunk returns integers, not hex)
□ JS accent role: t.accent ONLY for hover/glow/selection. Data fills use getSeriesColor(i, t)
□ JS: safeStr()/safeNum() on ALL row field reads + formatData returns fields: data.fields
□ JS: every viz has _onClick with hit-test + this.drilldown({action: FIELD_VALUE_DRILLDOWN, field: this._clickField, value: clickedVal}). Simple vizs (KPI, gauge): whole-canvas click, no hit-test needed.
□ Dashboard JSON type: {app_id}.{viz_name} — NEVER custom.* or splunk.custom.*
□ JS light theme: hero text uses t.text, NEVER t.textDim (ghost-text bug)
□ Formatter: minimum 10 controls, themeMode defaults to "auto"
□ JS: require()/module.exports — NEVER define()
□ JS animation: showEntrance MUST drive an rAF entrance loop that checks this._entranceDone — toggling Off sets this._entranceDone=true immediately. flashCritical MUST drive a setInterval pulse loop. animationSpeed MUST scale the duration/interval: slow=1.5x, normal=1.0x, fast=0.6x. These are NOT optional — a formatter control with no JS effect is a broken control. (AF-01: helper functions must NOT call opt() — pass computed values as parameters; see animation-recipes.md)
□ JS light theme contrast: after writing theme.js LIGHT object, verify hero value color is t.text (full opacity) — NEVER textFaint or textDim for hero values. If it looks "ghostly" in light mode, replace with t.text. (See: feedback_light_theme_contrast.md)
```

**Full checklist (43 items):** [references/pre-code-checklist.md](references/pre-code-checklist.md)

The checklist includes an Extension API section — read it when format=extension to skip Classic-only items and follow Extension-specific rules.

## Conf templates

Read the complete templates in [references/conf-templates.md](references/conf-templates.md) before writing any conf file. Key rules:

- `app.conf`: 5 stanzas, `is_configured = 0`
- `visualizations.conf`: MUST have `allow_user_selection = true` + `disabled = 0`
- `inputlookup` uses FILENAME, not transforms.conf stanza. Prefix with pack ID.

## Theme template

Read [references/theme-template.md](references/theme-template.md) for the complete theme.js with all function bodies implemented.

Light theme is NOT an inversion of dark — design independently. Hero values MUST use full `t.text` color (never textDim/textFaint).

## Formatter HTML — COPY THESE EXACTLY

These templates have the exact syntax Splunk requires. Copy them and fill in only the `{FILL}` parts. Getting ANY attribute wrong causes silent failures.

### Text input

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-text-input name="{{VIZ_NAMESPACE}}.{FILL}" value="{FILL}">
    </splunk-text-input>
</splunk-control-group>
```

### Radio toggle

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.{FILL}" value="{FILL}">
        <option value="true">{FILL}</option>
        <option value="false">{FILL}</option>
    </splunk-radio-input>
</splunk-control-group>
```

### Color picker (MUST have type="custom")

```html
<splunk-control-group label="{FILL}" help="{FILL}">
    <splunk-color-picker name="{{VIZ_NAMESPACE}}.{FILL}" type="custom" value="{FILL}">
        <splunk-color>{FILL}</splunk-color>
        <splunk-color>{FILL}</splunk-color>
    </splunk-color-picker>
</splunk-control-group>
```

### Theme selector (MUST default to "auto")

```html
<splunk-control-group label="Theme" help="Auto detects dashboard theme">
    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">
        <option value="auto">Auto</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
    </splunk-radio-input>
</splunk-control-group>
```

### Section wrapper

```html
<form class="splunk-formatter-section" section-label="{FILL}">
    <!-- controls here -->
</form>
```

### WRONG patterns — broken if you see these

```
WRONG: name="myapp.myviz.field"       → MUST be name="{{VIZ_NAMESPACE}}.field"
WRONG: default="value"                 → MUST be value="value"
WRONG: <splunk-color-picker value=     → MUST add type="custom"
WRONG: <form>                          → MUST add class="splunk-formatter-section" section-label="..."
WRONG: themeMode value="dark"          → MUST be value="auto"
```

### Formatter structure

Every viz gets a minimum of 3 sections:
1. **NO Data configurations section for most vizs** — field binding via `formatData()` colIdx map (per D-01). Only single-value/generic table get one optional field input.
2. **Data display** — labels, units, toggles, decimals
3. **Color and style** — themeMode, series color pickers (1-5), seriesColorsOverflow, fieldColorMap, accentIntensity
4. **Effects** — individual mood effect toggles (showAmbientLight, showVignette, showGlow, showGlassPanel)

Minimum 10 controls. See formatter-patterns.md for the 3-section full example and data binding note.

### Per-viz option derivation (CFG-08)

Consult viz-blueprints.md Settings: list for the viz type being generated. Use it as a GUIDE, not a minimum:
- Always include: themeMode, accentIntensity (universal pair — Phase 18: accentColor removed from formatter, use series color pickers)
- Add type-specific controls from the blueprint (field names, zone thresholds, maxRows, etc.)
- Add 1-2 brand-specific options if the brand brief suggests them
- Drop blueprint options that don't apply to this brand's data
- Target 10-14 total controls
- Phase 18: series color pickers (backgroundColor, fontColor, series1-5Color, seriesColorsOverflow, fieldColorMap) are the correct color controls — see formatter-patterns.md

## visualization_source.js — COMPLETE TEMPLATE

Copy this entire template. Fill in `{FILL}` markers. Every pattern is load-bearing.

```javascript
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function hexFromSplunk(val, fallback) {
    if (val == null || val === '') return fallback;
    var s = String(val).trim();
    if (s.charAt(0) === '#') return s;
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6);
    return fallback;
}

function detectTheme() {
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('dark')) return 'dark';
        if (body.classList.contains('light')) return 'light';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

// Two-path config lookup — checks namespaced key first, falls back to short key (see formatter-patterns.md)
function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('{FILL: app-name}-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
        });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return null;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = (function(viz) { try { var i = viz.getPropertyNamespaceInfo(); return i && i.propertyNamespace ? i.propertyNamespace : ''; } catch(e) { return ''; } })(this);
        function opt(key, fallback) { return getOption(config, ns, key, fallback); }

        // {FILL: read settings — defaults MUST match formatter value= attrs}
        var valueField = opt('{FILL}', '{FILL}');

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        // ACC-03: accentIntensity /100 UNCAPPED multiplier -- 0=off, 0.5=default, 1.0=full, >1.0=extreme
        // DO NOT clamp gi to 1.0 — values above 100 are intentional for extreme glow
        // WRONG: gi = gi < 0 ? 0 : gi > 1 ? 1 : gi  ← NEVER cap at 1
        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;  // floor at 0, NO ceiling — user can set 200, 500, etc.
        // THM-03: reduce glow on light theme
        var glowScale = isDark ? 1.0 : 0.4;
        // Apply: ctx.shadowBlur = 20 * gi * glowScale; ctx.shadowColor = theme.withAlpha(accent, gi * glowScale);
        // Always reset after glow: ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi || t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        // {FILL: read data with safeStr/safeNum}
        // {FILL: Canvas 2D drawing code}
        // Remember: ctx.globalAlpha = 1 before drawing text
        // Remember: measureText() before positioning
        // Remember: Math.max(floor, h * ratio) for font sizes
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        // {FILL: hit-test logic + tooltip positioning}
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        // {FILL: clear any setInterval/setTimeout timers}
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
```

## Demo data — CSV lookups

Use lookups, NOT `makeresults` with `random()`.

```spl
| inputlookup {{PACK_ID}}_demo_kpis.csv
```

Prefix ALL filenames with pack ID. The `inputlookup` command uses the FILENAME, not the transforms.conf stanza name.

## visualization.css

```css
.{FILL: app-name}-viz {
    background: transparent;
}
```

See STOP section above for all three namespace formats and Dashboard JSON option key format.

## Quick rules — the 15 that matter most

1. **ES5 only** — no const, let, arrow, template literals, destructuring
2. **require()/module.exports** — NEVER define(). build_flat.js adds the AMD wrapper.
3. **extend({...}) object literal** — NEVER prototypal constructors
4. **ROW_MAJOR_OUTPUT_MODE** — in getInitialDataParams as a METHOD
5. **clearRect** — NEVER fillRect with background color
6. **clientWidth/clientHeight** — NEVER getBoundingClientRect for canvas sizing
7. **value=** — NEVER default= on formatter inputs
8. **type="custom"** — REQUIRED on every splunk-color-picker
9. **No jQuery** — this.$el doesn't exist in Dashboard Studio v2
10. **Tarball = ONE top-level directory** — `tar tzf app.tar.gz | head -1` must show `app_name/`. Package from the PARENT directory with the app dir as the only argument.
11. **Color picker values can be integers** — Splunk returns `6511615` not `"#635BFF"`. Use `hexFromSplunk(val, fallback)` on ALL color picker reads.
12. **Dashboard options = only overrides** — never duplicate formatter defaults in dashboard JSON `"options"`. If a value matches the formatter `value=`, omit it.
13. **preview.png** — generated by `python3 generate_previews.py <app_dir>` (116x76 RGB, Pillow path); JS fallback via `node generate_assets.js <app_dir> --legacy-previews`. Run post-build, pre-validate. See vp-create Step 3b.
14. **Event handler fields from config** — `_onClick` and `_onMouseMove` MUST read field names from instance properties set in `updateView`, NEVER hardcode string literals like `'location'` or `'attack_id'`.
15. **Drilldown tokens must be consumed** — if you setToken, a search MUST reference it. Always set a default token value (e.g. `"*"`) so the dashboard works before any click. Load `vp-create/references/dashboard-interactivity.md` for full patterns. (per INT-01/INT-03)

## Build and validate

```bash
# Build all vizs (flat AMD — inlines theme.js)
node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js /path/to/app

# Validate (MUST pass before packaging)
bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
```

CRITICAL: Run validation after every build. Do not skip. Fix all failures before packaging.

## References — read on demand

### MUST-LOAD for every viz (universal design rules)

- **[Design principles](../../vp-design/references/design-principles.md)** — DPR-01 through DPR-10, Canvas API mappings, FAIL code annotations. Load before writing _render().
- **[Consistency grid](../../vp-design/references/consistency-grid.md)** — CON-01 through CON-05 formulas, getSpacing/getTypoScale/getHoverAlpha usage, CON-CHECK compliance checklist.
- **[Animation recipes](../../vp-recipes/references/animation-recipes.md)** — ANI-01 through ANI-06: rAF entrance, LED pulse, hover easing, stagger patterns, prefers-reduced-motion. Load before writing updateView() animation logic.

### Load based on mood (from Visual Language output)

- **[Depth recipes](../../vp-recipes/references/depth-recipes.md)** — gradients, ambient light, vignette, gradient mesh, accent lines. Load for: dark theme, Futuristic, Luxury, Precision, Power mood.
- **[Texture recipes](../../vp-recipes/references/texture-recipes.md)** — noise grain, glass panels, tinted neutrals. Load for: Organic, Luxury mood.
- **[Typography recipes](../../vp-recipes/references/typography-recipes.md)** — 3-tier hierarchy, cinematic letter spacing, measureText-before-draw. Load for: all vizs with text labels (nearly always).

### Other references

- **[Viz blueprints](references/viz-blueprints.md)** — 15 viz types with creative direction + data contracts (includes DPR cross-references)
- **[Auto-field patterns](references/auto-field-patterns.md)** — per-viz-type auto-field discovery: RESERVED exclusion, isNumericCol, three-tier resolver, multi-series color assignment
- **[Canvas recipes](references/canvas-recipes.md)** — tooltip, drilldown, color math, grid layout, shape primitives
- **[Conf templates](references/conf-templates.md)** — app.conf, visualizations.conf, default.meta, transforms.conf
- **[Theme template](references/theme-template.md)** — complete theme.js with getSpacing, getTypoScale, getHoverAlpha
- **[Edge cases](references/edge-cases.md)** — MUST-READ for step 5: empty state, pagination, safeStr/safeNum discipline, ctx.save/restore. ECR-01 through ECR-05.

## Light theme verification

Every viz MUST be tested in both dark and light theme. Light theme is NOT dark-inverted — it needs independent design.

**How to verify:**
1. In formatter panel: set themeMode to "light"
2. **D-08 STRUCTURAL CHECK:** hero values MUST use `t.text`. grep for `t\.textDim` near the hero draw call — if found, that is the ghost-text bug. Fix before proceeding.
3. Check: panel backgrounds use `t.panel` (light grey, not white-on-white)
4. Check: accents still have ≥4.5:1 contrast against light bg
5. Check: glows and shadows are reduced (dark-mode glow overpowers on light)

**Common light-theme bugs:**
- Text disappears (textDim on white bg = ~4% visible)
- Accent too bright (saturated colors that work on dark wash out on light)
- Grid lines invisible (using withAlpha at 0.1 on white)

If the viz only looks good in dark, the light theme tokens in theme.js need adjustment.

## Unique rendering per brand

Do NOT copy viz source between brands and swap colors. Each brand gets unique `_render()` code. The blueprints above are STARTING POINTS — study the brand's design language, then write Canvas code that matches THAT.

Inside `_render()`, you have a Canvas 2D context with zero constraints. You can draw anything a browser can render.

**Default stance:** be AMBITIOUS. A safe, generic viz is worse than a bold viz that makes someone say "wait, that's Splunk?"

Apply the Visual Language schema from vp-design:
- cornerRadius → rx argument in roundRect() or manual arc-corner approximation (sharp=0, medium=5, round=12)
- fillTechnique → createLinearGradient() for gradient; ctx.fillStyle=hex for flat; hatching pattern for textured
- spacing → multiply base padding/gap by: tight=0.7, balanced=1.0, airy=1.4
- Two brands serving the same data MUST differ in BOTH shape vocabulary AND layout algorithm — a Stripe KPI and a Patagonia KPI should look like different components from different design systems.

## STOP — after all vizs are written

**DO NOT report the task as complete.** You MUST now load and follow **vp-create** to build, validate, generate the dashboard, and package the tarball. The viz pack is NOT done until vp-create Step 3c (mandatory dashboard) completes and the tarball is verified.

Load vp-create now. Do not skip this step.
