# Canvas 2D Recipes

> **Restructured in v5.0.0 Phase 6.** Effect-category recipes have been split into focused files.
> Load the specific file you need — do not load all files.

## Recipe files — load on demand

| Effect category | File | When to load |
|-----------------|------|--------------|
| Depth (gradients, ambient light, vignette, gradient mesh, accent lines) | [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) | Dark theme vizs, Futuristic/Luxury/Precision/Power mood |
| Texture (noise grain, glass panels, tinted neutrals) | [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) | Organic/Luxury mood, any viz needing surface quality |
| Typography (3-tier hierarchy, spaced text, measureText) | [typography-recipes.md](../../vp-recipes/references/typography-recipes.md) | All vizs with text — load always |
| Animation (entrance, pulse, hover, stagger) | [animation-recipes.md](../../vp-recipes/references/animation-recipes.md) | Phase 9 only — do not load in Phase 6/7 |

## Functional patterns (unchanged — still in this file)

- Hover tooltip (mandatory)
- Drilldown (click navigation)
- Decimals setting
- Color interpolation
- Rounded rectangles
- Arc / gauge drawing
- Grid layout
- Responsive text fitting
- Animation lifecycle (basic)
- Common mistakes
- Shape primitives (extended)
- Color utilities (extended)
- Text utilities (extended)
- KPI tile vertical stacking
- Sparkline
- Horizontal gridlines
- Data rendering principles
- Canvas effects stacking order
- Parsing config values
- Hover tooltip system (full implementation)
- Category badge colors
- Number formatting with decimals control

## Hover tooltip — mandatory on every data-displaying viz

Every viz that displays data MUST implement:
1. DOM tooltip element — created in `initialize`, positioned on `mousemove`, hidden on `mouseleave`
2. Hit-test function — `_hitTest(mx, my)` returns `{label, value}` or null
3. Visual highlight — hover changes appearance (brighter row, crosshair, segment stroke)

