# Typography Recipes — load for all vizs with text labels (nearly always)

Responsive text sizing, hierarchy, and cinematic effects for Canvas 2D vizs.
Every viz with text labels benefits from these patterns.

---

### 3-tier typography hierarchy — DPR-01

<!-- DPR-01: Every viz uses hero/body/whisper sizing | UNIVERSAL — not mood-gated | Phase 8 check: DQG-03 FAIL if no responsive font sizing -->

Great design has DRAMATIC size contrast — not everything slightly different,
but hero text 4-6x larger than labels. The ratio creates visual hierarchy
that tells the eye where to look.

**Formula:**

```javascript
var heroSize   = Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
var bodySize   = Math.max(14, Math.min(24, Math.min(w, h) * 0.14));
var whisperSize = Math.max(8,  Math.min(11, Math.min(w, h) * 0.07));
```

**Tier usage table:**

| Tier | Opacity | Weight | Font | Role |
|---|---|---|---|---|
| Hero | 100% `t.text` | bold | `FONTS.data` | ONE dominant value per viz |
| Body | 60-80% `t.textDim` | regular | `FONTS.data` | Supporting values, secondary |
| Whisper | 25-35% `t.textFaint` | regular, UPPERCASE | `FONTS.ui` | Labels, headers, metadata |

**Usage:**

```javascript
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

**Guideline:** aim for hero divided by whisper >= 4:1 for dramatic hierarchy.
But some brands (brutalist, data-dense) intentionally flatten the hierarchy.
The ratio is a diagnostic tool, not a gate.

**User override pattern:** `0` = auto, positive value = explicit.

```javascript
var userSize = parseInt(getOption(config, ns, 'fontSize', '0'), 10);
var fontSize = userSize > 0
    ? userSize
    : Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
```

---

### theme.getTypoScale — CON-03 shortcut

The preferred shared-function usage pattern. `theme.getTypoScale` is defined
in `shared/theme.js` (added via theme-template.md in Phase 6 Plan 03) and
inlined into every viz by build_flat.js.

```javascript
// Use theme.getTypoScale instead of inline formulas
var typo = theme.getTypoScale(w, h);
ctx.font = 'bold ' + typo.hero + 'px ' + theme.FONTS.data;
// typo.body for secondary values
// typo.whisper for labels and metadata
```

This guarantees consistent sizing across all vizs in a pack — CON-03 compliance.

---

### fitText — measureText-before-draw

<!-- Measure text width before positioning — prevents overflow clipping -->

Always measure text before drawing. If the text exceeds available width,
reduce font size until it fits. Prevents clipped or overflowing labels.

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
// Usage: var actualSize = fitText(ctx, longLabel, panelW - 20, 48, 10, theme.FONTS.data);
// ctx.font = 'bold ' + actualSize + 'px ' + theme.FONTS.data;
// ctx.fillText(longLabel, x, y);
```

**Rule:** Call `ctx.measureText(text).width` before ANY text positioning.
Never assume text fits — data values vary in length.

---

### drawSpacedText — DPR-08

<!-- DPR-08: Cinematic letter spacing for whisper-tier uppercase labels | Use for LABELS, not data values -->

Canvas has no letter-spacing property. Draw character by character for
headlines that feel designed, not rendered. Use ONLY for whisper-tier
uppercase labels (e.g., "TELEMETRY", "STATUS") — never for data values.

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
// ctx.font = whisperSize + 'px ' + theme.FONTS.ui;
// ctx.fillStyle = t.textFaint;
// drawSpacedText(ctx, 'TELEMETRY', cx, 20, 4);
```

**Spacing values by context:**

| Context | Spacing (px) | Why |
|---|---|---|
| Section headers | 3-4 | Subtle separation, professional feel |
| Status labels | 2-3 | Tight but distinct |
| Hero labels (rare) | 5-8 | Dramatic, cinematic |

---

### Cross-references

- **[design-principles.md](../../vp-design/references/design-principles.md)** — DPR-01 universal typography rule
- **[consistency-grid.md](../../vp-design/references/consistency-grid.md)** — CON-03 getTypoScale formula and compliance check
- **[mood-recipes.md](mood-recipes.md)** — original drawSpacedText context
