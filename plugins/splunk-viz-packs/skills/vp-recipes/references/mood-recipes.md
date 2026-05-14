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

| Technique | Low density | Medium density | High density |
|---|---|---|---|
| Ambient light | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Glass panel | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Noise texture | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Carbon hatch | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Vignette | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Data glow | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Letter spacing | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Gradient mesh | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Accent lines | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Inner shadow | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |
| Pulse ring | Subtle, professional | Atmospheric, immersive | Dramatic, overwhelming (use with care) |

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
