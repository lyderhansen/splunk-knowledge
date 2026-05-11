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

## Typographic tension — 3-tier size system

Great design has DRAMATIC size contrast — not everything slightly
different, but hero text 4-6× larger than labels. The ratio creates
visual hierarchy that tells the eye where to look.

| Tier | Formula | Min | Max | Opacity | Role |
|---|---|---|---|---|---|
| **Hero** | `Math.min(w, h) * 0.35` | 36 | 72 | 100% | ONE dominant value per viz |
| **Body** | `Math.min(w, h) * 0.14` | 14 | 24 | 60-80% | Supporting values, secondary |
| **Whisper** | `Math.min(w, h) * 0.07` | 8 | 11 | 25-35% | Labels, headers, metadata |

**Guideline:** aim for hero ÷ whisper ≥ 4:1 for dramatic hierarchy. But some brands (brutalist, data-dense) intentionally flatten the hierarchy. The ratio is a diagnostic tool, not a gate.

```javascript
var heroSize = Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
var bodySize = Math.max(14, Math.min(24, Math.min(w, h) * 0.14));
var whisperSize = Math.max(8, Math.min(11, Math.min(w, h) * 0.07));

// Hero — bold, full opacity
ctx.font = 'bold ' + heroSize + 'px ' + theme.FONTS.data;
ctx.fillStyle = t.text;

// Body — regular weight, reduced opacity
ctx.font = bodySize + 'px ' + theme.FONTS.data;
ctx.fillStyle = t.textDim;

// Whisper — uppercase, very dim
ctx.font = whisperSize + 'px ' + theme.FONTS.ui;
ctx.fillStyle = t.textFaint;
ctx.fillText(label.toUpperCase(), x, y);
```

| Unit text | `heroSize * 0.45` | 8 | 28 | Same as hero | Suffix/prefix |
| Padding | `Math.max(8, Math.min(w, h) * 0.04)` | 8 | — | — | Element spacing |
| Icon | `Math.min(w, h) * 0.6` | 16 | 200 | — | Panel icon |

**User override pattern:** `0` = auto, positive value = explicit.

```javascript
var userSize = parseInt(getOption(config, ns, 'fontSize', '0'), 10);
var fontSize = userSize > 0
    ? userSize
    : Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
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

### Motion timing constants — animation discipline

Canvas animations must follow consistent timing to feel professional.
Random durations and easings make the dashboard feel janky.

**Duration tiers:**
| Tier | Duration | When to use | Example |
|---|---|---|---|
| Instant | 50-100ms | Hover highlight, cursor change | Cell highlight on mouseover |
| Micro | 150-200ms | Value update, color transition | KPI number change |
| State | 250-350ms | Panel reveal, gauge fill | Gauge arc animation on load |
| Entrance | 400-600ms | First render, page transition | All vizs fade in on load |

**Easing functions (ES5):**
```javascript
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

**Usage pattern:**
```javascript
// Animate gauge from 0 to target value over 350ms
var startTime = null;
var targetPct = 0.73;

function animateGauge(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / 350, 1);
    var eased = easeOutQuart(progress);
    var currentPct = targetPct * eased;

    ctx.clearRect(0, 0, w, h);
    drawGaugeArc(ctx, currentPct);

    if (progress < 1) {
        requestAnimationFrame(animateGauge);
    }
}
requestAnimationFrame(animateGauge);
```

**Rules:**
- Exit animations = 75% of entrance duration (feels snappier)
- Never animate more than 2 elements simultaneously (Christmas tree effect)
- `requestAnimationFrame` over `setInterval` for smooth 60fps
- Clean up in `destroy()` — cancel pending frames with a flag:
  `this._animating = false;` in destroy, check in animation loop
- Respect `prefers-reduced-motion`: skip entrance animations,
  keep functional transitions (hover highlight still works)

**What NOT to animate:**
- Don't animate on every data update — only on first render or
  significant value changes (>10% delta)
- Don't use bounce or elastic easing — feels dated and cheap
- Don't animate text content (numbers counting up) unless it's
  the HERO metric — it's distracting on supporting vizs

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


## Mood recipes + accent intensity

Advanced atmospheric Canvas effects (ambient light, glass panels,
noise texture, vignette, data glow, cinematic typography, gradient
mesh, accent lines, inner shadow, pulse ring) and the accentIntensity
multiplier pattern are documented in:

**[MOOD-RECIPES.md](MOOD-RECIPES.md)** — read when you want to add
atmosphere to a viz. Not needed for basic functional vizs.
