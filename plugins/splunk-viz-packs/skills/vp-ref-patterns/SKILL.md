---
name: vp-ref-patterns
description: "Canvas 2D rendering recipes, effects, and reusable patterns for Splunk custom visualizations. Covers: roundRect, gradients, shadows, glow effects, text fitting, sparklines, animation, color interpolation, number formatting, and responsive layout. All code is ES5. Use when writing visualization_source.js to avoid reinventing common drawing patterns."
---

# vp-ref-patterns — Canvas 2D recipes

All code is ES5. All functions are designed to be copy-pasted into
visualization_source.js or imported via shared/theme.js.

## Shape primitives

### Rounded rectangle

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

### Panel chrome (1px border, 6px radius)

```javascript
function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}
```

### Pill / chip (radius = height / 2)

```javascript
function drawPill(ctx, x, y, w, h, fillColor) {
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
}
```

## Color utilities

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

### Color interpolation

```javascript
function lerpColor(a, b, t) {
    var ah = a.replace('#',''), bh = b.replace('#','');
    if (ah.length === 3) ah = ah[0]+ah[0]+ah[1]+ah[1]+ah[2]+ah[2];
    if (bh.length === 3) bh = bh[0]+bh[0]+bh[1]+bh[1]+bh[2]+bh[2];
    var ar = parseInt(ah.substring(0,2),16);
    var ag = parseInt(ah.substring(2,4),16);
    var ab = parseInt(ah.substring(4,6),16);
    var br = parseInt(bh.substring(0,2),16);
    var bg = parseInt(bh.substring(2,4),16);
    var bb = parseInt(bh.substring(4,6),16);
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
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

## Text utilities

### Fit text to width

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

## Auto-scaling formulas

| Element | Formula | Min | Max |
|---|---|---|---|
| Primary value | `Math.min(w, h) * 0.35` | 14 | 72 |
| Title / label | `Math.min(w, h) * 0.09` | 8 | 20 |
| Unit text | `valueFontSize * 0.45` | 8 | 28 |
| Padding | `Math.max(8, Math.min(w, h) * 0.04)` | 8 | — |
| Icon | `Math.min(w, h) * 0.6` | 16 | 200 |

**User override pattern:** `0` = auto, positive value = explicit.

```javascript
var userSize = parseInt(getOption(config, ns, 'fontSize', '0'), 10);
var fontSize = userSize > 0
    ? userSize
    : Math.max(14, Math.min(72, Math.min(w, h) * 0.35));
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

## Effects

### Drop shadow (multi-pass for intensity)

```javascript
function drawShadow(ctx, drawPath, passes, color, blur, offX, offY) {
    for (var i = 0; i < passes; i++) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offX;
        ctx.shadowOffsetY = offY;
        drawPath(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fill();
        ctx.restore();
    }
    // ALWAYS reset shadow state
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}
```

### Neon glow (text)

```javascript
function drawGlowText(ctx, text, x, y, font, color, glowSize) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glow pass
    ctx.shadowColor = color;
    ctx.shadowBlur = glowSize;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    // Crisp pass on top
    ctx.shadowBlur = 0;
    ctx.fillText(text, x, y);
    ctx.restore();
}
```

### CRT scanlines

```javascript
function drawScanlines(ctx, w, h, opacity) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (opacity || 0.15) + ')';
    for (var y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
}
```

### Vignette (radial darkening at edges)

```javascript
function drawVignette(ctx, w, h, strength) {
    var cx = w / 2, cy = h / 2;
    var r = Math.max(w, h) * 0.7;
    var grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,0,' + (strength || 0.4) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}
```

### Edge fade gradient

```javascript
function drawEdgeFade(ctx, side, w, h, fadeWidth, bgColor) {
    var grad;
    if (side === 'left') {
        grad = ctx.createLinearGradient(0, 0, fadeWidth, 0);
        grad.addColorStop(0, bgColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, fadeWidth, h);
    } else if (side === 'right') {
        grad = ctx.createLinearGradient(w - fadeWidth, 0, w, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, bgColor);
        ctx.fillStyle = grad;
        ctx.fillRect(w - fadeWidth, 0, fadeWidth, h);
    }
}
```

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

## Animation

### Timer lifecycle

```javascript
// In updateView:
var animType = getOption(config, ns, 'animation', 'none');
if (animType !== 'none' && !this._animTimer) {
    var self = this;
    this._animTimer = setInterval(function() {
        self._animPhase = (self._animPhase || 0) + 0.05;
        self._render(self._lastData, self._lastConfig);
    }, 33); // ~30fps
} else if (animType === 'none' && this._animTimer) {
    clearInterval(this._animTimer);
    this._animTimer = null;
    this._animPhase = 0;
}

// In destroy:
if (this._animTimer) {
    clearInterval(this._animTimer);
    this._animTimer = null;
}
```

