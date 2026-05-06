---
name: vp-viz
description: "Build a single custom Splunk visualization within a themed viz pack. Generates visualization_source.js (Canvas 2D), formatter.html (settings UI), visualization.css, harness.json, and preview.png specification. MUST load vp-ref-gotchas before writing any code. Every viz imports shared/theme.js for design tokens. Use when vp-couture has planned the viz suite and vp-create has scaffolded the app — this skill writes the per-viz source files."
---

# vp-viz — build one visualization

## Critical: unique rendering per brand

**Do NOT copy viz source code between brands and swap colors.** Each
brand gets unique `_render()` code. A Red Bull speed gauge draws
segmented arcs with red zone markings and shift lights. A Disney+
subscriber gauge draws a smooth gradient ring with soft glow. They
share `theme.js` for color tokens but nothing else in the render path.

The blueprints below are STARTING POINTS for inspiration — not
templates to copy verbatim. Study the brand's real-world design
language, then write Canvas code that matches THAT, using theme tokens
for colors only.

**`drawPanel()` is optional.** Some brands want panel chrome (rounded
rects with borders). Others want panels flush with the background
(no chrome, no border). Define this in the design brief.

## When to use

After `vp-create` has scaffolded the app directory and `shared/theme.js`
exists. This skill writes the four files that make one viz work:

1. `src/visualization_source.js` — Canvas 2D rendering
2. `formatter.html` — Splunk settings UI
3. `visualization.css` — container styles (+ base64 fonts if viz-specific)
4. `harness.json` — test harness config with sample data

## Prerequisites

- **MUST load `vp-ref-gotchas`** before writing any code
- App directory exists at `examples/{pack_name}/`
- `shared/theme.js` exists with design tokens
- `_build/webpack.config.js` has this viz as an entry point

## Source file skeleton

Every `visualization_source.js` follows this exact structure. Do not
deviate from the lifecycle method signatures.

```javascript
define([
    'api/SplunkVisualizationBase'
], function(SplunkVisualizationBase) {

    // ── Imports ─────────────────────────────────────────────────
    // theme.js is bundled via webpack resolve alias
    var theme = require('../../shared/theme');

    // ── Helpers ─────────────────────────────────────────────────

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

    // ── Viz-specific helpers ────────────────────────────────────
    // (roundRect, lerpColor, etc. — import from theme.js or define here)

    // ── Visualization ───────────────────────────────────────────

    return SplunkVisualizationBase.extend({
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(
                this, arguments
            );
            this.el.style.overflow = 'hidden';
            var canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            this.el.appendChild(canvas);
            this.canvas = canvas;
            this._lastData = null;
            this._lastConfig = null;
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 50
            };
        },

        formatData: function(data) {
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
        },

        updateView: function(data, config) {
            if (!data) return;
            this._lastData = data;
            this._lastConfig = config;
            this._render(data, config);
        },

        _render: function(data, config) {
            var el = this.el;
            var w = el.offsetWidth;
            var h = el.offsetHeight;
            if (w <= 0 || h <= 0) return;

            var dpr = window.devicePixelRatio || 1;
            var canvas = this.canvas;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            var ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            var ns = getNS(this);
            var t = theme.getTheme(
                getOption(config, ns, 'theme', 'dark')
            );

            // ── DRAW HERE ───────────────────────────────────────
            // All coordinates use w, h (CSS pixels)
            // All colors from t (theme tokens)
            // All settings via getOption(config, ns, 'key', 'default')
        },

        reflow: function() {
            if (this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        },

        destroy: function() {
            SplunkVisualizationBase.prototype.destroy.apply(
                this, arguments
            );
        }
    });
});
```

## Viz type blueprints

Each blueprint shows what to draw in `_render` and what settings to
expose in `formatter.html`. Use theme tokens for all colors.

### Single Value Tile (KPI)

**Draws:** large centered value, under-label, optional delta arrow,
optional micro-sparkline.

**Key render logic:**
```javascript
var valueFontSize = Math.max(14, Math.min(72, Math.min(w, h) * 0.35));
var labelFontSize = Math.max(8, Math.min(20, Math.min(w, h) * 0.09));

ctx.font = 'bold ' + valueFontSize + 'px ' + theme.FONTS.mono;
ctx.fillStyle = valueColor;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(formattedValue, w / 2, h * 0.42);

ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
ctx.fillStyle = t.textDim;
ctx.fillText(label, w / 2, h * 0.68);
```

**Settings:** `field`, `label`, `unit`, `unitPosition`, `valueColor`,
`showDelta`, `deltaField`, `showSparkline`, `sparklineField`, `theme`

**Data contract:** configurable field (default: `value`). Reads last
row. Optional: `delta` field for trend arrow.

### Ring Gauge

