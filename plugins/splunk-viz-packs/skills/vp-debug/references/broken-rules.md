## BROKEN — renders but wrong

### Contents
- B1: Canvas font rendering requires explicit wait
- B2: HiDPI canvas scaling is mandatory
- B3: getOption helper is mandatory
- B4: Never read config in formatData
- B5: Formatter section labels + type="custom" on color picker
- B6: Canvas shadow state leaks
- B7: JS defaults must match formatter value= (NEVER default=)
- B8: Auto-scale + gauge arc constraint + no upper font cap
- B9: Dashboard Studio type format ({app}.{viz})
- B10: Option namespace — three formats for three contexts
- B11: parseFloat truncates string values
- B12: Gauge colors must match brand
- B13: Canvas background must use clearRect
- B14: Variables in _draw() not accessible from sub-methods
- B15: Always include formatData in extend object
- B16: Every visual property configurable via formatter
- B17: setupCanvas MUST use this.el with clientWidth
- B18: Theme auto-detect via getCurrentTheme()
- B19: new Date() fails in sandboxed iframe
- B20: Theme MUST default to 'auto' with detectTheme()
- B21: Always null-guard before String() conversion
- B22: hexFromSplunk — color picker returns integers not hex
- B23: Light theme needs independent design, not dark inversion

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
- `<splunk-color-picker>` MUST have `type="custom"` — without it,
  Splunk ignores the `value=` attribute and uses its own default
  palette. Color changes won't take effect in ad-hoc search.

```html
<!-- WRONG — color picker ignores value, uses Splunk default blue -->
<splunk-color-picker name="..." value="#FF8000">

<!-- RIGHT — type="custom" enables value= and custom swatches -->
<splunk-color-picker name="..." type="custom" value="#FF8000">
    <splunk-color>#FF8000</splunk-color>
```

### B6. Canvas shadow state leaks

Shadow settings persist across draw calls. Always reset after use:

```javascript
ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
```

### B7. JS defaults must match formatter HTML defaults — NEVER empty

**Use `value=`, NEVER `default=`.** Splunk formatter components use the
`value` attribute for the initial/default value. `default` is NOT the
correct attribute — settings will appear empty in the Format panel.

```html
<!-- WRONG — settings appear empty, nothing happens when user opens Format -->
<splunk-text-input name="myapp.myviz.field" default="driver">
<splunk-radio-input name="myapp.myviz.theme" default="dark">

<!-- RIGHT — settings show their values immediately -->
<splunk-text-input name="myapp.myviz.field" value="driver">
<splunk-radio-input name="myapp.myviz.theme" value="dark">
```

Splunk does NOT send formatter defaults on first load. If your JS
default for `accentColor` is `#06B6D4` but the formatter says
`value="#FF0000"`, the viz renders with cyan until the user touches
the color picker — then it jumps to red. Always keep them in sync.

**CRITICAL: Field name settings MUST have non-empty defaults.**
In ad-hoc search, the formatter shows ALL settings to the user. If
field settings have `value=""`, the viz has no idea which SPL columns
to read — it renders blank or broken. The defaults must match the
expected field names from the demo data CSV.

```html
<!-- WRONG — viz renders blank in ad-hoc search, fields show empty -->
<splunk-text-input name="{{VIZ_NAMESPACE}}.trackField" value="">
<splunk-text-input name="{{VIZ_NAMESPACE}}.artistField" value="">

<!-- RIGHT — defaults match demo CSV columns, viz works immediately -->
<splunk-text-input name="{{VIZ_NAMESPACE}}.trackField" value="track_name">
<splunk-text-input name="{{VIZ_NAMESPACE}}.artistField" value="artist">
```

**Rule:** EVERY formatter setting must have a `value="..."` that
matches the JS `getOption()` fallback. Field name settings must
default to the demo CSV column names. Color settings must default to
the theme accent. Toggle settings must default to their JS fallback.
No empty `value=""` on ANY setting except free-text labels.

### B8. Auto-scale by default, explicit override at non-zero

NEVER hardcode pixel constants in `_render()`. Vizs must adapt to any
panel size — from 200×150 (compact tile) to 800×600 (full panel).

