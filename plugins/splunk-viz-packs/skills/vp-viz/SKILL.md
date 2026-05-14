---
name: vp-viz
description: "Generates Splunk custom visualization code — formatter HTML, Canvas 2D source, and app config. Includes copy-paste templates with correct Splunk-specific syntax for ad-hoc search compatibility."
when_to_use: "Use when building or writing code for custom Splunk vizs. Triggers on 'build viz', 'write visualization', 'create custom viz', 'scaffold viz app', 'formatter template', 'visualization source'."
effort: high
allowed-tools: Read Bash(node *) Bash(head *) Bash(grep *) Bash(chmod *)
---

# vp-viz — build one Splunk custom visualization

> **Prerequisite:** If building a multi-viz pack, load vp-couture first for the design brief. For debugging failed vizs, load vp-ref-gotchas instead.

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

## Workflow

```
1. Read conf templates    → references/conf-templates.md
2. Read theme template    → references/theme-template.md
3. Write formatter.html   → use EXACT templates in this file
4. Write source JS        → use EXACT template in this file
5. Build (flat AMD)       → node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js
6. Validate               → bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh
7. Fix any failures       → re-run steps 3-6
8. Package                → see vp-create
```

## Pre-code checklist — verify EVERY item before writing code

```
□ Viz files in appserver/static/visualizations/{viz}/ — NEVER default/visualizations/
□ Formatter: {{VIZ_NAMESPACE}}.key in ALL name= attributes
□ Formatter: value= on all inputs (NEVER default=)
□ Formatter: type="custom" on every <splunk-color-picker>
□ Formatter: class="splunk-formatter-section" section-label="..." on every <form>
□ Formatter: themeMode defaults to "auto" (NEVER "dark")
□ Formatter: minimum 7 controls
□ JS: require()/module.exports — NEVER define()
□ JS: SplunkVisualizationBase.extend({...}) object literal
□ JS: safeStr()/safeNum() on all row field reads
□ JS: detectTheme() for auto theme detection
□ JS: clientWidth/clientHeight — NEVER getBoundingClientRect for sizing
□ JS: clearRect for background — NEVER fillRect
□ JS: ctx.globalAlpha = 1 before drawing text (reset after glow effects)
□ JS: measureText() before positioning text (prevent overflow)
□ JS: Math.max(floor, h * ratio) for font sizes — NO upper pixel cap
□ JS: ROW_MAJOR_OUTPUT_MODE in getInitialDataParams
□ JS: pure ES5 — no const/let/arrow/template literals
□ Dashboard JSON type: {app_id}.{viz_name} — NEVER custom.* or splunk.custom.*
□ Dashboard JSON options: {app_id}.{viz_name}.key — NEVER bare key names
□ Dashboard data sources: every ds.search has "name" field
□ Tables: sort ALL columns, pagination with maxRows, hiddenColumns, columnWidths
□ Event handlers: field names from config properties, NEVER hardcoded strings
□ Drilldown tokens: setToken → search consumes it → default value set
□ Tarball: ONE top-level directory only — package from parent dir
```

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

Every viz gets 3 sections:
1. **Data configurations** — field name mappings (text inputs)
2. **Data display** — labels, units, toggles, decimals
3. **Color and style** — themeMode, accentColor, series colors, accentIntensity

Minimum 7 controls for simple vizs, 10+ for complex.

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
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = this.getPropertyNamespaceInfo().propertyNamespace;
        function opt(key, fallback) {
            var v = config[ns + key];
            return (v != null && v !== '') ? v : fallback;
        }

        // {FILL: read settings — defaults MUST match formatter value= attrs}
        var valueField = opt('{FILL}', '{FILL}');

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

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

## Three namespace formats — get ANY wrong and settings silently fail