The tooltip is a `<div>` appended to `this.el`, NOT drawn on Canvas.

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
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    return 'rgb(' + Math.round(ar+(br-ar)*t) + ',' + Math.round(ag+(bg-ag)*t) + ',' + Math.round(ab+(bb-ab)*t) + ')';
}
```

## Rounded rectangles

```javascript
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
}
```

## Arc / gauge drawing

```javascript
function drawArc(ctx, cx, cy, radius, startDeg, endDeg, color, lineWidth) {
    var startRad = (startDeg - 90) * Math.PI / 180;
    var endRad = (endDeg - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRad, endRad, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
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

## Responsive text fitting

```javascript
function fitText(ctx, text, maxWidth, maxFontSize, fontFamily) {
    var size = maxFontSize;
    ctx.font = size + 'px ' + fontFamily;
    while (ctx.measureText(text).width > maxWidth && size > 8) {
        size--;
        ctx.font = size + 'px ' + fontFamily;
    }
    return size;
}
```

## Animation lifecycle

```javascript
// In initialize():
this._animTimer = null;
this._animProgress = 0;

// Start animation (call from updateView when data changes):
_startAnim: function() {
    if (this._animTimer) clearInterval(this._animTimer);
    this._animProgress = 0;
    var self = this;
    this._animTimer = setInterval(function() {
        self._animProgress += 0.025;
        if (self._animProgress >= 1) {
            self._animProgress = 1;
            clearInterval(self._animTimer);
            self._animTimer = null;
        }
        self.invalidateUpdateView();
    }, 16);
},

// Easing (use in _render):
function easeInOutQuad(t) {
    return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
}
var easedProgress = easeInOutQuad(this._animProgress);

// CRITICAL: clean up in destroy():
destroy: function() {
    if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

## Common mistakes

| Mistake | Fix |
|---|---|
| Hardcoded field names | Make configurable via formatter |
| Hardcoded pixel sizes | Auto-scale from container |
| Colors not from theme | Use `t.text`, `t.bg`, etc. |
| Missing `count` in getInitialDataParams | Set `count: 50` (single) or `count: 10000` (multi) |
| `formatData` reads config | Move config reads to `updateView` |
| Font drawn before ready | Poll with document.fonts.ready |
| No `destroy()` cleanup | Clear timers, disconnect observers |
| `ctx.globalAlpha` not reset after use | Always set `ctx.globalAlpha = 1` before next draw |
| `ctx.shadowBlur` not reset | Always set `ctx.shadowBlur = 0` after glow effects |
| `measureText` not called before positioning | Always measure, then position |

---

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
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}
```

Default radius is 6px. Override per brand: 0 for sharp/technical, 2-4 for subtle, 8-12 for soft/friendly, h/2 for pill shapes. Don't use 6px for every brand.

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

For segmented arc gauges, use `lerpColor` to create smooth branded
transitions instead of flat single colors. Map segment position (0→1)
to the brand palette:

```javascript
// Red Bull: navy blue → sky blue → gold → red
for (var i = 0; i < segments; i++) {
    var segPct = (i + 0.5) / segments;
    var color;
    if (segPct >= redZonePct) {
        color = t.red;
    } else if (segPct > redZonePct * 0.75) {
        color = t.gold;
    } else {
        color = lerpColor('#1E3A6E', '#4A8FE7', segPct / redZonePct);
    }
    // ... draw segment with color
}
```

Never use generic green→yellow→red — it looks like a gaming HUD, not
a branded instrument. Derive colors from the brand palette.

### Tinted neutrals — never use pure grey

Pure grey (#808080, #333333, etc.) looks dead on screen. Always add a
tiny amount of chroma toward the brand hue. This is the OKLCH "tinted
neutral" technique used by every high-end design system.

**ES5 implementation:**
```javascript
function tintNeutral(grey, brandHex, amount) {
    // amount: 0.03-0.08 (3-8% tint toward brand)
    var r1 = parseInt(grey.slice(1, 3), 16);
    var g1 = parseInt(grey.slice(3, 5), 16);
    var b1 = parseInt(grey.slice(5, 7), 16);
    var r2 = parseInt(brandHex.slice(1, 3), 16);
    var g2 = parseInt(brandHex.slice(3, 5), 16);
    var b2 = parseInt(brandHex.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * amount);
    var g = Math.round(g1 + (g2 - g1) * amount);
    var b = Math.round(b1 + (b2 - b1) * amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Usage in theme.js:
// var bg = tintNeutral('#0B0C0E', brandAccent, 0.05);
// var panel = tintNeutral('#141519', brandAccent, 0.04);
// var edge = tintNeutral('#2A2B30', brandAccent, 0.03);
```

**Why it matters:** A dashboard with `bg: #0B0C0E` and `panel: #141519`
(pure greys) looks generic. The same dashboard with `bg: #0B0D12`
and `panel: #141721` (tinted 5% toward navy) looks crafted. The eye
can't name the difference, but it FEELS more intentional.

**Tint amounts by surface:**
| Surface | Amount | Why |
|---|---|---|
| Canvas background | 0.05-0.08 | Strongest tint, sets the atmosphere |
| Panel/card background | 0.03-0.05 | Slightly less than canvas |
| Borders/edges | 0.02-0.03 | Subtle, just enough warmth |
| Text (dim) | 0.01-0.02 | Barely visible, keeps harmony |

## Text utilities (extended)

### Fit text to width (bold variant)

```javascript
function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
    var size = startSize;
    var min = minSize || 8;
    var family = fontFamily || 'sans-serif';
    ctx.font = 'bold ' + size + 'px ' + family;
    while (ctx.measureText(text).width > maxWidth && size > min) {
        size -= 1;
        ctx.font = 'bold ' + size + 'px ' + family;
    }
    return size;
}
```

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
    var positive = value >= 0;
    ctx.fillStyle = positive ? upColor : downColor;
    ctx.beginPath();
    if (positive) {
        ctx.moveTo(x, y + size);
        ctx.lineTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x + size, y);
    }
    ctx.closePath();
    ctx.fill();
}
```

## KPI tile vertical stacking

**NEVER use percentage-of-height** (`h * 0.28`, `h * 0.55`) for
label/value/trend positioning. At small panel heights (100-150px),
percentage positions collapse and elements overlap.

**Use additive positioning:**
```javascript
var pad = 10;
var labelY = pad + labelSize;
var valueY = labelY + labelSize / 2 + 6 + valueSize / 2;
var trendY = valueY + valueSize / 2 + 4 + trendSize / 2;
```

Each element sits below the previous with an explicit pixel gap.
This guarantees separation at any panel height.

**Trend delta goes BELOW the value, not beside it.** At typical
KPI widths, a large monospace number fills the horizontal space.

## Sparkline (micro chart)

```javascript
function drawSparkline(ctx, values, x, y, w, h, color, mode) {
    if (!values || values.length < 2) return;
    var min = Infinity, max = -Infinity;
    for (var i = 0; i < values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
    }
    var range = max - min || 1;
    var step = w / (values.length - 1);

    ctx.save();
    ctx.beginPath();
    for (var j = 0; j < values.length; j++) {
        var px = x + j * step;
        var py = y + h - ((values[j] - min) / range) * h;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }

    if (mode === 'area') {
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fillStyle = withAlpha(color, 0.2);
        ctx.fill();
        // Re-draw line on top
        ctx.beginPath();
        for (var k = 0; k < values.length; k++) {
            var px2 = x + k * step;
            var py2 = y + h - ((values[k] - min) / range) * h;
            if (k === 0) ctx.moveTo(px2, py2);
            else ctx.lineTo(px2, py2);
        }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}
```

## Horizontal gridlines

```javascript
function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.save();
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    for (var i = 0; i <= divisions; i++) {
        var gy = Math.round(y + (h * i) / divisions) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
    ctx.restore();
}
```

**Grid lines must be SUBTLE.** They exist to help the eye align
values — not to decorate. If grid lines compete with data lines for
attention, they're too strong. Use `t.grid` (typically 4-6% opacity).
The baseline (y=0) can be slightly stronger (`t.edgeStrong`).

## Data rendering principles

Rules that apply to every data-displaying viz:

**Trend over decoration.** Heavy gradients, glow, and shadows on
data elements (lines, bars, areas) obscure the actual data. Mood
recipes (ambient light, vignette, texture) go on the BACKGROUND,
not on data elements.

**Direct labeling.** For datasets with <8 items, label values
directly on or next to the data element instead of relying on a
separate legend. Eliminates eye-travel.

**Tabular/monospaced figures.** Use `theme.FONTS.data` (monospace)
for ALL numeric values — KPIs, axis labels, table cells, tooltips.
Proportional fonts cause column misalignment and visual jitter.

**Color is never the ONLY indicator.** A red gauge segment must ALSO
have tick marks, zone labels, or text. ~8% of men are colorblind.

**Stagger entrance for lists.** When rendering multiple rows,
stagger by 20-40ms per row for a cascade effect:
```javascript
// In _render, after computing all rows:
var self = this;
for (var i = 0; i < rows.length; i++) {
    (function(idx) {
        setTimeout(function() {
            self._drawRow(ctx, idx);
        }, idx * 30);
    })(i);
}
```

## Canvas effects stacking order

When combining multiple effects, draw in this order:

1. Set globalAlpha (panel opacity x animation pulse)
2. Apply transforms (rotation + animation)
3. Drop shadow (multi-pass with near-transparent fill)
4. Glow (multi-pass with actual fill color)
5. Main fill (solid or gradient)
6. Inner shadow (clip + destination-atop composite)
7. Pattern overlay (clip + low-alpha pattern fill)
8. Stroke (color, width, dash)
9. Text (strokeText for outline, then fillText)

**Always save/restore context around each effect layer.**

## Parsing config values

```javascript
function parseColors(raw, fallback) {
    if (!raw) return fallback || [];
    var parts = String(raw).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c) out.push(c);
    }
    return out.length ? out : (fallback || []);
}

