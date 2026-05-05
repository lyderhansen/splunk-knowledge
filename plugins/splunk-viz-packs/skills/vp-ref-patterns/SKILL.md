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
