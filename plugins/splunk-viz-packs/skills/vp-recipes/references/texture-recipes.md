# Texture Recipes

Surface texture Canvas effects that make panels and backgrounds feel tangible.
Load for: Organic / Luxury mood; any viz requiring surface quality.

---

### drawNoiseTexture — DPR-07

<!-- DPR-07: Noise grain micro-texture | Mood gate: Organic/Luxury | WARNING: cache to offscreen canvas on large panels -->

Adds tactile quality — the surface feels REAL, not digital. Keep opacity
very low (0.015-0.03) or it becomes distracting. On large panels, this is
expensive — always cache to an offscreen canvas for reuse.

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
// Usage: drawNoiseTexture(ctx, w, h, 0.02);
// Place as LAST atmosphere layer, before data elements
```

**Offscreen canvas caching pattern (required for panels > 400x400):**

```javascript
// In initialize():
this._noiseCanvas = null;

// In _render():
if (!this._noiseCanvas || this._noiseCanvas.width !== w) {
    this._noiseCanvas = document.createElement('canvas');
    this._noiseCanvas.width = w;
    this._noiseCanvas.height = h;
    var nCtx = this._noiseCanvas.getContext('2d');
    drawNoiseTexture(nCtx, w, h, 0.02);
}
ctx.drawImage(this._noiseCanvas, 0, 0);
```

---

### drawGlassPanel — DPR-06

<!-- DPR-06: Glass panel simulation | Mood gate: Luxury/Futuristic -->

Simulates backdrop-filter blur with a layered approach: semi-transparent
fill + bright top edge + subtle inner shadow. Creates depth hierarchy
between panel foreground and canvas background.

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
// Usage: drawGlassPanel(ctx, padX, padY, panelW, panelH, t.panel, 8);
```

---

### drawCarbonHatch

<!-- Diagonal hatch / carbon fiber micro-texture | Mood gate: Industrial/Precision -->

Lighter than noise, creates a technical/precision feel. The repeating
diagonal lines read as machined surface — appropriate for dashboards
with an engineering or automotive brand identity.

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
// Usage: drawCarbonHatch(ctx, w, h, 0.012, 6);
// Place AFTER background, BEFORE data — very subtle
```

---

### tintNeutral — DPR-02

<!-- DPR-02: Brand-tinted panel backgrounds | ALWAYS use instead of generic grey | Phase 8 check: DQG-04 WARN if absent -->

Pure grey (#808080, #333333) looks dead on screen. Always add a tiny amount
of chroma toward the brand hue. This is the OKLCH "tinted neutral" technique
used by every high-end design system.

```javascript
function tintNeutral(grey, brandHex, amount) {
    if (!amount) amount = 0.04;
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

**Tint amounts by surface:**

| Surface | Amount | Why |
|---|---|---|
| Canvas background | 0.05-0.08 | Strongest tint, sets the atmosphere |
| Panel/card background | 0.03-0.05 | Slightly less than canvas |
| Borders/edges | 0.02-0.03 | Subtle, just enough warmth |
| Text (dim) | 0.01-0.02 | Barely visible, keeps harmony |

**Why it matters:** A dashboard with `bg: #0B0C0E` and `panel: #141519`
(pure greys) looks generic. The same dashboard with `bg: #0B0D12` and
`panel: #141721` (tinted 5% toward navy) looks crafted.

---

### Cross-references

- **[design-principles.md](../../vp-design/references/design-principles.md)** — universal rules these textures implement (DPR-02, DPR-06, DPR-07)
- **[mood-recipes.md](mood-recipes.md)** — original mood context and accent intensity multiplier
- **[depth-recipes.md](depth-recipes.md)** — spatial depth effects (gradients, vignette, ambient light)
