# Canvas 2D Recipes

> **v5.0.0:** Effect-category recipes split into focused files. Load the specific file you need — do not load all files.

## Recipe files — load on demand

| Effect category | File | When to load |
|-----------------|------|--------------|
| Depth (gradients, ambient light, vignette, gradient mesh, accent lines) | [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) | Dark theme vizs, Futuristic/Luxury/Precision/Power mood |
| Texture (noise grain, glass panels, tinted neutrals) | [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) | Organic/Luxury mood, any viz needing surface quality |
| Typography (3-tier hierarchy, spaced text, measureText) | [typography-recipes.md](../../vp-recipes/references/typography-recipes.md) | All vizs with text — load always |
| Animation (entrance, pulse, hover, stagger) | [animation-recipes.md](../../vp-recipes/references/animation-recipes.md) | Load when adding animation controls to a viz (entrance, LED pulse, hover, stagger) |

## Hover tooltip — mandatory on every data-displaying viz

Every viz MUST implement: DOM tooltip `<div>` (in `this.el`), `_hitTest(mx, my)`, and a visual highlight. See full implementation below.

## Drilldown — click navigation from Canvas vizs

```javascript
// In initialize():
this.canvas.addEventListener('click', function(e) { self._onClick(e); });

// Click handler:
_onClick: function(e) {
    var mx = e.offsetX;
    var my = e.offsetY;
    var hit = this._hitTest(mx, my);
    if (hit === null) return;
    try {
        this.drilldown({
            action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
            data: hit.drilldownData
        }, e);
    } catch (ex) {}
}
```

Dashboard JSON event handler:
```json
"eventHandlers": [{
    "type": "drilldown.setToken",
    "options": { "tokens": [{ "token": "selected", "value": "$click.value$" }] }
}]
```

## Decimals setting — standard on all KPI/value vizs

```javascript
var decimals = parseInt(opt('decimals', '-1'), 10);
var displayValue;
if (isNaN(rawValue)) {
    displayValue = '—';
} else if (decimals >= 0) {
    displayValue = rawValue.toFixed(decimals);
} else {
    displayValue = theme.fmtNum(rawValue, { compact: true });
}
```

## Color interpolation

```javascript
function lerpColor(a, b, t) {
    var ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16);
    var br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
    return 'rgb('+Math.round(ar+(br-ar)*t)+','+Math.round(ag+(bg-ag)*t)+','+Math.round(ab+(bb-ab)*t)+')';
}
```

## Arc / gauge drawing

```javascript
function drawArc(ctx, cx, cy, radius, startDeg, endDeg, color, lineWidth) {
    var startRad = (startDeg-90)*Math.PI/180, endRad = (endDeg-90)*Math.PI/180;
    ctx.beginPath(); ctx.arc(cx, cy, radius, startRad, endRad, false);
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.stroke();
}
```

## Grid layout

```javascript
function gridLayout(totalW, totalH, rows, cols, padding) {
    var cellW = (totalW - padding * (cols+1)) / cols;
    var cellH = (totalH - padding * (rows+1)) / rows;
    var cells = [];
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            cells.push({
                x: padding + c * (cellW + padding),
                y: padding + r * (cellH + padding),
                w: cellW, h: cellH
            });
        }
    }
    return { cells: cells, cellW: cellW, cellH: cellH };
}
```

## Animation lifecycle

See [animation-recipes.md](../../vp-recipes/references/animation-recipes.md) for entrance animations (rAF preferred) and setInterval for continuous effects (LED pulse). For stagger entrance patterns, see the staggered row entrance section in animation-recipes.md.

## Common mistakes

| Mistake | Fix |
|---|---|
| Hardcoded field names / pixel sizes | Make configurable; auto-scale from container |
| Colors not from theme | Use `t.text`, `t.bg`, etc. |
| Missing `count` in getInitialDataParams | `count: 50` (single) / `count: 10000` (multi) |
| `formatData` reads config | Move config reads to `updateView` |
| Font drawn before ready | Use `loadFont()` pattern — see B1 section below |
| No `destroy()` cleanup | Clear timers, disconnect observers |
| `ctx.globalAlpha` / `shadowBlur` not reset | Reset to `1` / `0` after each use |
| `measureText` not called before positioning | Always measure, then position |