```javascript
// WRONG — breaks at every size except the one you tested
var ROW_H = 24;
var LABEL_W = 100;
var PAD = 12;
var FONT_SIZE = 14;

// RIGHT — scale from container dimensions
var pad = Math.round(w * 0.03);
var rowH = Math.max(16, Math.floor((h - headerH - footerH) / rowCount) - gap);
var labelW = Math.round(w * 0.25);
var fontSize = Math.max(8, Math.round(rowH * 0.45));
```

**Scaling formulas per viz type:**

| Viz type | Element | Formula | Floor |
|---|---|---|---|
| KPI tile | Value font | `h * 0.35` (normal), `h * 0.45` (hero) | 18px / 28px |
| KPI tile | Label font | `h * 0.08` | 7px |
| KPI tile | Padding | `w * 0.06` | 8px |
| Gauge | Radius | `Math.min(w, h) * 0.38` | 30px |
| Gauge | Tick font | `radius * 0.06` | 8px |
| Bar/timeline | Row height | `(availH - legendH) / rowCount - gap` | 16px |
| Bar/timeline | Label width | Measure longest label + 16px | 40px |
| Table | Column width | `panelWidth / colCount` (proportional) | 50px |
| Table | Row height | `Math.max(20, (availH - headerH) / visibleRows)` | 20px |
| Any | Font size | Scale from container, `Math.max(floor, calculated)` | 8px |

**The pattern:** every size = `Math.max(floor, containerDimension * ratio)`.
The floor prevents unreadable text. The ratio adapts to the panel.

**Font scaling MUST use floor only, NEVER an upper cap:**

```javascript
// WRONG — caps at 36px, doesn't scale to large panels
var fontSize = Math.max(12, Math.min(36, h * 0.28));

// CORRECT — floor prevents unreadable, no cap allows growth
var fontSize = Math.max(14, h * 0.30);
```

Upper caps were historically added to prevent overflow, but the correct
fix is to use a smaller ratio, not a pixel cap. Caps break responsive
scaling — a 700px-tall panel renders tiny text identical to a 130px panel.

**Exception:** if a viz has multiple text elements that must coexist
(value + label + sparkline), use proportional ratios that sum to < 1.0
of the available height. No element gets a pixel cap.

**Gauge / arc viz layout constraint:**

Radius and center Y are COUPLED — never calculate them independently.

```javascript
var pad    = Math.max(12, Math.min(w, h) * 0.06);
var maxR_w = (w - pad * 2) / 2;
var maxR_h = (h - pad) * 0.55;
var radius = Math.min(maxR_w, maxR_h);
var cx     = w / 2;
var cy     = pad + radius + arcThick / 2;

// INVARIANT: cy - radius >= pad (arc never overflows top)
```

**WRONG** — independent calculations that overflow:
```javascript
var radius = Math.min(w * 0.42, h * 0.70);  // at w=904,h=318: r=223
var cy = h * 0.62;                            // cy=197, top = 197-223 = -26px!
```

**For user-overridable sizes:** `0` = auto-scale (default), positive value
= explicit override:
```javascript
var userSize = parseInt(getOption(config, ns, 'iconSize', '0'), 10);
var iconSize;
if (userSize > 0) {
    iconSize = userSize;
} else {
    iconSize = Math.max(16, Math.min(200, Math.min(w, h) * 0.6));
}
```

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

**Common mistake — using savedsearches.conf format in formatter.html:**
```html
<!-- WRONG — long prefix, Splunk never reads this setting -->
<splunk-text-input name="display.visualizations.custom.myapp.myviz.field" default="value">

<!-- RIGHT — short format matches Dashboard Studio JSON -->
<splunk-text-input name="myapp.myviz.field" default="value">
```

Dashboard Studio JSON and formatter.html both use the SHORT format
(`{app}.{viz}.key`). Only savedsearches.conf uses the long prefix.

**CRITICAL: formatter.html MUST use `{{VIZ_NAMESPACE}}`, NEVER hardcoded names.**

```html
<!-- WRONG — settings silently fail, don't save, don't reach updateView -->
<splunk-text-input name="myapp.myviz.field" value="driver">

<!-- RIGHT — Splunk resolves the namespace at runtime -->
<splunk-text-input name="{{VIZ_NAMESPACE}}.field" value="driver">
```