### Animation modifiers

| Type | Apply in _render |
|---|---|
| `pulse` | `ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this._animPhase)` |
| `glow_pulse` | Modulate `shadowBlur` multiplier |
| `breathe` | `var s = 1 + 0.03 * Math.sin(this._animPhase); ctx.scale(s, s)` around center |
| `spin` | Add `this._animPhase * 2` to rotation angle |

## Canvas effects stacking order

When combining multiple effects, draw in this order:

1. Set globalAlpha (panel opacity × animation pulse)
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

## Hover tooltip system

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
        'background:rgba(0,0,0,0.9);color:#E5EAF2;font-size:12px;' +
        'border-radius:6px;pointer-events:none;white-space:nowrap;' +
        'z-index:100;font-family:"Inter",sans-serif;' +
        'border:1px solid rgba(255,255,255,0.12);' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.4);';
    this.el.style.position = 'relative';
    this.el.appendChild(this._tooltip);

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

## Category/franchise badge colors

Reusable pattern for assigning brand-specific colors to data categories:

```javascript
var FRANCHISE_COLORS = {
    'marvel': '#E23636',
    'star wars': '#FFE81F',
    'pixar': '#00B3E6',
    'disney': '#0063E5',
    'national geographic': '#FFCC00',
    'hulu': '#1CE783',
    'espn': '#FF4438',
    'critical': '#D41F1F',
    'warning': '#CBA700',
    'ok': '#118832'
};

function categoryColor(name, fallback) {
    return FRANCHISE_COLORS[(name || '').toLowerCase()] || fallback || '#6B7280';
}
```

Draw as pill badge:
```javascript
var badgeColor = categoryColor(cellVal);
var badgeW = ctx.measureText(cellVal).width + 20;
var badgeH = rowH * 0.6;
var badgeY = cellY - badgeH / 2;
roundRect(ctx, cx - 4, badgeY, badgeW, badgeH, badgeH / 2);
ctx.fillStyle = withAlpha(badgeColor, 0.2);
ctx.fill();
ctx.strokeStyle = withAlpha(badgeColor, 0.6);
ctx.lineWidth = 1;
ctx.stroke();
ctx.fillStyle = badgeColor;
ctx.fillText(cellVal, cx + 6, cellY);
```

## Number formatting with decimals control

The `fmtNum` compact mode rounds small values aggressively (7.27 → 7).
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

---

## Mood recipes — Canvas techniques that create FEELING

The recipes above are functional — they draw shapes and text. The
recipes below create ATMOSPHERE. They're the difference between
"a dashboard" and "a place you want to look at."

**These are not decorations.** Each technique serves data
communication by creating visual hierarchy, directing attention,
or establishing emotional context. Use them with intention.

### Ambient light source

A subtle radial gradient from one corner creates a sense of
physical space — the dashboard feels LIT, not flat.

```javascript
function drawAmbientLight(ctx, w, h, color, intensity) {
    var grad = ctx.createRadialGradient(
        w * 0.15, h * 0.1, 0,
        w * 0.15, h * 0.1, w * 0.9
    );
    grad.addColorStop(0, withAlpha(color, intensity || 0.06));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}
// Usage: drawAmbientLight(ctx, w, h, '#4A8FE7', 0.05);
// Place AFTER background fill, BEFORE data elements
```

### Glass panel (frosted glass effect)

Simulates backdrop-filter blur with a layered approach:
semi-transparent fill + bright top edge + subtle inner shadow.

```javascript
function drawGlassPanel(ctx, x, y, w, h, bgColor, r) {
    r = r || 8;
    // Base fill — semi-transparent
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = withAlpha(bgColor, 0.65);
    ctx.fill();

    // Top highlight — simulates light hitting glass edge
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    var topGrad = ctx.createLinearGradient(x, y, x, y + 3);
    topGrad.addColorStop(0, 'rgba(255,255,255,0.10)');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, 3);
    ctx.restore();

    // Subtle border
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
}
```

### Micro-texture: noise grain

Adds tactile quality — the surface feels REAL, not digital.
Keep opacity very low (0.015–0.03) or it becomes distracting.