## Shape primitives (extended)

### Rounded rectangle (with null/negative-radius guard)

```javascript
function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 4;
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}
```

### Panel chrome (1px border, configurable radius)

```javascript
function drawPanel(ctx, t, x, y, w, h, r) {
    if (r === undefined) r = 6;
    roundRect(ctx, x+0.5, y+0.5, w-1, h-1, r);
    ctx.fillStyle = t.panel; ctx.fill();
    ctx.strokeStyle = t.edge; ctx.lineWidth = 1; ctx.stroke();
}
```

Default r=6px. Override per brand: 0=sharp/technical, 2-4=subtle, 8-12=soft/friendly, h/2=pill.

### Pill / chip (radius = height / 2)

```javascript
function drawPill(ctx, x, y, w, h, fillColor) {
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
}
```

## Color utilities (extended)

### Hex to RGBA

```javascript
function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}
```

### Severity color mapping

```javascript
function severityColor(t, sev) {
    var s = (sev || '').toString().toLowerCase();
    if (s === 'crit' || s === 'critical' || s === 'high' ||
        s === 'danger' || s === 'error') return t.danger;
    if (s === 'warn' || s === 'warning' || s === 'med' ||
        s === 'medium' || s === 'degraded') return t.warn;
    if (s === 'low' || s === 'info' || s === 'ok' ||
        s === 'success' || s === 'healthy') return t.success;
    return t.textDim;
}
```

### Branded gauge gradient

Use `lerpColor` for branded segmented arc gauges — never generic green→yellow→red:

```javascript
for (var i = 0; i < segments; i++) {
    var segPct = (i + 0.5) / segments;
    var color = segPct >= redZonePct ? t.red : segPct > redZonePct * 0.75 ? t.gold
        : lerpColor('#1E3A6E', '#4A8FE7', segPct / redZonePct);
}
```

### Tinted neutrals

See [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) — `tintNeutral` function with tint amount table for brand-tinted panel backgrounds (DPR-02). Never use pure grey.

## Text utilities (extended)

### Fit text to width

See [typography-recipes.md](../../vp-recipes/references/typography-recipes.md) — `fitText` function. Always measure text before drawing to prevent overflow.

### Number formatting

```javascript
function fmtNum(v, opts) {
    opts = opts || {};
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (opts.compact && abs >= 1000) {
        if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    }
    if (opts.fixed !== undefined) return v.toFixed(opts.fixed);
    return Math.round(v).toLocaleString('en-US');
}
```

### Delta arrow

```javascript
function drawDelta(ctx, x, y, size, value, upColor, downColor) {
    var pos = value >= 0;
    ctx.fillStyle = pos ? upColor : downColor;
    ctx.beginPath();
    if (pos) { ctx.moveTo(x, y+size); ctx.lineTo(x+size/2, y); ctx.lineTo(x+size, y+size); }
    else { ctx.moveTo(x, y); ctx.lineTo(x+size/2, y+size); ctx.lineTo(x+size, y); }
    ctx.closePath(); ctx.fill();
}
```

## KPI tile vertical stacking

**NEVER use percentage-of-height** (`h * 0.28`) — at small heights (100-150px), elements overlap. Use additive positioning:

```javascript
var pad = 10;
var labelY = pad + labelSize;
var valueY = labelY + labelSize / 2 + 6 + valueSize / 2;
var trendY = valueY + valueSize / 2 + 4 + trendSize / 2;
```

Trend delta goes BELOW the value — at typical KPI widths a large monospace number fills horizontal space.

## Sparkline (micro chart)

