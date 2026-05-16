# Depth Recipes

Depth and atmosphere Canvas effects that create spatial dimension on dark-theme vizs.
Load for: dark theme; Futuristic / Luxury / Precision / Power mood.

---

### drawAmbientLight — DPR-04

<!-- DPR-04: Ambient light on dark theme | Phase 8 check: WARN if absent on Futuristic/Luxury mood -->

A subtle radial gradient from one corner creates a sense of physical space —
the dashboard feels LIT, not flat. Place AFTER background fill, BEFORE data elements.

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

---

### drawVignette — DPR-05

<!-- DPR-05: Vignette on dark theme | Phase 8 check: WARN if absent on dark mood vizs -->

Darkens edges, naturally draws focus to center content. Creates depth
without competing with data elements for attention.

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
// Usage: drawVignette(ctx, w, h, 0.25);
// Place AFTER ambient light, BEFORE data layers
```

---

### drawGradientMesh — DPR-09

<!-- DPR-09: Gradient mesh background | Mood gate: Futuristic/Luxury -->

Two overlapping radial gradients create depth that a single linear gradient
cannot achieve. Provides a rich multi-point background atmosphere.

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

---

### drawAccentLines — DPR-10

<!-- DPR-10: Geometric accent lines | Mood gate: Precision/Power -->

Technical decorative lines that say "precision engineering." Place behind
data elements, never on top. Creates structure without competing with data.

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
// Usage: drawAccentLines(ctx, w, h, t.accent, 0.05);
// Place BEFORE data elements, AFTER background/vignette
```

---

### Gradient bar fill — DPR-03

<!-- DPR-03: All data elements use gradient fills, never flat solid | Phase 8 check: DQG-01 WARN -->

Every bar, arc, and filled data element uses `createLinearGradient` or
`createRadialGradient` for depth. Flat solid fills read as "unfinished."

```javascript
// Bar fill — vertical gradient for depth
var grad = ctx.createLinearGradient(x, y, x, y + barH);
grad.addColorStop(0, t.accent);
grad.addColorStop(1, withAlpha(t.accent, 0.5));
ctx.fillStyle = grad;
ctx.fillRect(x, y, barW, barH);

// Arc fill — radial gradient for gauge segments
var arcGrad = ctx.createLinearGradient(x, y, x + segW, y + segH);
arcGrad.addColorStop(0, color);
arcGrad.addColorStop(1, withAlpha(color, 0.6));
ctx.strokeStyle = arcGrad;
ctx.stroke();
```

**Rule:** Never use a flat solid fill (`ctx.fillStyle = t.accent; ctx.fill()`)
for data-carrying elements. Stroke-only elements (gridlines, borders, tick
marks) are exempt.

---

### Drop shadow / neon glow

Multi-pass shadow and glow effects that add visual weight to elements.
Use sparingly — one hero glow per viz, not every element.

#### drawShadow — multi-pass for intensity

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
// Usage: drawShadow(ctx, function(c) { roundRect(c, x, y, w, h, r); }, 2, '#000', 12, 0, 4);
```

#### drawGlowText — neon text effect

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
// Usage: drawGlowText(ctx, '99.7%', cx, cy, 'bold 48px mono', '#00FF88', 16);
```

#### CRT scanlines

```javascript
function drawScanlines(ctx, w, h, opacity) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (opacity || 0.15) + ')';
    for (var y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
}
// Usage: drawScanlines(ctx, w, h, 0.08); // very subtle
```

#### Edge fade gradient

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
// Usage: drawEdgeFade(ctx, 'right', w, h, 40, t.bg);
```

---

### Cross-references

- **[design-principles.md](../../vp-design/references/design-principles.md)** — universal rules these effects implement (DPR-03 through DPR-10)
- **[mood-recipes.md](mood-recipes.md)** — original mood context and accent intensity multiplier
- **[texture-recipes.md](texture-recipes.md)** — surface quality effects (noise grain, glass, tinted neutrals)