**Draws:** arc from startAngle to endAngle, colored by threshold
bands. Center shows value text. Optional tick marks.

**Key render logic:**
```javascript
var cx = w / 2;
var cy = h * 0.55;
var radius = Math.min(w, h) * 0.38;
var lineWidth = radius * 0.18;
var startAngle = Math.PI * 0.75;
var endAngle = Math.PI * 2.25;
var valueAngle = startAngle + (endAngle - startAngle) * (pct / 100);

// Background track
ctx.beginPath();
ctx.arc(cx, cy, radius, startAngle, endAngle);
ctx.strokeStyle = t.edge;
ctx.lineWidth = lineWidth;
ctx.lineCap = 'round';
ctx.stroke();

// Value arc
ctx.beginPath();
ctx.arc(cx, cy, radius, startAngle, valueAngle);
ctx.strokeStyle = arcColor;
ctx.stroke();
```

**Settings:** `field`, `maxValue`, `unit`, `label`, `colorScheme`
(5 presets), `showTicks`, `showGlow`, `displayMode` (arc/donut/bar),
`theme`

**Data contract:** configurable numeric field (default: `value`).
Reads last row.

### Status Chip / Badge

**Draws:** rounded rectangle with fill color determined by severity
field. Text label centered. Optional icon glyph.

**Key render logic:**
```javascript
var chipColor = theme.severityColor(t, severity);
var pad = Math.max(8, Math.min(w, h) * 0.04);
theme.roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, h / 2);
ctx.fillStyle = chipColor;
ctx.fill();

ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
ctx.fillStyle = t.invert;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(label, w / 2, h / 2);
```

**Settings:** `field`, `labelField`, `theme`

**Data contract:** requires severity-like field (critical/warning/ok)
and label field. Reads last row.

### Live Ticker

**Draws:** horizontally scrolling entries with time-ago, separator
dots, optional pulsing LIVE badge. Gradient fade on edges.

**Key render logic:**
```javascript
// Animate scroll position
this._scrollX = (this._scrollX || 0) - scrollSpeed;
if (this._scrollX < -totalWidth) this._scrollX = w;

// Draw each entry
for (var i = 0; i < entries.length; i++) {
    var ex = this._scrollX + i * entryWidth;
    if (ex < -entryWidth || ex > w + entryWidth) continue;

    theme.roundRect(ctx, ex, y, entryW, entryH, 4);
    ctx.fillStyle = theme.withAlpha(t.panel, 0.8);
    ctx.fill();

    ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
    ctx.fillStyle = t.text;
    ctx.fillText(entries[i].text, ex + pad, y + entryH / 2);
}

// Edge fade gradients
var fadeL = ctx.createLinearGradient(0, 0, 60, 0);
fadeL.addColorStop(0, t.bg);
fadeL.addColorStop(1, 'transparent');
ctx.fillStyle = fadeL;
ctx.fillRect(0, 0, 60, h);
```

**Settings:** `title`, `scrollSpeed` (slow/medium/fast),
`field1`–`field4`, `label1`–`label4`, `bgColor`, `textColor`,
`accentColor`, `theme`

**Data contract:** requires `_time` + 1-4 configurable fields.
Multi-row input. Reads all rows.

### Leaderboard

**Draws:** ranked list with position badges (gold/silver/bronze for
1-3), player name, score with leading zeros. Optional CRT scanline
overlay and neon glow.

**Settings:** `title`, `maxRows`, `scoreDigits`, `rankField`,
`nameField`, `scoreField`, `titleColor`, `showScanlines`, `showGlow`,
`theme`

**Data contract:** requires rank, name, score fields (configurable).
Multi-row input.

### Process Flow / Pipeline

**Draws:** connected nodes with labels, values, optional sparklines.
Lines between nodes with optional arrows. Status-colored borders.

**Settings:** `labelField`, `valueField`, `statusField`,
`sparklineField`, `palette`, `showArrows`, `nodeRadius`, `theme`

**Data contract:** requires label + value fields, optional status
and sparkline. Multi-row input.

### Donut / Ring

**Draws:** part-to-whole donut with right-side legend. Center label
shows total. Segments colored from theme palette.

**Settings:** `categoryField`, `valueField`, `innerRadius`,
`showLegend`, `showTotal`, `colors` (comma-separated), `theme`

**Data contract:** requires category + value fields. Multi-row input.

## Formatter HTML template

