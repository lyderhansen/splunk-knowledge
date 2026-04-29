---
name: ds-ref-themes
description: Light vs dark theme parity for Splunk dashboards — perceptual equivalence rules (not just inversion), OKLCH-based luminance/chroma adjustments, when chroma is preserved vs dampened, dark-NOC variant (pure-black canvas, neon accents), and the rules that make_light.py operates on. Use when converting a dashboard between themes, when authoring a dual-theme dashboard, or when ds-deploy needs to know which theme variant to ship.
---

# ds-ref-themes — Light vs dark theme parity

> **Status:** skeleton only. Body authored partly from `make_light.py` source comments + new content in a follow-up task.

## Scope (what's IN)

- Perceptual equivalence (not pixel-flip inversion).
- OKLCH luminance + chroma rules per element type.
- Dark vs Dark-NOC vs Light variant differences.
- Documented rules `make_light.py` operates on.
- Theme decision tree (when to start dark, when light, when both).
- Cross-theme palette mapping.

## Out of scope (what's NOT here)

- Concrete hex values — see `ds-ref-color`.
- The script `make_light.py` itself (lives in `scripts/`) — this skill documents the rules; the script is the implementation.
- Per-archetype theme bias — see `ds-ref-archetypes` / `ds-ref-personas`.

## Consults

- `ds-ref-color` (cross-theme palette math).

## Consulted by

- `ds-couture` (theme decision early in Design Context Protocol).
- `ds-deploy` (light-variant generation).
- `ds-polish` (theme-correctness checks).

## Source / migration

- Some content from `make_light.py` source comments (color-mapping rules).
- New content: perceptual equivalence theory, dark-NOC variant rules, theme decision tree.

## Estimated size

M

---

## Why theme parity matters

Light theme is **not** dark theme with `background-color` and `color` flipped.
A pixel-flip inversion produces a dashboard that technically renders on a
light canvas but reads wrong: status colors look garish, gridlines either
disappear or shout, mid-tones turn muddy, and the implicit hierarchy that
worked in dark collapses. Parity is a perceptual property, not an
arithmetic one.

Four reasons the naive flip fails:

1. **Same chroma reads more saturated at light luminance.** A series red
   `oklch(0.62 0.18 25)` on a near-black canvas reads as a calm, deliberate
   accent. The same chroma on a near-white canvas reads as candy. The eye
   is more sensitive to chroma at high lightness, so light-theme palettes
   need their chroma dampened (typically 10–30%) to match the perceived
   intensity of the dark counterpart.

2. **Status colors must remain instantly recognisable.** Critical-red,
   warning-amber, healthy-green carry semantic weight that should not
   shift between themes. The dark-theme `#FF2D95` (a hot pink) reads as
   "critical" in dark mode, but on a light canvas the same hex looks
   flippant — too playful for an alert. The light variant
   `#C2185B` is the same semantic role recoded for the destination
   luminance.

3. **Contrast ratios shift non-linearly with luminance.** WCAG contrast
   between white text and a dark canvas is not symmetric to dark text on
   a light canvas because the CIE luminance scale is not linear in
   perceived brightness. A panel-fill that gives a pleasant 1.4×
   contrast-against-canvas in dark may need a different OKLCH delta in
   light to feel equivalently "lifted" off the page.

4. **Mid-tone neutrals (gridlines, axis lines) need different
   treatment.** In dark theme, gridlines are slightly lighter than the
   canvas (`#23262b` on `#0b0c0e`). In light, they need to be slightly
   darker than the canvas (`#ebedef` on `#FAFAF7`). The relationship
   inverts, but the *delta* in OKLCH lightness is not symmetric — light
   gridlines must be more conservative or they look like a printed grid
   from a 1990s spreadsheet.

The rule: **author one theme with intent, derive the other through
perceptual mapping, then sanity-check the derivation.** `make_light.py`
implements one direction (dark → light); the inverse is rarely needed
because dashboards almost always start dark and only get a light variant
for printing or projector destinations.

## Theme decision tree

When does a dashboard start dark vs light vs both?

