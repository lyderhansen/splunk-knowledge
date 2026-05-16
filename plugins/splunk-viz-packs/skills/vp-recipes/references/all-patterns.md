# All Patterns — Navigation Index

This file is a navigation index. It describes each pattern category and tells you
which file to load for the full code. Load the destination file when you need to write
code in that category — not this index.

## Canvas drawing patterns → canvas-recipes.md

---

## Shape primitives

Three shape helpers used in nearly every viz: `roundRect` with boundary guards, `drawPanel`
for bordered card backgrounds, and `drawPill` for chip/badge shapes. Default panel radius
is 6px — vary per brand.
Includes: `roundRect`, `drawPanel`, `drawPill`.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Shape primitives section
**Load when:** You are drawing panels, cards, badges, or any rounded container.

---

## Color utilities

Hex/RGBA conversion, color interpolation, severity semantic mapping, branded gauge gradients,
and tinted neutrals. Tinted neutrals push pure grey toward the brand hue for a crafted look.
Includes: `withAlpha`, `lerpColor`, `severityColor`, `tintNeutral`, branded gauge gradient pattern.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Color utilities section
**Load when:** You need color math, severity semantics, or brand-tinted backgrounds.

---

## Text utilities

Dynamic font sizing that shrinks to fit a container, compact number formatting, and a delta
arrow indicator for trend values. Use `fitText` before any `fillText` call with fixed width.
Includes: `fitText`, `fmtNum`, `drawDelta`.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Text utilities section
**Load when:** You are sizing dynamic text, formatting numbers, or drawing trend arrows.

---

## Typographic tension — 3-tier size system

Hero / Body / Whisper size formulas that create dramatic visual hierarchy. Hero is 4-6x
larger than whisper, creating the "wait, that's Splunk?" effect. Includes user override pattern.
Includes: heroSize, bodySize, whisperSize formulas, `fontSize` user override.
Full code: [typography-recipes.md](typography-recipes.md) — Typographic tension section
**Load when:** You are laying out a KPI or any viz with a dominant value + supporting labels.

---

## KPI tile vertical stacking

Additive Y positioning for label/value/trend elements that works at any panel height, from
compact tiles (100px) to full panels. Never use percentage-of-height for KPI stacking.
Includes: `labelY`, `valueY`, `trendY` additive positioning pattern.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — KPI tile vertical stacking section
**Load when:** You are building a KPI tile or any panel with stacked text elements.

---

## Effects

Five atmospheric Canvas effects: drop shadow (multi-pass), neon glow text, CRT scanlines,
radial vignette, and edge fade gradient. Stack these on the background, not on data elements.
Includes: `drawShadow`, `drawGlowText`, `drawScanlines`, `drawVignette`, `drawEdgeFade`.
Full code: [depth-recipes.md](depth-recipes.md) — Effects section
**Load when:** You are adding atmosphere (glow, scanlines, vignette) to a viz.

---

## Sparkline (micro chart)

Compact time-series chart drawn into a small bounding box. Supports line mode and area-fill
mode. Auto-scales to min/max of the data series. Works inside table cells or KPI tiles.
Includes: `drawSparkline`.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Sparkline section
**Load when:** You need a micro trend chart alongside a KPI value.

---

## Horizontal gridlines

Subtle horizontal reference lines for bar and line charts. Uses `t.grid` token which is
typically 4-6% opacity — subtle enough to guide the eye without competing with data.
Includes: `drawHGrid`.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Horizontal gridlines section
**Load when:** You are drawing a chart that needs axis reference lines.

---

## Data rendering principles

Five rules that apply to every data-displaying viz: trend over decoration, direct labeling
for <8 items, monospaced figures for all numerics, color not as sole indicator, stagger
entrance for lists.
Includes: staggered row entrance pattern.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Data rendering principles section
**Load when:** You are making decisions about chart labeling, legends, or entrance animation.

---

## Animation

Two animation approaches: a continuous `setInterval` loop for ongoing effects (pulse, breathe,
spin), and `requestAnimationFrame` for one-shot entrance animations. Includes easing functions,
motion timing tiers, and rules on what NOT to animate.
Includes: timer lifecycle, `easeOutQuart`, `easeOutExpo`, `easeInOutCubic`, animation modifiers table.
Full code: [animation-recipes.md](animation-recipes.md) — Animation section
**Load when:** You are adding entrance animation, pulse effects, or gauge fill animation.

---

## Canvas effects stacking order

Nine-step draw order for combining multiple effects correctly: globalAlpha → transforms →
shadow → glow → fill → inner shadow → pattern → stroke → text. Each layer must be
wrapped in save/restore.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Canvas effects stacking order section
**Load when:** You are stacking multiple Canvas effects on a single element.

---

## Parsing config values

Three helpers for safely reading formatter values from config: comma-separated color lists,
boolean toggles, and numeric values with fallback. Use these instead of raw string parsing.
Includes: `parseColors`, `parseBool`, `parseNum`.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Parsing config values section
**Load when:** You need to parse multi-color config, boolean toggles, or numeric settings.

---

## Hover tooltip system

Complete hover tooltip implementation: DOM element setup in `initialize`, `_onMouseMove`
handler with edge-flip positioning, and hit-test patterns for rectangular regions, donut
segments, and line/area charts. Includes hover visual effects per viz type.
Includes: tooltip setup, `_onMouseMove`, `_hitTest` variants, hover visual effects, `destroy` cleanup.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Hover tooltip system section
**Load when:** You are implementing interactive hover on any Canvas viz (mandatory).

---

## Category badge colors

Pattern for drawing pill-shaped status badges with dynamic colors from formatter config or
theme series tokens. Two variants: positional color cycling and severity-semantic coloring.
Includes: `badgeColor`, `statusColor`, pill drawing pattern.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Category badge colors section
**Load when:** You are drawing status badges, category chips, or legend swatches.

---

## Number formatting with decimals control

`formatValue` wrapper that applies a user-controlled decimal count instead of relying on
compact rounding. Compact mode truncates 7.27 → 7; explicit decimals=2 gives 7.27.
Includes: `formatValue`, `decimals` formatter setting pattern.
Full code: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Number formatting with decimals section
**Load when:** You are displaying KPI values or any numeric with user-controlled precision.

---

## Formatter HTML patterns → formatter-patterns.md

---

## Formatter templates and section structure

All formatter HTML templates (text input, radio toggle, color picker, theme selector, section
wrapper), the WRONG patterns block, the 3-section structure with exact casing, B7 field
defaults pattern, and the B3 getOption helper.
Full code: [formatter-patterns.md](../vp-viz/references/formatter-patterns.md)
**Load when:** You are writing formatter.html for any viz.

---

## Mood recipes and accent intensity

Advanced atmospheric Canvas effects (ambient light, glass panels, noise texture, vignette,
data glow, cinematic typography, gradient mesh, accent lines, inner shadow, pulse ring) and
the accentIntensity multiplier pattern.
Full code: [mood-recipes.md](mood-recipes.md)
**Load when:** You want to add strong atmosphere to a viz beyond basic effects.