```javascript
function drawNoiseTexture(ctx, w, h, opacity) {
    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;
    var alpha = Math.round((opacity || 0.02) * 255);
    for (var i = 0; i < data.length; i += 4) {
        var noise = Math.random() * 255;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
        data[i + 3] = Math.round(Math.random() * alpha);
    }
    ctx.putImageData(imageData, 0, 0);
}
// WARNING: expensive on large canvases. Cache to offscreen canvas:
// var noiseCanvas = document.createElement('canvas');
// ... render once, then ctx.drawImage(noiseCanvas, 0, 0);
```

### Micro-texture: diagonal hatch (carbon fiber)

Lighter than noise, creates a technical/precision feel.

```javascript
function drawCarbonHatch(ctx, w, h, opacity, spacing) {
    ctx.save();
    ctx.globalAlpha = opacity || 0.015;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    var sp = spacing || 8;
    for (var i = -h; i < w + h; i += sp) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
    }
    ctx.restore();
}
```

### Atmospheric vignette

Darkens edges, naturally draws focus to center content.

```javascript
function drawVignette(ctx, w, h, strength) {
    var cx = w / 2, cy = h / 2;
    var r = Math.max(w, h) * 0.7;
    var grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, withAlpha('#000000', strength || 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}
```

### Data glow — value emphasis

Makes a number feel ALIVE by adding a colored halo behind it.
Use sparingly — one hero value per viz, not every number.

```javascript
function drawTextGlow(ctx, text, x, y, font, color, glowRadius) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glow pass
    ctx.shadowColor = color;
    ctx.shadowBlur = glowRadius || 12;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.fillText(text, x, y);
    ctx.fillText(text, x, y); // double pass for intensity
    // Crisp pass
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);
    ctx.restore();
}
// Usage: drawTextGlow(ctx, '312', cx, cy, 'bold 48px mono', '#DC0000', 16);
```

### Cinematic typography — letter spacing

Canvas has no letter-spacing property. Draw character by character
for headlines that feel designed, not rendered.

```javascript
function drawSpacedText(ctx, text, x, y, spacing) {
    var chars = text.split('');
    var totalW = 0;
    var widths = [];
    for (var i = 0; i < chars.length; i++) {
        var w = ctx.measureText(chars[i]).width;
        widths.push(w);
        totalW += w + (i < chars.length - 1 ? spacing : 0);
    }
    var startX = x - totalW / 2;
    for (var j = 0; j < chars.length; j++) {
        ctx.fillText(chars[j], startX + widths[j] / 2, y);
        startX += widths[j] + spacing;
    }
}
// Usage: ctx.textAlign = 'center';
// drawSpacedText(ctx, 'TELEMETRY', cx, 20, 4);
```

### Gradient mesh — rich multi-point background

Two overlapping radial gradients create depth that a single
linear gradient can't achieve.

```javascript
function drawGradientMesh(ctx, w, h, color1, color2, color3) {
    // Base
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, w, h);
    // Warm corner (top-left)
    var g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.7);
    g1.addColorStop(0, withAlpha(color2, 0.12));
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    // Cool corner (bottom-right)
    var g2 = ctx.createRadialGradient(w, h, 0, w, h, w * 0.6);
    g2.addColorStop(0, withAlpha(color3, 0.08));
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
}
// Usage: drawGradientMesh(ctx, w, h, '#0B0E1A', '#1E3A6E', '#2D0A3E');
```

### Geometric accent lines

Technical decorative lines that say "precision engineering."
Place behind data elements, never on top.

```javascript
function drawAccentLines(ctx, w, h, color, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity || 0.06;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    // Crosshair from center
    var cx = w / 2, cy = h / 2;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();
    // Corner brackets
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    var br = 20;
    // top-left
    ctx.beginPath();
    ctx.moveTo(0, br); ctx.lineTo(0, 0); ctx.lineTo(br, 0);
    ctx.stroke();
    // bottom-right
    ctx.beginPath();
    ctx.moveTo(w, h - br); ctx.lineTo(w, h); ctx.lineTo(w - br, h);
    ctx.stroke();
    ctx.restore();
}
```

### Soft inner shadow (depth without drop shadow)

Canvas has no inset box-shadow. Simulate with edge gradients.

```javascript
function drawInnerShadow(ctx, x, y, w, h, depth, r) {
    ctx.save();
    roundRect(ctx, x, y, w, h, r || 4);
    ctx.clip();
    var d = depth || 4;
    // Top shadow
    var gt = ctx.createLinearGradient(x, y, x, y + d);
    gt.addColorStop(0, 'rgba(0,0,0,0.15)');
    gt.addColorStop(1, 'transparent');
    ctx.fillStyle = gt;
    ctx.fillRect(x, y, w, d);
    // Left shadow
    var gl = ctx.createLinearGradient(x, y, x + d, y);
    gl.addColorStop(0, 'rgba(0,0,0,0.08)');
    gl.addColorStop(1, 'transparent');
    ctx.fillStyle = gl;
    ctx.fillRect(x, y, d, h);
    ctx.restore();
}
```