- **24/7 viewing → start dark.** Almost always. NOC walls, ops
  dashboards, SOC overviews, on-call rotations. Dark canvas reduces eye
  fatigue across long sessions and provides better contrast for
  status-color signal. Sub-variant: NOC wall → use the **Dark-NOC**
  preset (pure-black canvas, neon accents, max contrast).

- **Print / PDF / projector destination → start light.** Print
  reproduces dark canvases as muddy grey at best, illegible at worst.
  Projectors wash out dark colors in lit rooms. Anything destined for a
  PDF report or a paper handout starts light. Sub-variant: executive
  briefings shown in conference rooms with overhead lighting → light.

- **Mixed audience (Slack screenshot + ops dashboard) → author dark,
  generate light.** Author the dashboard dark with intent, then run
  `make_light.py` to produce a light variant. Use this when the same
  dashboard ships to both an always-on display and a weekly emailed PDF.
  The light variant is a derived artifact, not a hand-crafted parallel.

- **Branded dashboard following corporate identity → derive theme from
  brand luminance balance.** If the brand book is light-dominant
  (Stripe, Linear, Apple-style), start light. If brand is dark-dominant
  (Datadog, GitHub-dark, NewRelic), start dark. If brand is balanced
  (Splunk, IBM), default to dark for ops content and light for executive
  content.

- **Unknown context → start dark.** When in doubt, dark is the safer
  default for Splunk Dashboard Studio because the platform's chrome
  (titlebar, side nav) is dark, and a dark dashboard sits visually
  flush. A light dashboard inside dark Splunk chrome creates a jarring
  frame-against-content contrast.

## Dark vs Dark-NOC vs Light variants

| Variant | Canvas | Panel fill | Stroke | Primary text | Use |
|---|---|---|---|---|---|
| Dark | `#0b0c0e` | `#15161a` | `#2C2C3A` | `#FFFFFF` | default ops / analytical |
| Dark-NOC | `#000000` | `#0F1117` | `#1FBAD6` | `#FFFFFF` | wall display, max contrast |
| Light | `#FAFAF7` | `#FFFFFF` | `#E5E5E0` | `#1A1A1A` | exec / print / projector |

Notes:

- **Dark** is the default. The canvas `#0b0c0e` is brand-tinted
  near-black (oklch(0.13 0.005 270)) — slightly warmer/cooler than pure
  `#000000`, which prevents the dashboard from feeling like a void. Panel
  fill `#15161a` is one OKLCH-lightness step up from canvas, which is
  enough to define a card without a hard border in most cases.

- **Dark-NOC** is for wall displays seen from across the room. Pure
  `#000000` canvas maximises contrast with bright accents. Panel stroke
  is the **accent color** (`#1FBAD6` cyan) rather than a neutral grey,
  because at 3-metre viewing distance grey strokes vanish but
  saturated-cyan strokes still define panel boundaries. Use sparingly —
  only for actual wall-display destinations. Do not use Dark-NOC for a
  dashboard viewed at desk distance.

- **Light** is for print / PDF / projector / executive briefings.
  Canvas `#FAFAF7` is a warm off-white (oklch(0.98 0.005 90)) — not pure
  `#FFFFFF`, because pure-white canvases plus pure-white panels collapse
  the lift between them. Panel fill is pure `#FFFFFF` so panels lift
  off the canvas by ~0.02 OKLCH lightness. Stroke `#E5E5E0` is the
  warm-tinted neutral that complements the canvas warmth.

For the full hex catalogue (per-element-type), see `ds-ref-color`. This
table is the **decision summary** — `ds-ref-color` is the catalogue.

## OKLCH luminance rules per element

The variants table above defines the canonical hexes. The OKLCH rules
below explain *why* those hexes are the canonical ones, and how to
derive new variants (a brand-tinted dark, a warm-leaning light) without
breaking parity.