```javascript
function drawSparkline(ctx, values, x, y, w, h, color, mode) {
    if (!values || values.length < 2) return;
    var min = Infinity, max = -Infinity;
    for (var i = 0; i < values.length; i++) { if (values[i] < min) min = values[i]; if (values[i] > max) max = values[i]; }
    var range = max - min || 1;
    var step = w / (values.length - 1);
    ctx.save();
    function plotLine(vs) {
        ctx.beginPath();
        for (var j = 0; j < vs.length; j++) {
            var px = x + j * step; var py = y + h - ((vs[j] - min) / range) * h;
            if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
    }
    plotLine(values);
    if (mode === 'area') {
        ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
        ctx.fillStyle = withAlpha(color, 0.2); ctx.fill(); plotLine(values);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}
```

## Horizontal gridlines

```javascript
function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.save(); ctx.strokeStyle = t.grid; ctx.lineWidth = 1;
    for (var i = 0; i <= divisions; i++) {
        var gy = Math.round(y + (h * i) / divisions) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }
    ctx.restore();
}
```

Grid lines must be SUBTLE — use `t.grid` (4-6% opacity). If they compete with data lines, they're too strong. Baseline can use `t.edgeStrong`.

## Data rendering principles

- **Trend over decoration.** Mood effects (gradients, vignette, texture) go on BACKGROUND, not data elements.
- **Direct labeling.** For <8 items, label values on the element — no legend needed.
- **Monospaced figures.** Use `theme.FONTS.data` for ALL numeric values to prevent column misalignment.
- **Color + indicator.** Never use color alone — add tick marks, zone labels, or text (~8% of men are colorblind).
- **Stagger entrance.** See [animation-recipes.md](../../vp-recipes/references/animation-recipes.md) `_startStaggeredEntrance` (ANI-04).

## Canvas effects stacking order

Draw in this order: (1) globalAlpha, (2) transforms, (3) drop shadow, (4) glow, (5) main fill, (6) inner shadow, (7) pattern overlay, (8) stroke, (9) text (strokeText then fillText). Always save/restore around each layer.

## Parsing config values

```javascript
function parseColors(raw, fallback) {
    if (!raw) return fallback || [];
    var out = [];
    String(raw).split(',').forEach(function(c) { c = c.trim(); if (c) out.push(c); });
    return out.length ? out : (fallback || []);
}
function parseBool(val, fallback) {
    if (val === undefined || val === null) return fallback;
    return val === 'true' || val === true || val === '1';
}
function parseNum(val, fallback) {
    if (val === undefined || val === null) return fallback;
    var n = parseFloat(val); return isNaN(n) ? fallback : n;
}
```

## Hover tooltip system

### Setup (in initialize)

```javascript
this._tooltip = document.createElement('div');
this._tooltip.style.cssText =
    'position:absolute;display:none;padding:6px 12px;' +
    'pointer-events:none;white-space:nowrap;z-index:100;';
this.el.style.position = 'relative';
this.el.appendChild(this._tooltip);
// Apply theme styles in _render: t.panel/t.text/t.edge/FONTS.data/11px/2px border-radius

this._hitRegions = [];
var self = this;
this.canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
this.canvas.addEventListener('mouseleave', function() {
    self._tooltip.style.display = 'none';
    self.canvas.style.cursor = 'default';
    if (self._hoverIdx !== -1) { self._hoverIdx = -1; self._render(self._lastData, self._lastConfig); }
});
this._hoverIdx = -1;
```

### Mouse move handler

```javascript
_onMouseMove: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var hit = this._hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit !== null) {
        var tx = e.clientX - rect.left + 14;
        var ty = e.clientY - rect.top - 10;
        if (tx + 180 > this.el.offsetWidth) tx -= 194;
        if (ty < 0) ty += 30;
        this._tooltip.innerHTML = this._hitRegions[hit].tip;
        this._tooltip.style.cssText += ';display:block;left:' + tx + 'px;top:' + ty + 'px;';
        this.canvas.style.cursor = 'pointer';
        if (this._hoverIdx !== hit) { this._hoverIdx = hit; this._render(this._lastData, this._lastConfig); }
    } else {
        this._tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
        if (this._hoverIdx !== -1) { this._hoverIdx = -1; this._render(this._lastData, this._lastConfig); }
    }
},
```