```html
<form class="splunk-formatter-section" section-label="Data configurations">
    <splunk-control-group label="Value field" help="SPL field for the primary value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.field" value="value">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Data display">
    <splunk-control-group label="Label" help="Text shown below the value">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.label" value="">
        </splunk-text-input>
    </splunk-control-group>
    <splunk-control-group label="Unit" help="Unit suffix (%, ms, $)">
        <splunk-text-input name="{{VIZ_NAMESPACE}}.unit" value="">
        </splunk-text-input>
    </splunk-control-group>
</form>

<form class="splunk-formatter-section" section-label="Color and style">
    <splunk-control-group label="Theme" help="Color scheme">
        <splunk-radio-input name="{{VIZ_NAMESPACE}}.theme" value="dark">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
        </splunk-radio-input>
    </splunk-control-group>
    <splunk-control-group label="Accent color" help="Primary highlight color">
        <splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor"
            type="custom" value="#1a91a8">
            <splunk-color>#1a91a8</splunk-color>
            <splunk-color>#2bbfb8</splunk-color>
            <splunk-color>#ff6600</splunk-color>
            <splunk-color>#f73873</splunk-color>
            <splunk-color>#a78bfa</splunk-color>
        </splunk-color-picker>
    </splunk-control-group>
</form>
```

**Rules:**
- Section labels MUST be exact (see vp-ref-gotchas B5)
- Use 3 standard sections for simple vizs, more only when genuinely complex
- Every control-group MUST have `help="..."` attribute
- JS defaults MUST match `value="..."` attributes (B7)
- Color picker swatches should come from the pack's theme palette

## visualization.css template

```css
.splunk-viz-container,
.splunk-viz-container > div {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
}
```

If the viz needs its own font (beyond what theme.js provides), add
base64 `@font-face` in this file. See vp-ref-gotchas F2.

## harness.json template

```json
{
    "fields": [
        {"name": "field1", "type": "string"},
        {"name": "field2", "type": "number"}
    ],
    "rows": [
        ["label", 42],
        ["label2", 78]
    ],
    "formatter": {
        "field": "field2",
        "label": "Demo",
        "theme": "dark"
    }
}
```

## Data flow

```
SPL → formatData (data only) → updateView (data + config)
                                    ↓
                               _render(data, config)
                                    ↓
                            Canvas 2D drawing
```

1. `formatData`: build column index, cache last good data, throw
   VisualizationError if no data
2. `updateView`: cache data+config, call `_render`
3. `_render`: measure container, setup HiDPI canvas, read config via
   getOption, get theme tokens, draw

## Writing a new viz — step by step

1. **Define the data contract** — which SPL fields, required vs optional
2. **Sketch the Canvas layout** — what goes where at different sizes
3. **Write `_render` body** — use theme tokens for all colors, auto-scale
   all sizes, read all settings via getOption
4. **Write `formatter.html`** — 3 sections, all defaults matching JS
5. **Write `harness.json`** — sample data that renders a representative
   state
6. **Test in browser** — open test-harness.html, verify resize, dark/light
7. **Build** — webpack, verify ES5, check bundle format
8. **Test in Splunk** — install app, verify in Studio + ad-hoc search

## Hover tooltip — mandatory on every viz

See `vp-ref-gotchas` I1 and I2. Every viz MUST implement:

1. **DOM tooltip element** — created in `initialize`, positioned on
   `mousemove`, hidden on `mouseleave`
2. **Hit-test function** — `_hitTest(mx, my)` returns `{label, value}`
   or null
3. **Visual highlight** — hover state changes appearance (brighter row,
   crosshair line, segment stroke)
4. **Cleanup in destroy** — remove tooltip element, remove event
   listeners

The tooltip is a `<div>` appended to `this.el`, NOT drawn on Canvas
(Canvas can't do pointer-events:none or z-index above Studio chrome).

## Decimals setting — standard on all KPI/value vizs

Every viz that displays a formatted number MUST expose a `decimals`
formatter option:
- `-1` (default) = auto-compact via fmtNum
- `0` = integer
- `1`, `2`, `3` = fixed decimal places

```javascript
var decimals = parseInt(getOption(config, ns, 'decimals', '-1'), 10);
var displayValue;
if (isNaN(rawValue)) {
    displayValue = '—';
} else if (decimals >= 0) {
    displayValue = rawValue.toFixed(decimals);
} else {
    displayValue = theme.fmtNum(rawValue, { compact: true });
}
```

Without this, small values like 7.27 round to 7 and percentages like
3.8 round to 4.

## Common mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Hardcoded field names | Viz only works with exact SPL | Make configurable via formatter |
| Hardcoded pixel sizes | Breaks on resize | Auto-scale from container dimensions |
| Colors not from theme | Light mode broken | Use `t.text`, `t.bg`, etc. |
| Missing `count` in getInitialDataParams | Only 10 rows | Set `count: 50` (single) or `count: 10000` (multi) |
| `formatData` reads config | Stale cached values | Move to `updateView` |
| Font drawn before ready | Tofu glyphs forever | Poll with loadFont() |
| No `destroy()` cleanup | Memory leaks on nav | Clear timers, disconnect observers |