| Element | Dark target L | Light target L | Notes |
|---|---|---|---|
| Canvas | `0.10` – `0.15` | `0.96` – `0.98` | Below 0.05 = void, above 0.99 = pure white = no lift |
| Panel fill | `0.13` – `0.18` | `0.99` – `1.00` | Must be one OKLCH-L step from canvas; otherwise no card definition |
| Stroke | `0.22` – `0.28` | `0.88` – `0.92` | Visible against panel without screaming; chroma stays low |
| Gridline | `0.18` – `0.22` | `0.92` – `0.95` | Slightly less contrast than stroke — gridlines are background, not chrome |
| Axis line | `0.20` – `0.25` | `0.86` – `0.90` | More contrast than gridline; axes are chart structure |
| Primary text | `0.95` – `1.00` | `0.15` – `0.20` | Inverse of canvas; ~10:1 contrast minimum |
| Secondary text | `0.65` – `0.75` | `0.40` – `0.50` | ~4.5:1 — meets WCAG AA but not AAA |
| Tertiary / hint text | `0.50` – `0.60` | `0.55` – `0.65` | ~3:1 — informational only, not for content |

**Chroma rules at extreme lightness.** Chroma must be reduced as
lightness moves toward 0 or 1. The eye perceives chroma more strongly
at high L, so the same hue with the same chroma reads more saturated on
a light canvas than on a dark one.

| Lightness band | Max chroma | Example |
|---|---|---|
| L 0.10 – 0.30 (deep dark) | 0.20 | Status critical at L=0.30 takes chroma 0.18 |
| L 0.30 – 0.55 (mid) | 0.18 | Series mid-tones; safe zone |
| L 0.55 – 0.75 (light mid) | 0.14 | Status critical at L=0.55 drops to chroma 0.14 |
| L 0.75 – 0.95 (high light) | 0.10 | Pastels; light-theme accents |
| L 0.95+ (near-white) | 0.02 | Tinted neutrals only |

So a status red at L=0.30 (`oklch(0.30 0.18 25)`) and the "same" status
red at L=0.55 (`oklch(0.55 0.14 25)`) carry equivalent semantic weight
across themes — but they have different chromas. This is the *whole
trick* of perceptual parity.

## Cross-theme palette mapping

The canonical mapping pairs are listed below. The full list lives in
`scripts/make_light.py` (COLOR_MAP); the entries here are the load-bearing
ones.

**Categorical series palettes:**

- `SERIES_CATEGORICAL_10` (dark) ↔ `SERIES_CATEGORICAL_10_LIGHT`
  These are the default `seriesColors` arrays for dark vs light. Each
  index is a perceptually-matched pair — index 0 dark and index 0 light
  represent the same semantic position, not the same hex.

**Status palette pairs (semantic-preserving):**

| Role | Dark hex | Light hex |
|---|---|---|
| Critical | `#FF2D95` | `#C2185B` |
| Critical-alt | `#FF677B` | `#C62368` |
| Warning | `#FFB627` | `#E89A2C` |
| Gold | `#FFD166` | `#B36B00` |
| Healthy | `#33FF99` | `#2E8B57` |
| Info | `#7AA2FF` | `#3F6FB7` |
| Accent | `#00D9FF` | `#1F77B4` |
| Teal | `#26A69A` | `#0E7C70` |
| Purple | `#7B56DB` / `#B57BFF` / `#9B5DE5` | `#7B49B7` |

**Neutral chrome pairs:**

| Role | Dark hex | Light hex |
|---|---|---|
| Canvas | `#0b0c0e` | `#FAFAF7` |
| Panel fill | `#15161a` | `#FFFFFF` |
| Panel stroke | `#2C2C3A` | `#E5E5E0` |
| Gridline | `#23262b` | `#ebedef` |
| Axis line | `#2c3036` | `#d9dce0` |
| Primary text | `#FFFFFF` | `#1A1A1A` |
| Secondary text | `#E8E8E8` / `#C3CBD4` | `#3C444D` |

**Alert-tint backgrounds:**

| Role | Dark hex | Light hex |
|---|---|---|
| Alert-red bg tint | `#3D1E1E` | `#F4D9D9` |
| Alert-red text | `#FF6B6B` | `#B91C1C` |