| Context | Format | Example |
|---|---|---|
| **formatter.html** | `{{VIZ_NAMESPACE}}.key` | `name="{{VIZ_NAMESPACE}}.scoreField"` |
| **Dashboard JSON options** | `{app_id}.{viz_name}.key` | `"myapp.myviz.scoreField": "score"` |
| **savedsearches.conf** | `display.visualizations.custom.{app_id}.{viz_name}.key` | `display.visualizations.custom.myapp.myviz.scoreField = score` |

```json
WRONG — bare option names (settings never reach the viz):
"options": {
    "scoreField": "score",
    "accentColor": "#0077B6"
}

RIGHT — namespaced options (settings delivered to updateView):
"options": {
    "myapp.myviz.scoreField": "score",
    "myapp.myviz.accentColor": "#0077B6"
}
```

## Quick rules — the 17 that matter most

1. **ES5 only** — no const, let, arrow, template literals, destructuring
2. **require()/module.exports** — NEVER define(). build_flat.js adds the AMD wrapper.
3. **extend({...}) object literal** — NEVER prototypal constructors
4. **ROW_MAJOR_OUTPUT_MODE** — in getInitialDataParams as a METHOD
5. **clearRect** — NEVER fillRect with background color
6. **clientWidth/clientHeight** — NEVER getBoundingClientRect for canvas sizing
7. **{{VIZ_NAMESPACE}}** — NEVER hardcode app.viz namespace in formatter
8. **value=** — NEVER default= on formatter inputs
9. **type="custom"** — REQUIRED on every splunk-color-picker
10. **No jQuery** — this.$el doesn't exist in Dashboard Studio v2
11. **Dashboard type = `{app_id}.{viz_name}`** — NEVER `custom.{app_id}.{viz_name}` or `splunk.custom.*`. The format is EXACTLY `app_id.viz_name`, nothing else.
12. **Tarball = ONE top-level directory** — `tar tzf app.tar.gz | head -1` must show `app_name/`. Package from the PARENT directory with the app dir as the only argument.
13. **Color picker values can be integers** — Splunk returns `6511615` not `"#635BFF"`. Use `hexFromSplunk(val, fallback)` on ALL color picker reads.
14. **Dashboard options = only overrides** — never duplicate formatter defaults in dashboard JSON `"options"`. If a value matches the formatter `value=`, omit it.
15. **preview.png in every viz** — 250x150 real PNG with a simplified viz silhouette (not solid color, not 1x1). Generate via Pillow after build.
16. **Event handler fields from config** — `_onClick` and `_onMouseMove` MUST read field names from instance properties set in `updateView`, NEVER hardcode string literals like `'location'` or `'attack_id'`.
17. **Drilldown tokens must be consumed** — if you setToken, a search MUST reference it. Always set a default token value (e.g. `"*"`) so the dashboard works before any click.

## Build and validate

```bash
# Build all vizs (flat AMD — inlines theme.js)
node ${CLAUDE_SKILL_DIR}/scripts/build_flat.js /path/to/app

# Validate (MUST pass before packaging)
bash ${CLAUDE_SKILL_DIR}/scripts/validate_viz.sh /path/to/app
```

CRITICAL: Run validation after every build. Do not skip. Fix all failures before packaging.

## References — read on demand

- **[Viz blueprints](references/viz-blueprints.md)** — 15 viz types with creative direction + data contracts
- **[Canvas recipes](references/canvas-recipes.md)** — tooltip, drilldown, animation, color math, grid layout
- **[Conf templates](references/conf-templates.md)** — app.conf, visualizations.conf, default.meta, transforms.conf
- **[Theme template](references/theme-template.md)** — complete theme.js with all function implementations

## Unique rendering per brand

Do NOT copy viz source between brands and swap colors. Each brand gets unique `_render()` code. The blueprints above are STARTING POINTS — study the brand's design language, then write Canvas code that matches THAT.

Inside `_render()`, you have a Canvas 2D context with zero constraints. You can draw anything a browser can render.

**Default stance:** be AMBITIOUS. A safe, generic viz is worse than a bold viz that makes someone say "wait, that's Splunk?"