`{{VIZ_NAMESPACE}}` is a Splunk template variable replaced at runtime.
Hardcoded names bypass Splunk's internal registration — settings appear
in the Format panel but changes are never saved to the dashboard XML
and never delivered to `updateView()` config. This was confirmed across
8 test builds: switching from hardcoded to `{{VIZ_NAMESPACE}}` fixed
the issue immediately.

**This applies to ALL formatter components:** `splunk-text-input`,
`splunk-radio-input`, `splunk-color-picker`, `splunk-select`.

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

### B16. Every visual property should be configurable via formatter

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

### B17. setupCanvas MUST use this.el with clientWidth/clientHeight

NEVER create wrapper divs. NEVER set width/height on `this.el`.
NEVER use `getBoundingClientRect()` for canvas sizing.

```javascript
// WRONG — all of these produce wrong dimensions:

// 1. Wrapper div has no computed height yet
var wrap = document.createElement('div');
this.el.appendChild(wrap);
theme.setupCanvas(wrap);              // h = 0 or tiny

// 2. Breaks Splunk framework-managed sizing
this.el.style.width = '100%';
this.el.style.height = '100%';

// 3. Returns unreliable fractional/transitional values during layout
var rect = this.el.getBoundingClientRect();

// CORRECT — use this.el directly with clientWidth/clientHeight:
this.el.style.position = 'relative';
this.el.style.overflow = 'hidden';
// DO NOT set width/height — Splunk manages these

var w = this.el.clientWidth || this.el.offsetWidth
        || window.innerWidth || 300;
var h = this.el.clientHeight || this.el.offsetHeight
        || window.innerHeight || 200;
if (w < 10) w = window.innerWidth || 300;
if (h < 10) h = window.innerHeight || 200;
```

`window.innerWidth`/`innerHeight` are the iframe viewport dimensions
— they always match the panel size in Dashboard Studio and serve
as a reliable fallback when `clientWidth` returns 0 during layout.

Canvas element style must be `position:absolute;top:0;left:0;` to
fill the container without affecting its measured dimensions.

**Corollary:** either let `setupCanvas` create the canvas in `updateView`,
OR create it manually in `initialize` — not both. If you create it
manually, don't call `setupCanvas` at all.

### B18. Theme MUST auto-detect — no theme radio in formatter

Custom vizs render in TWO contexts: Dashboard Studio (dark or light
canvas) and ad-hoc search (page theme, usually light). A `theme`
radio in the formatter with `value="dark"` breaks ad-hoc search because
Splunk sends "dark" as the default — the viz renders dark text on a
white background, invisible.

**The correct pattern (from production vizs line_trend_chart, infographic_shapes):**

Do NOT add a theme radio to the formatter. Instead, auto-detect:

```javascript
// In _render() — detect page theme, no formatter setting needed (B18)
var isDark = true;
try {
    isDark = SplunkVisualizationUtils.getCurrentTheme() !== 'light';
} catch (e) {}

// Use isDark to pick colors
var textColor = isDark ? t.text : t.textDark;
var gridColor = isDark ? t.grid : t.gridLight;
var panelBg   = isDark ? t.panel : t.panelLight;
```

**Why no theme radio?**
- In Dashboard Studio: the dashboard sets the theme at canvas level.
  The viz should respect that, not override it.
- In ad-hoc search: the page theme determines dark/light. The viz
  should match automatically.
- A theme radio ALWAYS has a default value. That default ALWAYS
  conflicts with one context.

**theme.js must define BOTH dark and light tokens:**
```javascript
var DARK = { text: '#E8E8E8', panel: '#141519', grid: 'rgba(255,255,255,0.08)' };
var LIGHT = { text: '#1A1A2E', panel: '#FFFFFF', grid: 'rgba(0,0,0,0.08)' };
```

**In _render(), select theme based on auto-detection:**
```javascript
var isDark = true;
try { isDark = SplunkVisualizationUtils.getCurrentTheme() !== 'light'; } catch(e) {}
var t = isDark ? theme.DARK : theme.LIGHT;
```

**Alternative pattern (infographic_shapes):** Make ALL colors
user-configurable via formatter. No theme detection needed — the user
picks colors that work on their background. Best for decorative vizs
where every color is a design choice.

### B19. new Date() MUST NOT be used for string parsing in viz code

