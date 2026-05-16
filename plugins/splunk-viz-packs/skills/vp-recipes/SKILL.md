---
name: vp-recipes
description: "Advanced Canvas 2D rendering recipes for Splunk custom vizs — shapes, effects, animation, sparklines, typography systems, hover tooltips, and mood-based design recipes. ES5 only."
when_to_use: "Use when writing complex Canvas rendering code. Triggers on 'glow effect', 'sparkline', 'animation recipe', 'tooltip system', 'gradient mesh', 'mood recipe', 'tinted neutrals', 'accent intensity'."
---

# vp-recipes — advanced Canvas 2D recipes

Basic recipes (roundRect, drawArc, lerpColor, fitText, gridLayout) are in `vp-viz/references/canvas-recipes.md`. This skill has advanced patterns — the 5 most used are inline below, the rest in references.

## Top 5 patterns — inline

### 1. Tinted neutrals (every viz needs this)

Pure grey looks dead. Add 3-8% chroma toward brand hue:

```javascript
function tintNeutral(grey, brandHex, amount) {
    if (!amount) amount = 0.04;
    var r1 = parseInt(grey.slice(1,3),16), g1 = parseInt(grey.slice(3,5),16), b1 = parseInt(grey.slice(5,7),16);
    var r2 = parseInt(brandHex.slice(1,3),16), g2 = parseInt(brandHex.slice(3,5),16), b2 = parseInt(brandHex.slice(5,7),16);
    var r = Math.round(r1 + (r2-r1)*amount), g = Math.round(g1 + (g2-g1)*amount), b = Math.round(b1 + (b2-b1)*amount);
    return '#' + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
}
```

| Surface | Amount | Why |
|---|---|---|
| Canvas bg | 0.05–0.08 | Strongest tint, sets atmosphere |
| Panel bg | 0.03–0.05 | Slightly less than canvas |
| Borders | 0.02–0.03 | Subtle warmth |

### 2. Typographic tension (3-tier size system)

Hero text 4-6x larger than labels creates hierarchy. All sizes dynamic:

```javascript
var heroSize   = Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
var bodySize   = Math.max(14, Math.min(24, Math.min(w, h) * 0.14));
var whisperSize = Math.max(8, Math.min(11, Math.min(w, h) * 0.07));
```

| Tier | Opacity | Font | Role |
|---|---|---|---|
| Hero | 100% `t.text` | bold, FONTS.data | ONE dominant value |
| Body | 60-80% `t.textDim` | regular, FONTS.data | Supporting values |
| Whisper | 25-35% `t.textFaint` | regular, FONTS.ui, UPPERCASE | Labels, metadata |

### 3. Accent intensity (user-controlled effect strength)

Let users dial glow/shadow effects from subtle to dramatic:

```javascript
var gi = parseFloat(opt('accentIntensity', '50')) / 50;
ctx.shadowColor = accent;
ctx.shadowBlur = 12 * gi;
// ... draw element ...
ctx.shadowBlur = 0; // ALWAYS reset
```

Formatter: radio input with values `"25"`, `"50"`, `"75"`, `"100"`.

### 4. Number formatting (compact + decimals)

```javascript
function fmtNum(v, opts) {
    opts = opts || {};
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (opts.compact && abs >= 1e3) {
        if (abs >= 1e9) return (v/1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (v/1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (v/1e3).toFixed(1) + 'k';
    }
    if (opts.fixed !== undefined) return v.toFixed(opts.fixed);
    return Math.round(v).toLocaleString('en-US');
}
```

Decimals from formatter: `var dec = parseInt(opt('decimals', '0'), 10);`

### 5. Canvas effects stacking order

Draw in this EXACT order — violations cause visual artifacts:

1. Background (`ctx.clearRect`)
2. Grid/guide lines (`withAlpha(t.edge, 0.15)`)
3. Data fills (bars, arcs, areas)
4. Glows and shadows (**reset `shadowBlur = 0` after!**)
5. Text labels and values (**`globalAlpha = 1` before text!**)
6. Hover highlight (conditional)
7. Tooltip (DOM element, not canvas)

Common bug: forgetting step 4/5 resets. Shadow leaks into all subsequent draws. Alpha from a glow effect makes text 30% visible.

## Quick reference — more patterns in references

| Need | Section in references |
|---|---|
| Shapes (roundRect, pill, circle, drawPanel) | Shape primitives |
| Colors (withAlpha, lerpColor, severityColor) | Color utilities |
| Text (fitText, truncate) | Text utilities |
| Effects (glow, shadow, glass, grain) | Effects |
| Sparklines (micro chart) | Sparkline |
| Animation (easing, frame loop, setInterval) | Animation |
| Hover tooltip system | Hover tooltip system |
| Delta arrows (up/down indicators) | Delta arrow |
| Mood recipes + branded gradients | Mood recipes |
| KPI vertical stacking | KPI tile vertical stacking |

## References

- **[All patterns](references/all-patterns.md)** — index of all Canvas patterns; load to find the right file for your need (~200 lines)
- **[Mood recipes](references/mood-recipes.md)** — 9 moods with Canvas code, accent intensity curves, tinted neutral recipes (~400 lines)
- **[Depth recipes](references/depth-recipes.md)** — gradients, ambient light, vignette, gradient mesh, accent lines
- **[Texture recipes](references/texture-recipes.md)** — noise grain (with offscreen cache), glass panels, tinted neutrals, diagonal hatch
- **[Typography recipes](references/typography-recipes.md)** — 3-tier hierarchy, measureText-before-draw, cinematic letter spacing

Full Canvas drawing code:
- **[Canvas recipes](../vp-viz/references/canvas-recipes.md)** — shapes, colors, hover/drilldown, grid layout, sparklines
- **[Formatter patterns](../vp-viz/references/formatter-patterns.md)** — all formatter.html templates and section structure