### Animated pulse ring (attention grabber)

For a value that needs urgent attention. Uses requestAnimationFrame
with cleanup in destroy().

```javascript
// In initialize():
this._animFrame = null;
this._pulsePhase = 0;

// In _render(), after drawing the gauge:
if (isUrgent) {
    this._startPulse();
}

// Method:
_startPulse: function() {
    if (this._animFrame) return;
    var self = this;
    var tick = function() {
        self._pulsePhase = (self._pulsePhase + 0.03) % (Math.PI * 2);
        var alpha = 0.1 + Math.sin(self._pulsePhase) * 0.1;
        // Redraw the glow ring at varying opacity
        var ctx = self.canvas.getContext('2d');
        ctx.save();
        ctx.beginPath();
        ctx.arc(self._cx, self._cy, self._radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha('#DC0000', alpha);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        self._animFrame = requestAnimationFrame(tick);
    };
    tick();
},

// In destroy():
if (this._animFrame) {
    cancelAnimationFrame(this._animFrame);
    this._animFrame = null;
}

## When to use mood recipes

These techniques are POWERFUL but DANGEROUS. Guidelines:

| Technique | Density | When |
|---|---|---|
| Ambient light | 1 per dashboard | Always — costs nothing, adds depth |
| Glass panel | 2-4 per dashboard | Branded dashboards with hero image |
| Noise texture | 0-1 per dashboard | Technical/industrial brands only |
| Carbon hatch | 0-1 per dashboard | F1/motorsport/engineering brands |
| Vignette | 1 per viz | Hero gauges, featured charts |
| Data glow | 1-2 per dashboard | ONLY on the most critical value |
| Letter spacing | Headers only | Brand wordmarks, section titles |
| Gradient mesh | 1 per dashboard | Background only, never competing with data |
| Accent lines | 0-1 per viz | Technical/precision brands |
| Inner shadow | On glass panels | Creates depth on glass panels |
| Pulse ring | 0-1 per dashboard | ONLY for genuine alerts/thresholds |

**One rule:** if the mood technique competes with the DATA for
attention, you've used too much. The data is the story. The mood
is the stage lighting.

## Accent intensity multiplier

Every viz MUST expose an `accentIntensity` setting (0-100, default
50) that scales all glow, shadow, ambient, and accent effects. This
lets dashboard authors dial mood up or down per-panel without
editing source code.

### Reading the setting

```javascript
// In _render() or updateView():
var gi = theme.parseNum(
    theme.getOption(config, ns, 'accentIntensity', '50'), 50
) / 50;
this._gi = gi; // store on this for sub-methods (B14)
```

`gi` is a multiplier: 0 = off, 1 = default (50/50), 2 = max (100/50).

### Applying to effects

```javascript
// Ambient light
theme.drawAmbientLight(ctx, w, h, accent, 0.07 * gi);

// Accent lines
theme.drawAccentLines(ctx, w, h, accent, 0.06 * gi);

// Vignette
theme.drawVignette(ctx, w, h, 0.40 * gi);

// Text glow radius
theme.drawTextGlow(ctx, text, x, y, font, color, 14 * gi);

// Shadow blur on arcs, dots, nodes
ctx.shadowBlur = 12 * gi;

// Backlight gradient opacity
topGrad.addColorStop(0, theme.withAlpha(accent, 0.18 * gi));

// Glass panel highlight
var topHighlight = 'rgba(255,255,255,' + (0.10 * gi) + ')';
```

### In sub-methods

Variables defined in `_draw()` are NOT accessible from separate
methods like `_drawCenter()` or `_drawDots()`. Access via `this`:

```javascript
// In _drawCenter, _drawTicks, _drawDots, etc.:
var gi = this._gi || 1;
ctx.shadowBlur = 12 * gi;
```

### Formatter control

Add to the "Color and style" section of every `formatter.html`:

```html
<splunk-control-group
  label="Accent intensity"
  help="Glow and accent effect strength (0=off, 50=default, 100=max)">
  <splunk-text-input
    name="{{VIZ_NAMESPACE}}.accentIntensity"
    value="50">
  </splunk-text-input>
</splunk-control-group>
```

JS default (`'50'`) MUST match formatter default (`value="50"`).