### Hit-test (rectangular regions)

```javascript
_hitTest: function(mx, my) {
    for (var i = 0; i < this._hitRegions.length; i++) {
        var r = this._hitRegions[i];
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
    }
    return null;
},
```

Register during `_render`: `this._hitRegions = []; /* for each row/bar: */ this._hitRegions.push({ x, y, w, h, tip: '<b>' + label + '</b>: ' + value });`

**For donut/pie angle-based and line/area x-position hitTest patterns, see the per-viz creative implementation.**

### Hover visual effect (table row highlight)

```javascript
if (ri === self._hoverIdx) {
    ctx.fillStyle = theme.withAlpha(t.accent, 0.12);
    ctx.fillRect(padX, ry, w - padX * 2, rowH);
}
```

## Category badge colors

```javascript
var BADGE_COLORS = theme.parseColors(
    getOption(config, ns, 'badgeColors', ''),
    [t.s1, t.s2, t.s3, t.s4, t.s5]
);
function badgeColor(index) { return BADGE_COLORS[index % BADGE_COLORS.length]; }
// For status-semantic badges: use severityColor(t, status) above

// Draw pill badge:
var bc = badgeColor(cellIdx);
var badgeW = ctx.measureText(cellVal).width + 20;
var badgeH = rowH * 0.6;
roundRect(ctx, cx - 4, cellY - badgeH / 2, badgeW, badgeH, badgeH / 2);
ctx.fillStyle = withAlpha(bc, 0.2); ctx.fill();
ctx.strokeStyle = withAlpha(bc, 0.6); ctx.lineWidth = 1; ctx.stroke();
ctx.fillStyle = bc; ctx.fillText(cellVal, cx + 6, cellY);
```

## Font loading — wait for font before drawing (B1)

```javascript
var _fontReady = false;
var _fontPending = false;

function loadFont(fontFamily, onReady) {
    if (_fontReady) { onReady(); return; }
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
        setTimeout(onReady, 200); return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "' + fontFamily + '"').then(function() { _fontReady = true; });
    }
    var attempts = 0;
    (function poll() {
        if (_fontReady || ++attempts > 30) { _fontReady = true; onReady(); return; }
        setTimeout(poll, 100);
    })();
}
```

Do NOT use `document.fonts.ready` — it resolves when ALL currently loading fonts finish.
Call `loadFont(fontFamily, function() { self._render(data, config); })` inside `updateView`.

## HiDPI canvas scaling — Retina / 4K support (B2)

```javascript
function setupHiDPI(canvas, w, h) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
    // ALL drawing uses w, h (CSS pixels), NOT canvas.width/canvas.height
}
```

## Variable scope in sub-methods — store on `this` (B14)

Local variables in `_draw()` are NOT in scope inside sub-methods like `_drawCenter()`.

```javascript
// WRONG: gi is local to _draw, invisible to _drawCenter
_draw: function(parsed, config) { var gi = 0.8; this._drawCenter(ctx, parsed); },
_drawCenter: function(ctx, parsed) { ctx.shadowBlur = 12 * gi; } // ReferenceError

// CORRECT: store on this
_draw: function(parsed, config) { this._gi = 0.8; this._drawCenter(ctx, parsed); },
_drawCenter: function(ctx, parsed) { ctx.shadowBlur = 12 * (this._gi || 1); }
```

Pattern: store as `this._propName`; `delete this._gi` at end of `_draw` if values should not persist.

## Date parsing — regex alternative for sandboxed iframes (B19)

`new Date(isoString)` silently fails in Splunk's `src="about:srcdoc"` iframe — returns epoch 0.

```javascript
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseTimestamp(s) {
    if (s == null || s === '') return '';
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) return MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ' ' + m[4] + ':' + m[5];
    return String(s);
}
```

For epoch values: `new Date(parseInt(s, 10) * 1000)` works (numeric, not string-parsed).