The custom viz iframe has `src="about:srcdoc"` and origin `null`.
The `Date` constructor silently fails for ISO 8601 strings in this
context, returning `Invalid Date` or epoch 0.

```javascript
// WRONG — returns Invalid Date in Splunk iframe
var d = new Date("2026-05-13T08:42:00");
var label = d.toLocaleDateString(); // "Invalid Date"

// CORRECT — regex parse for ISO timestamps
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
              'Jul','Aug','Sep','Oct','Nov','Dec'];

function parseTimestamp(s) {
    if (s == null || s === '') return '';
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
        var mon = MONTHS[parseInt(m[2], 10) - 1];
        return mon + ' ' + parseInt(m[3], 10) + ' ' + m[4] + ':' + m[5];
    }
    return String(s);
}
```

For epoch values, `parseFloat(s) + new Date(n * 1000)` works because
epoch is numeric, not string-parsed.

### B20. Vizs MUST auto-detect Splunk dark/light theme via DOM fallback

B18 uses `SplunkVisualizationUtils.getCurrentTheme()` which works in
most contexts. But some iframe configurations don't load Utils, or
the method throws. The formatter MUST default to `'auto'` (NEVER
`'dark'` or `'light'`), and `'auto'` MUST use this DOM detection:

```javascript
function detectTheme() {
    // Try SplunkVisualizationUtils first (B18)
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}

    // DOM fallback
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('light')) return 'light';
        if (body.classList.contains('dark')) return 'dark';
    }

    // Computed background luminance fallback
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}

    return 'dark';
}
```

Every viz formatter MUST offer: `auto | dark | light` (default: `auto`).
When `'auto'`, call `detectTheme()`. When `'dark'` or `'light'`, use
the explicit value.

### B21. Always null-guard field values before String() conversion

Splunk delivers empty CSV fields and missing SPL fields as `null`.
`String(null)` === `"null"` and `String(undefined)` === `"undefined"`.
Both render as visible text on canvas.

```javascript
// WRONG — shows "284.5Knull" when unit field is empty
var unit = String(row[unitIdx]);

// WRONG — shows "undefined" when field is missing
var label = String(row[labelIdx]);

// CORRECT — null/undefined/empty become empty string
function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

var unit = safeStr(row[unitIdx]);
var label = safeStr(row[labelIdx]);
```

Apply this pattern to EVERY field read from row data, not just
unit fields. Label, category, region, and any optional field can
be `null`. Use a `safeStr()` helper to avoid repeating the check.

### B22. hexFromSplunk — color picker returns integers, not hex

Splunk's `splunk-color-picker` stores values as integers in some
contexts. In Dashboard Studio dashboards, `config[ns + 'accentColor']`
may return `"6511615"` instead of `"#635BFF"`.

```javascript
// WRONG — breaks when Splunk sends integer
var color = config[ns + 'accentColor'] || '#635BFF';

// CORRECT — handles both hex and integer formats
var color = hexFromSplunk(config[ns + 'accentColor'], '#635BFF');
```

The `hexFromSplunk()` function (included in the vp-viz JS template)
handles `#hex`, `0xHex`, and integer formats.

**Known limitation (ad-hoc search):** When a viz is used in ad-hoc
search (not a saved dashboard), the color picker value delivery can
differ. In test27 (Stripe), `accentColor` did not work correctly on
`splunk.table` in ad-hoc. If a user reports color settings being
ignored in ad-hoc mode, this is the likely cause. Workaround: ensure
the viz has sensible hardcoded fallback colors that don't depend on
the color picker value.

### B23. Light theme needs independent design, not dark inversion

Light theme is not `s/dark/light/`. Common failures:

- `textDim`/`textFaint` on white bg → ~4% visible, text disappears
- Saturated accents that pop on `#0F0F1A` wash out on `#F5F5F5`
- `withAlpha(color, 0.1)` grid lines invisible on white
- Dark-mode glow (`shadowBlur: 20`) overpowers on light backgrounds

**Rules:**
- Hero values MUST use full `t.text` (never textDim/textFaint)
- Reduce `shadowBlur` by 50% in light theme
- Use `withAlpha(color, 0.15)` minimum for grid lines on light
- Test BOTH themes before shipping — set `themeMode=light` in formatter

