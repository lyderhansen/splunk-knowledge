# Quality bar — what "designer-grade" means

This file defines the visual quality target for `mockup.html`. The goal is output that an experienced UX/UI designer would claim as their own work.

Concrete reference: a passing mockup at this bar will feel like a published design — CRT scanlines or noise textures where the brand calls for them, per-element animations that serve communication (not decoration), tyre/gradient/heatmap-style visuals that look like a designer hand-tuned them, and tooltips that respond instantly. If you've seen the Bloomberg Terminal, an F1 pit-wall display, or a Tektronix oscilloscope manual, aim for that level of intentionality.

## Visual rhythm — the 60-30-10 rule applied

- 60% of the visual weight: surface and background, tinted neutral toward brand primary
- 30%: brand primary and panel surfaces
- 10%: accent color — used sparingly for emphasis only

Accents work BECAUSE they're rare. Overuse kills their power.

## Typography — modular scale, no flat hierarchy

Use exactly three font sizes per viz:
- **Hero** (4-6× body) — the one dominant value
- **Body** (regular) — supporting values
- **Whisper** (25-35% opacity, UPPERCASE, narrow tracking) — labels, metadata

Aim for at least a 1.5 ratio between Hero and Body. A flat hierarchy where sizes are 1.1× apart is the AI default.

## Spacing — 4pt grid with rhythm

Use a 4pt spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Vary spacing for hierarchy. A heading with extra space above it reads as more important. Don't apply the same padding everywhere.

## Color discipline — OKLCH, tinted neutrals

- Tint neutrals toward the brand hue (chroma 0.005-0.01 is enough to feel cohesive without being obvious)
- Reduce chroma toward extreme lightness — pure-saturated colors at 85% lightness look garish
- Light theme is independently designed, not an inversion of dark

## Effects — purposeful, not decorative

Each effect must serve communication, not exist for its own sake:

- **Glow** — directs attention to a critical state (e.g., breach threshold)
- **Shadow** — establishes depth (panel rises above background)
- **Gradient** — implies dimensionality (data bar has a top-light direction)
- **Animation** — communicates change (data update pulse, hover state)

Carbon fiber / noise texture / radial wash backgrounds: ONLY when the brand calls for them (e.g., motorsport, luxury, industrial). Not as a default.

## SVG arc geometry

Every concentric-arc mockup (radial gauges, ring meters, donut progress) MUST compute its arc
endpoints from `start_angle + sweep_angle + radius` using trig — never approximate by eye. The
test52 failure (Correction #22) was a 270° gauge arc drawn with eyeballed endpoints `(-95, 32)`
and `(95, 32)` that did not sit on the r=100 circle, which rendered as two disconnected colored
segments instead of one continuous arc.

The canonical helper:

```javascript
// For an arc on a circle of radius r centered at (cx, cy):
// angle in degrees, 0deg = 12 o'clock, increasing clockwise.
function arcPoint(cx, cy, r, angleDeg) {
  var a = (angleDeg - 90) * Math.PI / 180;  // -90 so 0deg = 12 o'clock
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
// 270deg arc opening at the bottom of an r=100 circle centered at origin:
//   start = arcPoint(0, 0, 100, 225)           -> lower-left
//   end   = arcPoint(0, 0, 100, 135)           -> lower-right (clockwise 270deg)
//   value end at 93% sweep: arcPoint(0, 0, 100, 225 + 270 * 0.93)
```

Angle convention committed here: degrees, `0deg = 12 o'clock`, increasing **clockwise**. A
bottom-opening 270° arc therefore starts at `225` (lower-left), sweeps clockwise through the top,
and ends at `135` (lower-right) — a full `270` of sweep. The value tip for a fractional reading is
`arcPoint(cx, cy, r, start_angle + sweep_angle * fraction)`.

The rule: compute endpoints from `start_angle + sweep_angle + radius`, never approximate. Keep the
helper ES5 (`var` / `function`, no `const`/`let`/arrow functions) so it ports cleanly into the
Splunk Canvas viz at cv-create.

## What "designer-grade" specifically requires

A non-designer looking at the mockup should NOT be able to say "an AI made this." The mockup should make them ask "how was this made?"

Concrete tells of AI output to avoid:

| AI tell | What designer-grade does |
|---|---|
| Identical card grid repeated | Vary card sizes/shapes by content importance |
| Same padding everywhere | Rhythm: tight for related items, generous for sections |
| Centered everything | Mix alignments; left-align by default |
| Inter / DM Sans default fonts | Brand-considered display + mono pair |
| Purple-blue gradient bg | Brand-derived surface with subtle radial accent |
| Rounded card + drop shadow default | Decide per-element if rounding adds meaning |
| "Live data" decorative sparklines | Only show sparklines that convey real trend information |
| Big number + tiny label KPI template | Vary KPI presentation; some hero, some inline |

## The Slop Test (executed at end of Stage B)

Before showing the mockup to the user, run the 10-question Slop Test from [slop-test.md](slop-test.md). For any "yes" answer, fix the HTML before proceeding to Stage D.

## Inspiration sources to consult (NOT to copy)

When stuck on visual direction, browse for **physical** references rather than digital ones:

- Industrial design: Dieter Rams Braun catalogs, Tektronix oscilloscopes, mid-century radio sets
- Print: Swiss design (Müller-Brockmann), Wim Crouwel grids, editorial magazines (Wallpaper, Monocle)
- Cinema: Kubrick interfaces, Blade Runner UIs, F1 broadcast graphics, Bloomberg terminal
- Signage: airport departure boards, race timing boards, gas station price displays

The HTML mockup should feel like one of these things if you squint at it, not like a website.