For the OKLCH coordinates of each pair and the full palette catalogue,
see `ds-ref-color`.

## What `make_light.py` does

`scripts/make_light.py` is a one-shot Python tool that walks a
dashboard.json and produces a light-theme sibling. High-level behaviour:

1. **Switches `theme`** in the JSON root to `"light"`. Keeps the rest of
   the JSON structure identical.
2. **Appends ` (light)` to the title** (idempotent: existing `(dark)`
   suffix is stripped first).
3. **Walks every hex value** in the serialised JSON via two regex passes:
   - `HEX_RE` (`#[0-9A-Fa-f]{6}`) — full 6-digit hex
   - `SHORT_HEX_RE` (`#[0-9A-Fa-f]{3}`) — 3-digit shorthand (e.g.
     `#fff`, `#444`)
4. **Looks up each hex in COLOR_MAP** (or `SHORT_HEX_MAP` for shorthand).
   Hexes not in the map are passed through verbatim.
5. **Preserves all non-color fields** — search SPL, panel positions,
   token names, options keys, drilldown handlers, everything.

The mapping was derived from frequency analysis of the existing
`viz/ds-viz-*/test-dashboard/` dual-theme pairs. **To extend:** add a new
entry to `COLOR_MAP` keyed by the dark hex (uppercase, full 6 digits) and
re-run.

The script is the canonical implementation. This skill documents the
*rules* it operates on; if a question is "what hex does X map to?" the
answer is `make_light.py`'s COLOR_MAP, not this file.

## When parity breaks

`make_light.py` handles the 90% case. The remaining edge cases need
manual attention:

- **Custom inline SVGs in `splunk.choropleth.svg`.** Color-mapping
  handles 3-digit and 6-digit hexes inside the SVG payload, but
  *non-color attributes* (stroke widths, dash patterns, opacity) are
  authored for one luminance regime. A 0.5px stroke that reads crisp on
  dark may disappear on light; a 0.3 fill-opacity decoration that's
  legible on dark may look ghost-faint on light. Fix: review every
  inline SVG after running the script and tune stroke-width / opacity
  manually.

- **Image panels (`splunk.image`).** The script does not touch image
  URLs. If a dashboard embeds a logo or diagram authored for dark
  background, the light variant ships with a dark-tuned image on a light
  canvas. Fix: ship two image assets (logo-on-dark, logo-on-light) and
  swap the URL manually after make_light, or use a transparent-PNG logo
  that works on both backgrounds.

- **Brand colors not in COLOR_MAP.** If the dashboard uses a corporate
  brand color (e.g., a custom brand purple) that is not in the canonical
  palette, the script leaves it untouched. The brand color may read fine
  on both backgrounds (brand colors are usually balanced) but verify
  contrast against the new canvas. Fix: add the brand-dark → brand-light
  pair to COLOR_MAP if a translation is needed; if the same hex works on
  both, do nothing.

- **Gradient fills via CSS in markdown panels.** `splunk.markdown`
  panels can carry inline CSS gradients. The script regex-matches every
  hex inside the JSON-serialised string, so most gradient hexes get
  remapped — but if the gradient was tuned for dark-canvas blending
  (e.g., gradient ends at canvas color for a fade-out), the
  remapped light-canvas color may not produce the same fade effect.
  Fix: review markdown CSS by hand.

- **Chart-specific color overrides via tokens.** If a panel uses
  `seriesColors: $token$` and the token is set elsewhere (e.g., from a
  drilldown), the script cannot follow the indirection. Fix: ensure
  token defaults reference a palette name (`SERIES_CATEGORICAL_10`)
  rather than an inline array, so the palette switch happens via theme
  rather than via hex remapping.

- **Hard-coded accent in inputs.** Custom-styled inputs (date pickers,
  multiselects) that hard-code accent colors via inline style props will
  remap if the hex is in COLOR_MAP, but inputs are best left at default
  Splunk styling so theme switching is a no-op for them.

When parity breaks, the dashboard should still ship — but mark the light
variant as "auto-derived, review before print" until the edge case is
resolved.