function parseBool(val, fallback) {
    if (val === undefined || val === null) return fallback;
    return val === 'true' || val === true || val === '1';
}

function parseNum(val, fallback) {
    if (val === undefined || val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}
```

## Hover tooltip system (full implementation)

Every viz MUST show a tooltip on hover. Canvas has no built-in
tooltip — use a DOM element positioned at the cursor.

### Tooltip setup (in initialize)

```javascript
initialize: function() {
    SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
    // ... canvas creation ...

    this._tooltip = document.createElement('div');
    this._tooltip.style.cssText =
        'position:absolute;display:none;padding:6px 12px;' +
        'pointer-events:none;white-space:nowrap;z-index:100;';
    this.el.style.position = 'relative';
    this.el.appendChild(this._tooltip);

    // Apply theme-driven styles after theme is available (call in _render or updateView):
    // this._tooltip.style.background = t.panelHi || t.panel;
    // this._tooltip.style.color = t.text;
    // this._tooltip.style.border = '1px solid ' + (t.edgeStrong || t.edge);
    // this._tooltip.style.fontFamily = theme.FONTS.data;
    // this._tooltip.style.fontSize = '11px';
    // this._tooltip.style.borderRadius = '2px';

    this._hitRegions = [];
    var self = this;
    this.canvas.addEventListener('mousemove', function(e) {
        self._onMouseMove(e);
    });
    this.canvas.addEventListener('mouseleave', function() {
        self._tooltip.style.display = 'none';
        self.canvas.style.cursor = 'default';
        if (self._hoverIdx !== -1) {
            self._hoverIdx = -1;
            self._render(self._lastData, self._lastConfig);
        }
    });
    this._hoverIdx = -1;
},
```

### Mouse move handler

```javascript
_onMouseMove: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var hit = this._hitTest(mx, my);

    if (hit !== null) {
        var region = this._hitRegions[hit];
        this._tooltip.innerHTML = region.tip;
        this._tooltip.style.display = 'block';

        // Position tooltip — flip if near edge
        var tx = mx + 14;
        var ty = my - 10;
        if (tx + 180 > this.el.offsetWidth) tx = mx - 180;
        if (ty < 0) ty = my + 20;
        this._tooltip.style.left = tx + 'px';
        this._tooltip.style.top = ty + 'px';
        this.canvas.style.cursor = 'pointer';

        if (this._hoverIdx !== hit) {
            this._hoverIdx = hit;
            this._render(this._lastData, this._lastConfig);
        }
    } else {
        this._tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
        if (this._hoverIdx !== -1) {
            this._hoverIdx = -1;
            this._render(this._lastData, this._lastConfig);
        }
    }
},
```

### Hit-test patterns per viz type

**Rectangular regions (table rows, KPI tiles, bar segments):**
```javascript
_hitTest: function(mx, my) {
    for (var i = 0; i < this._hitRegions.length; i++) {
        var r = this._hitRegions[i];
        if (mx >= r.x && mx <= r.x + r.w &&
            my >= r.y && my <= r.y + r.h) {
            return i;
        }
    }
    return null;
},
```

Register during _render:
```javascript
this._hitRegions = [];
// For each row/bar/segment:
this._hitRegions.push({
    x: rx, y: ry, w: rw, h: rh,
    tip: '<b>' + label + '</b>: ' + value
});
```

**Donut/pie segments (angle-based):**
```javascript
_hitTest: function(mx, my) {
    var dx = mx - this._cx;
    var dy = my - this._cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this._innerR || dist > this._outerR) return null;
    var angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    for (var i = 0; i < this._hitRegions.length; i++) {
        var r = this._hitRegions[i];
        if (angle >= r.startAngle && angle < r.endAngle) return i;
    }
    return null;
},
```

**Line/area chart (x-position to nearest data point):**
```javascript
_hitTest: function(mx, my) {
    if (mx < this._chartLeft || mx > this._chartRight) return null;
    if (my < this._chartTop || my > this._chartBottom) return null;
    var pct = (mx - this._chartLeft) / (this._chartRight - this._chartLeft);
    var idx = Math.round(pct * (this._numPoints - 1));
    idx = Math.max(0, Math.min(this._numPoints - 1, idx));
    return idx;
},
```

### Hover visual effects

Apply during `_render` when `this._hoverIdx !== -1`:

**Table row highlight:**
```javascript
if (ri === self._hoverIdx) {
    ctx.fillStyle = theme.withAlpha(t.accent, 0.12);
    ctx.fillRect(padX, ry, w - padX * 2, rowH);
}
```

**Chart crosshair + data dots:**
```javascript
if (self._hoverIdx >= 0 && self._hoverIdx < numPoints) {
    var hx = padL + (self._hoverIdx / (numPoints - 1)) * chartW;
    // Vertical crosshair
    ctx.strokeStyle = theme.withAlpha(t.text, 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(hx, padT);
    ctx.lineTo(hx, padT + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    // Data point dots
    for (var s = 0; s < numSeries; s++) {
        var hy = padT + chartH - ((allSeries[s][self._hoverIdx] - niceMin) / niceRange) * chartH;
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fillStyle = colors[s % colors.length];
        ctx.fill();
        ctx.strokeStyle = t.panel;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
```

**Donut segment highlight:**
```javascript
if (j === self._hoverIdx) {
    ctx.save();
    // Slightly larger radius on hover
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 4, angle, angle + slice);
    ctx.arc(cx, cy, innerR - 2, angle + slice, angle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}
```

### Tooltip HTML formatting

Use `innerHTML` for rich tooltips:

```javascript
this._hitRegions.push({
    tip: '<b style="color:' + color + '">' + name + '</b><br>' +
         value + ' (' + pct.toFixed(1) + '%)'
});
```

### Cleanup in destroy

```javascript
destroy: function() {
    if (this._tooltip && this._tooltip.parentNode) {
        this._tooltip.parentNode.removeChild(this._tooltip);
    }
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

## Category badge colors

Badge colors should come from the design brief or be configurable
via a formatter setting. Don't hardcode brand-specific colors.

Pattern for dynamic badge colors:
```javascript
// Define in theme.js or as a formatter setting
var BADGE_COLORS = theme.parseColors(
    getOption(config, ns, 'badgeColors', ''),
    [t.s1, t.s2, t.s3, t.s4, t.s5]  // fallback to theme series colors
);

function badgeColor(category, index) {
    return BADGE_COLORS[index % BADGE_COLORS.length];
}
```

For status-semantic badges (critical/warning/ok), use theme severity tokens:
```javascript
function statusColor(status) {
    return theme.severityColor(t, status);
}
```

Draw as pill badge:
```javascript
var bc = badgeColor(cellVal, cellIdx);
var badgeW = ctx.measureText(cellVal).width + 20;
var badgeH = rowH * 0.6;
var badgeY = cellY - badgeH / 2;
roundRect(ctx, cx - 4, badgeY, badgeW, badgeH, badgeH / 2);
ctx.fillStyle = withAlpha(bc, 0.2);
ctx.fill();
ctx.strokeStyle = withAlpha(bc, 0.6);
ctx.lineWidth = 1;
ctx.stroke();
ctx.fillStyle = bc;
ctx.fillText(cellVal, cx + 6, cellY);
```

## Number formatting with decimals control

The `fmtNum` compact mode rounds small values aggressively (7.27 -> 7).
Always pair it with a `decimals` option:

```javascript
function formatValue(raw, decimals, compact) {
    if (raw === null || raw === undefined || isNaN(raw)) return '—';
    if (decimals >= 0) return raw.toFixed(decimals);
    if (compact) return fmtNum(raw, { compact: true });
    return String(raw);
}
```

| Value | decimals=-1 (auto) | decimals=0 | decimals=1 | decimals=2 |
|---|---|---|---|---|
| 164200000 | 164.2M | 164200000 | 164200000.0 | 164200000.00 |
| 5800000000 | 5.8B | 5800000000 | 5800000000.0 | ... |
| 7.27 | 7 (WRONG!) | 7 | 7.3 | 7.27 |
| 3.8 | 4 (WRONG!) | 4 | 3.8 | 3.80 |
| 87.4 | 87 | 87 | 87.4 | 87.40 |

**Rule:** always expose `decimals` in the formatter for KPI vizs.

## Font loading — wait for font before drawing (B1)

CSS `@font-face` registers the font but Canvas 2D does NOT auto-swap when the font loads.
Drawing text before the font is ready produces tofu glyphs that never update.

Do NOT use `document.fonts.ready` — it resolves when ALL currently loading fonts finish, not when
your specific font is ready. Use `document.fonts.load()` targeting your exact font.

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

Call `loadFont(fontFamily, function() { self._render(data, config); })` inside `updateView`
instead of calling `_render` directly.

## HiDPI canvas scaling — Retina / 4K support (B2)

Without device pixel ratio scaling, canvas renders at 1x and looks blurry on Retina and 4K displays.

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

## Variable scope in sub-methods — store on `this`, not local vars (B14)

If a viz splits rendering into `_draw()` calling `_drawCenter()`, `_drawTicks()`, etc.,
local variables declared in `_draw()` are NOT in scope inside those sub-methods.
This causes `ReferenceError: x is not defined` at runtime.

```javascript
// WRONG — gi is local to _draw, invisible to _drawCenter
_draw: function(parsed, config) {
    var gi = 0.8;
    this._drawCenter(ctx, parsed);     // gi is not defined inside _drawCenter!
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * gi;          // ReferenceError
}

// CORRECT — store render state on this
_draw: function(parsed, config) {
    this._gi = 0.8;
    this._drawCenter(ctx, parsed);
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * (this._gi || 1);
}
```

Pattern: any value computed in `_draw` that sub-methods need must be stored as `this._propName`.
Clean up after render if the values should not persist: `delete this._gi` at end of `_draw`.

## Date parsing — regex alternative for sandboxed iframes (B19)

The custom viz iframe has `src="about:srcdoc"` and origin `null`.
`new Date(isoString)` silently fails in this context, returning `Invalid Date` or epoch 0.

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

For epoch values: `new Date(parseInt(s, 10) * 1000)` works because epoch is numeric, not string-parsed.
