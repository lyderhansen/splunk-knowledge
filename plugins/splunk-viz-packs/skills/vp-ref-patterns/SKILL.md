---
name: vp-ref-patterns
description: "Advanced Canvas 2D rendering recipes for Splunk custom vizs — shapes, effects, animation, sparklines, typography systems, hover tooltips, and mood-based design recipes. ES5 only."
when_to_use: "Use when writing complex Canvas rendering code. Triggers on 'glow effect', 'sparkline', 'animation recipe', 'tooltip system', 'gradient mesh', 'mood recipe', 'tinted neutrals', 'accent intensity'."
---

# vp-ref-patterns — advanced Canvas 2D recipes

Basic recipes (roundRect, drawArc, lerpColor, fitText, gridLayout) are in `vp-viz/references/canvas-recipes.md`. This skill has advanced patterns.

## Quick reference — what's where

| Need | Section in references |
|---|---|
| Shapes (roundRect, pill, circle) | Shape primitives |
| Colors (lerp, alpha, tint neutrals) | Color utilities |
| Text (fit, truncate, 3-tier system) | Text utilities + Typographic tension |
| Effects (glow, shadow, glass, grain) | Effects |
| Sparklines | Sparkline (micro chart) |
| Animation (easing, frame loop) | Animation |
| Hover tooltip system | Hover tooltip system |
| Number formatting | Number formatting with decimals |
| Mood recipes + accent intensity | Mood recipes |
| KPI vertical stacking | KPI tile vertical stacking |

## Key patterns to know

**Tinted neutrals** — warm greys toward brand hue:
```javascript
function tintNeutral(grey, brandHex, amount) {
    return lerpColor(grey, brandHex, amount || 0.04);
}
```

**Accent intensity** — user-controlled effect strength:
```javascript
var gi = parseFloat(opt('accentIntensity', '50')) / 50;
ctx.shadowBlur = 12 * gi;
```

**Canvas effects stacking order:**
1. Background (clearRect or theme bg)
2. Grid/guide lines
3. Data fills (bars, arcs, areas)
4. Glows and shadows (reset shadowBlur after!)
5. Text labels and values (globalAlpha = 1!)
6. Hover highlight
7. Tooltip (DOM, not canvas)

## References

- **[All patterns](references/all-patterns.md)** — shapes, colors, text, effects, sparklines, animation, tooltip, parsing, number formatting (~900 lines)
- **[Mood recipes](references/mood-recipes.md)** — 9 moods with Canvas code, accent intensity curves, tinted neutral recipes (~400 lines)
