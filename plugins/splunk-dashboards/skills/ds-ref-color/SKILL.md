---
name: ds-ref-color
description: Color discipline for Splunk Dashboard Studio dashboards — categorical / sequential / diverging / RAG / SOC palettes as JSON fragments, OKLCH theory for brand-tinted neutrals, WCAG contrast tables, colorblind-safe combinations, semantic-vs-series rules, and the reflex_palettes_to_reject list. Use when picking colors, when ds-couture needs palette guidance, or when ds-polish corrects semantic-vs-series leaks.
---

# ds-ref-color — Color discipline for Splunk dashboards

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- Canonical palettes (categorical 6/8/10, sequential single-hue, diverging two-hue, RAG status, SOC severity) as JSON fragments.
- OKLCH theory for brand-tinted neutrals.
- WCAG AA/AAA contrast tables.
- Colorblind-safe pairings (deuteranopia, protanopia).
- Semantic-vs-categorical color rules.
- `reflex_palettes_to_reject` list (20-color rainbow, default Splunk blues, gradient text).

## Out of scope (what's NOT here)

- Per-viz application of palettes — see the relevant `ds-viz-*` skill.
- Light/dark theme parity — see `ds-ref-themes`.
- Anti-pattern detection — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-themes` (palette under each theme variant).

## Consulted by

- `ds-couture` (palette commitment after archetype).
- `ds-polish` (palette corrections).
- `ds-critique` (palette violations).
- `ds-pick-viz` (color-encoding hints).

## Source / migration

- Extracted from: `ds-ref-design-principles` palette tables, semantic status palette, series color palettes.
- New content: OKLCH math, WCAG tables, colorblind pairings, reflex palettes list.

## Estimated size

L

---

## Color principles

A Splunk dashboard's colour budget is small and load-bearing. Every
hue either signals semantics (status, severity, polarity) or carries
identity (brand, theme, archetype). Decorative colour is a tax: it
crowds the channel operators rely on for "is this OK or not?".

**The 60-30-10 rule.** Allocate the canvas roughly:

- **60% canvas / chrome** — backgrounds, panel cards, grid, axis
  lines. Quiet, near-monochrome, slight brand tint at most.
- **30% data ink** — series colours from one categorical palette.
  Limit to 6–8 series visible at any time.
- **10% accent / status** — semantic palette (red/orange/yellow/green/
  blue/grey) reserved for `majorColor`, threshold ranges, badges,
  status icons. Never bleeds into series.

**Semantic colours are non-negotiable.** Red means bad. Green means
good. Yellow means caution. These mappings live in operator muscle
memory long before they read your dashboard. If a healthy line is
green in a multi-series chart, a crashing service in red will read as
"normal" because the dashboard already taught the eye that colour
carries category-not-status meaning. The fix is not to pick
"different reds" — it is to never put status hues into series
palettes in the first place.

**Colourblind safety is a hard rule.** ~8% of men (deuteranopia +
protanopia + tritanopia combined) cannot distinguish a red bar from
a green bar by hue alone. Pair every status hue with a redundant
encoding: an icon (`splunk.singlevalueicon`), a shape, a text label,
or a position (top-of-list = worst). Red/green as sole differentiator
is an absolute ban.

## Semantic status palette

Use these EXACT hex values — operators rely on instant recognition.

| Status | Dark theme | Light theme | Use for |
|---|---|---|---|
| Critical / Error | `#DC4E41` | `#C0392B` | Alarms, failures, threshold breaches. |
| High / Elevated | `#F1813F` | `#C05C00` | Exceeding soft limit. |
| Warning | `#F8BE34` | `#D4820A` | Approaching limits, degraded. |
| OK / Healthy | `#53A051` | `#2B9E44` | Normal operating state. |
| Info / Neutral | `#006D9C` | `#2066C0` | Informational counts, no health semantics. |
| Unknown / No data | `#B0B0BE` | `#9B99A0` | Missing or unavailable data. |

## Canvas & chrome tokens

| Element | Dark (default) | Dark (NOC / wall) | Light |
|---|---|---|---|
| Canvas background | `#0b0c0e` | `#000000` | `#FAFAF7` |
| Panel / card fill | `#15161a` | `#0F1117` | `#ffffff` |
| Panel stroke | `#2C2C3A` | `#1FBAD6` (accent) | `#E5E5E0` |
| Primary text | `#FFFFFF` | `#FFFFFF` | `#1A1A1A` |
| Secondary text | `#B0B0BE` | `#B0B0BE` | `#6B7C85` |
| Gridline | `#23262b` | `#23262b` | `#ebedef` |
| Axis line | `#2c3036` | `#2c3036` | `#d9dce0` |

Note: Dark default canvas `#0b0c0e` is a brand-tinted near-black
(very slight cool tint), not pure `#000000`. Pure black is reserved
for NOC walls where the dashboard sits behind glass under uncontrolled
lighting and maximum contrast wins. The light-theme canvas `#FAFAF7`
is a warm off-white, not `#FFFFFF` — pure white burns under fluorescent
office lighting and breaks the 60-30-10 budget by giving 60% of the
canvas a louder voice than the data.

## Series color palettes

Pick one per dashboard and stick to it. Limit charts to 6–8 series;
above that, aggregate to Top N + "Other" or split into multiple
charts.

### `SERIES_CATEGORICAL_10` — default for dark dashboards

Executive, ops, analytical.

```
#006D9C  #4FA484  #EC9960  #AF575A  #B6C75A
#62B3B2  #294E70  #738795  #EDD051  #BD9872
```

### `SERIES_CATEGORICAL_10_LIGHT` — default for light dashboards

Executive print / PDF.

```
#2066C0  #2B9E44  #C05C00  #C0392B  #7A873D
#3D8B8B  #294E70  #4A5A64  #B39A1F  #8A6B4A
```

### `SERIES_SOC_8` — status-semantic palette (SOC / NOC ONLY)

Use only when first four colours align with severity. Do NOT use
elsewhere (semantic colours leak).

```
#DC4E41  #F1813F  #F8BE34  #53A051   ← critical / high / warning / ok
#006D9C  #1FBAD6  #826AF9  #9B59B6
```

### `SERIES_STUDIO_20` — Splunk Studio extended palette

Dense analytical charts with many categories. Use first 8–10 entries.

```
#7B56DB  #009CEB  #00CDAF  #DD9900  #FF677B
#CB2196  #813193  #0051B5  #008C80  #99B100
#FFA476  #FF6ACE  #AE8CFF  #00689D  #00490A
#465D00  #9D6300  #F6540B  #FF969E  #E47BFE
```

## Semantic coloring for singlevalues (`majorColor`)

Status KPIs use the semantic palette with explicit thresholds. Do NOT
use series-palette blues / greens for status metrics.

| Metric kind | Polarity | Typical `majorColor` |
|---|---|---|
| Failure count, error count, critical alerts | up-is-bad | `#DC4E41` (static) or DOS threshold red above threshold |
| Latency, response time | up-is-bad | `#F1813F` warm / `#DC4E41` if SLA-critical |
| Success rate, uptime | down-is-bad | `#53A051` above → `#F8BE34` → `#DC4E41` |
| Capacity / utilisation | up-is-bad-above-cap | `#53A051` <80 → `#F8BE34` 80–90 → `#DC4E41` >90 |
| Informational counts (events, volume) | neutral | `#006D9C` (static) |

DOS example for SLA-critical latency:

```json
"majorColor": "> primary | seriesByName('p95') | lastPoint() | rangeValue(thresholds)",
"context": {
  "thresholds": [
    { "to": 200,             "value": "#53A051" },
    { "from": 200, "to": 500,"value": "#F8BE34" },
    { "from": 500,           "value": "#DC4E41" }
  ]
}
```

## OKLCH theory

OKLCH (Oklab Lightness-Chroma-Hue) is a perceptually uniform colour
space. Unlike HSL — where two colours at the same `S` and `L` can
look wildly different in actual brightness because hue affects
perceived lightness — OKLCH guarantees that two colours at the same
`L` will read as equally bright, and equal numerical steps along the
`L` or `C` axis correspond to roughly equal perceptual steps.

For dashboard palettes, this matters because:

1. **Series palettes need uniform luminance.** When colours sit
   side-by-side as legend chips, none should "shout" louder than the
   others. HSL fails: yellow at `hsl(60, 100%, 50%)` is far brighter
   than blue at `hsl(240, 100%, 50%)`. OKLCH lets you fix `L` across
   the palette (e.g. `L=0.65` for all 10 categorical entries) and
   vary only `C` and `H`.
2. **Sequential gradients need linear luminance steps.** A red→amber
   severity ramp built in OKLCH with `L` decreasing in even
   increments produces a visually-uniform gradient. The same ramp
   in RGB or HSL produces a "dark middle" or "light middle" that
   reads as discontinuous.

### Brand-tinted neutrals (chroma 0.005–0.01)

Pure greys (`C=0`) feel sterile and AI-generated. Brand-tinted
neutrals nudge a tiny amount of chroma — `C` in `[0.005, 0.01]` —
toward the brand hue. The eye doesn't see "blue", but the surface
stops reading as "stock template grey".

For Splunk default dark, the canvas `#0b0c0e` is roughly `oklch(0.13
0.005 270)` — `L=0.13` (very dark), `C=0.005` (just-perceptible
cool tint), `H=270` (cool/blue-purple to align with the Splunk-blue
brand hue). Compare to pure neutral `oklch(0.13 0 0)` which is
`#0c0c0c` — visually nearly identical, but the tinted version reads
as "considered dark mode" while the pure-neutral version reads as
"AI default".

For light canvas `#FAFAF7`, OKLCH is roughly `oklch(0.98 0.005 90)`
— a warm yellow tint at `H=90`, anchoring the page to a paper-like
warmth instead of glaring fluorescent white.

### Reducing chroma at extreme lightness

A common bug in hand-tuned palettes is keeping `C` constant across
the lightness scale. At `L=0.95` (near-white) and `L=0.05`
(near-black), high chroma produces colours that look "wrong" —
washed-out pinks instead of pale red, navy-with-purple-cast instead
of dark blue. The fix: clamp `C` at the extremes.

Recommended chroma ceiling per lightness band:

| Lightness `L` | Max chroma `C` | Why |
|---|---|---|
| `0.00 – 0.20` | `0.10` | Dark colours can't sustain high saturation. |
| `0.20 – 0.40` | `0.15` | Mid-dark band; canvas chrome territory. |
| `0.40 – 0.70` | `0.20` | Series-palette sweet spot. |
| `0.70 – 0.85` | `0.15` | Light series for light theme. |
| `0.85 – 1.00` | `0.05` | Pastels and off-white tints only. |

### Hex ↔ OKLCH conversion examples

For the canonical Splunk palettes:

| Hex | OKLCH (approximate) | Notes |
|---|---|---|
| `#DC4E41` (critical dark) | `oklch(0.62 0.20 27)` | Saturated red, mid-luminance for visibility on dark canvas. |
| `#C0392B` (critical light) | `oklch(0.53 0.18 28)` | Same hue, lower L — sits well on light canvas without glare. |
| `#F8BE34` (warning dark) | `oklch(0.83 0.16 87)` | High L (yellow's natural luminance) with controlled C. |
| `#53A051` (ok dark) | `oklch(0.64 0.16 145)` | Same L as critical so neither "shouts louder". |
| `#006D9C` (info dark) | `oklch(0.51 0.13 233)` | Splunk brand blue; deliberately less saturated than red. |
| `#0b0c0e` (canvas dark) | `oklch(0.13 0.005 270)` | Brand-tinted near-black. |
| `#FAFAF7` (canvas light) | `oklch(0.98 0.005 90)` | Warm off-white. |

## WCAG contrast tables

WCAG AA requires 4.5:1 contrast for normal text and 3:1 for large
text (≥18pt regular or ≥14pt bold) and UI components. AAA requires
7:1 for normal text. Dashboard KPI majorValues count as large text
(48px+); status labels and tick marks count as normal text.

### Status hex on canvas-dark (`#0b0c0e`)

| Status hex | Ratio | AA normal | AA large | AAA normal |
|---|---|---|---|---|
| `#DC4E41` critical | 5.0:1 | PASS | PASS | FAIL |
| `#F1813F` high | 7.4:1 | PASS | PASS | PASS |
| `#F8BE34` warning | 11.5:1 | PASS | PASS | PASS |
| `#53A051` ok | 5.6:1 | PASS | PASS | FAIL |
| `#006D9C` info | 3.7:1 | FAIL | PASS | FAIL |
| `#B0B0BE` unknown | 8.4:1 | PASS | PASS | PASS |

Note: `#006D9C` info-blue fails AA for normal text on dark canvas.
Acceptable for KPI majorValues (large text), unacceptable for body
copy or small labels — switch to `#1FBAD6` cyan accent for those uses.

### Status hex on canvas-NOC (`#000000`)

| Status hex | Ratio | AA normal | AA large | AAA normal |
|---|---|---|---|---|
| `#DC4E41` critical | 5.4:1 | PASS | PASS | FAIL |
| `#F1813F` high | 8.1:1 | PASS | PASS | PASS |
| `#F8BE34` warning | 12.5:1 | PASS | PASS | PASS |
| `#53A051` ok | 6.1:1 | PASS | PASS | FAIL |
| `#006D9C` info | 4.0:1 | FAIL | PASS | FAIL |
| `#B0B0BE` unknown | 9.1:1 | PASS | PASS | PASS |

NOC canvas gives every status hue a small contrast boost over the
default-dark canvas. Use it on wall displays where viewers are
3–10 metres away.

### Status hex on canvas-light (`#FAFAF7`)

| Status hex | Ratio | AA normal | AA large | AAA normal |
|---|---|---|---|---|
| `#C0392B` critical | 5.6:1 | PASS | PASS | FAIL |
| `#C05C00` high | 5.4:1 | PASS | PASS | FAIL |
| `#D4820A` warning | 3.7:1 | FAIL | PASS | FAIL |
| `#2B9E44` ok | 3.5:1 | FAIL | PASS | FAIL |
| `#2066C0` info | 5.6:1 | PASS | PASS | FAIL |
| `#9B99A0` unknown | 3.5:1 | FAIL | PASS | FAIL |

Light theme is harsher on green and yellow — both fail AA for normal
text. Pair with a darker label or border for compliance: a `#D4820A`
warning chip with a `#1A1A1A` text label is fine; a `#D4820A` numeric
KPI in 14px is not.

### Series colors on canvas-dark (`#0b0c0e`)

`SERIES_CATEGORICAL_10`:

| Hex | Ratio | AA large |
|---|---|---|
| `#006D9C` | 3.7:1 | PASS |
| `#4FA484` | 5.4:1 | PASS |
| `#EC9960` | 7.5:1 | PASS |
| `#AF575A` | 4.0:1 | PASS |
| `#B6C75A` | 9.1:1 | PASS |
| `#62B3B2` | 6.5:1 | PASS |
| `#294E70` | 1.7:1 | FAIL |
| `#738795` | 4.5:1 | PASS |
| `#EDD051` | 11.0:1 | PASS |
| `#BD9872` | 6.4:1 | PASS |

Watch entry 7 (`#294E70`): too dark for dark canvas. Reserve for
light-theme palettes only, or substitute `SERIES_STUDIO_20[8]` cyan
when you need a "deep blue" slot on dark.

### Series colors on canvas-light (`#FAFAF7`)

`SERIES_CATEGORICAL_10_LIGHT`:

| Hex | Ratio | AA large |
|---|---|---|
| `#2066C0` | 5.5:1 | PASS |
| `#2B9E44` | 3.5:1 | PASS |
| `#C05C00` | 5.3:1 | PASS |
| `#C0392B` | 5.6:1 | PASS |
| `#7A873D` | 4.4:1 | PASS |
| `#3D8B8B` | 4.0:1 | PASS |
| `#294E70` | 9.6:1 | PASS |
| `#4A5A64` | 7.1:1 | PASS |
| `#B39A1F` | 3.0:1 | PASS |
| `#8A6B4A` | 5.5:1 | PASS |

Light palette is conservative — every entry passes AA large. Good
choice for print/PDF where ratio loss from photocopy is real.

## Colorblind-safe pairings

~6% of men have deuteranopia (red-green deficiency, green-cone
shifted). ~1.5% have protanopia (red-cone shifted, often more
severe). ~0.5% have tritanopia (blue-yellow). Combined, roughly 8%
of male viewers cannot rely on hue alone for status.

### Which canonical pairs survive deuteranopia

| Pair | Survives? | Notes |
|---|---|---|
| `#DC4E41` red ↔ `#53A051` green | NO | The textbook failure. Both read as similar muddy yellow-brown. |
| `#DC4E41` red ↔ `#006D9C` blue | YES | Hue separation in blue channel preserved. |
| `#DC4E41` red ↔ `#F8BE34` yellow | YES | Both warm but luminance separates them. |
| `#F1813F` orange ↔ `#53A051` green | MARGINAL | Hue collapses; rely on luminance. |
| `#F1813F` orange ↔ `#F8BE34` yellow | YES | Adjacent but luminance separates. |
| `#006D9C` blue ↔ `#53A051` green | YES | Strong blue/green separation preserved. |
| `#B0B0BE` grey ↔ any chromatic | YES | Achromatic pairs always survive. |

### Which canonical pairs survive protanopia

| Pair | Survives? | Notes |
|---|---|---|
| `#DC4E41` red ↔ `#53A051` green | NO | Both desaturated to yellow-brown; red appears darker than to deuteranopes. |
| `#DC4E41` red ↔ `#F8BE34` yellow | MARGINAL | Red darkens significantly; rely on label/icon. |
| `#DC4E41` red ↔ `#006D9C` blue | YES | Best status pairing for protanopes. |
| `#F1813F` orange ↔ `#006D9C` blue | YES | High hue separation. |
| `#F8BE34` yellow ↔ `#006D9C` blue | YES | Maximum perceptual distance. |

### Recommended substitutes for status pairings

- **OK vs Critical (hardest case):** never rely on red/green alone.
  Substitute "blue/red" (`#006D9C` ok ↔ `#DC4E41` critical) for
  binary status; or use an icon: `success-circle` + `error-circle`
  via `splunk.singlevalueicon`.
- **Severity scale:** stick to luminance-ramped sequential
  (light-yellow → mid-orange → dark-red), not hue-ramped
  (green → yellow → red). The luminance ramp survives all three
  colourblind types.
- **Multi-series with status leak risk:** use
  `SERIES_CATEGORICAL_10` (which has no high-saturation green or red
  in early slots) instead of `SERIES_SOC_8`.

### The shape/icon/label pairing rule

Every status hue MUST carry a redundant non-colour encoding:

1. **Icon** — `splunk.singlevalueicon` with a per-status icon
   (`exclamation-circle` for critical, `check-circle` for ok,
   `info-circle` for warning).
2. **Shape** — different glyph per category (square vs triangle vs
   diamond) in scatter / bubble charts.
3. **Label** — `"CRITICAL"`, `"OK"` text in the panel or table cell,
   not just a colour swatch.
4. **Position** — sort order itself is a signal: top-of-list = worst
   in alert lists.

A dashboard that fails the colourblind test fails for ~8% of male
operators. This is not a niche concern.

## reflex_palettes_to_reject

These are the palettes Claude reaches for by training-data reflex.
All must be refused.

### 1. The 20-colour rainbow

**Pattern:** No `seriesColors` set on a multi-series chart. Splunk
auto-colours from a built-in 20-colour rainbow that cycles through
red → orange → yellow → green → blue → purple → pink → … and back.

**Why bad:** Rainbow on categorical data is the textbook "different
kinds" mistake — assigns visual urgency to values that have no
ordering, while leaking severity-coded hues (red, green) into series
where they have no semantic meaning.

**REWRITE:** Always set `seriesColors` to one of `SERIES_CATEGORICAL_10`,
`SERIES_CATEGORICAL_10_LIGHT`, or `SERIES_STUDIO_20`. If you genuinely
have >10 series, aggregate to Top N + "Other" upstream in SPL.

### 2. Default Splunk blues (`#006D9C` everywhere)

**Pattern:** Every panel uses the Splunk-default brand blue.
KPI majorColor `#006D9C`, line chart series `#006D9C`, bar chart
fill `#006D9C`, table cell highlight `#006D9C`. The dashboard reads
as "untouched template".

**Why bad:** Loses semantic polarity (everything reads "neutral"),
loses categorical separation (multi-series collapses to one colour),
loses brand identity (every Splunk dashboard already looks like
this). It's the visual equivalent of leaving Lorem Ipsum in.

**REWRITE:** Reserve `#006D9C` for two specific uses: (a)
informational-count KPIs with neutral polarity, (b) entry 1 of
`SERIES_CATEGORICAL_10`. Every other panel commits to a
deliberate palette choice tied to its archetype.

### 3. Gradient text fills

**Pattern:** "Linear-gradient text" effect on KPI majorValues —
attempting purple → pink CSS gradients via `<span>` tricks in
markdown panels, or expecting `splunk.singlevalue` to render
gradient text.

**Why bad:** Dashboard Studio does not support gradient text on
chart fonts (only `splunk.markdown` exposes `fontFamily`, and
gradients in markdown render unreliably across Splunk versions).
Even when it works, gradient text degrades legibility — the eye
fights to parse a number whose strokes shift colour mid-glyph. KPIs
exist to be read in 1.5 seconds; gradients add 500ms of cognitive
overhead.

**REWRITE:** Solid `majorColor` from semantic palette (status) or
`#FFFFFF` / `#1A1A1A` (informational). If you want decoration,
apply it to a `splunk.rectangle` background BEHIND the KPI, never
to the text itself.

### 4. Pure-black-and-white-only "minimalist"

**Pattern:** "Let's go minimalist" interpreted as `#000000` canvas,
`#FFFFFF` text, `#FFFFFF` series, `#FFFFFF` borders. Every panel a
black rectangle with white outline. Status conveyed only through
"thicker line = bad" or "uppercase = critical".

**Why bad:** Strips semantic colour entirely. An on-call SRE cannot
glance and ask "what's red?" because nothing is red. Mistakes
"minimalism" for "aesthetic restraint" — actual minimalism keeps
semantic signal and removes decorative noise; this removes both.

**REWRITE:** Keep canvas dark (`#0b0c0e`) and chrome quiet, but
reserve the 10% accent budget for the four status hues. A dashboard
with a single red KPI in an otherwise monochrome canvas is
maximally minimalist — the red is louder, not because there's more
of it, but because there's less competition.

### 5. Bootstrap defaults

**Pattern:** `#007BFF` Bootstrap primary, `#28A745` success,
`#DC3545` danger, `#FFC107` warning, `#17A2B8` info. The `dropdown`
classes show through in the colour choices.

**Why bad:** Bootstrap's palette is tuned for web forms on a white
background, not telemetry on a dashboard canvas. The blue is too
saturated for SOC walls (eye fatigue at 8h shifts), the green is too
loud relative to red (visual hierarchy inverted — "everything's
fine" should be quieter than "something's wrong"), and these hex
values are recognisable as "AI used Bootstrap" to anyone who has
ever shipped a Bootstrap site.

**REWRITE:** Use the canonical Splunk semantic palette
(`#DC4E41` / `#F1813F` / `#F8BE34` / `#53A051` / `#006D9C`) — it's
tuned for dashboard canvas, brand-aligned, and not a training-data
fingerprint.

## See also

- `ds-ref-themes` — palette under each theme variant (dark default,
  dark NOC, light, custom).
- `ds-ref-anti-patterns` — the absolute bans (red/green only, status
  colours as series colours, etc.) that this skill's principles
  enforce.
- `ds-ref-design-principles` — the design reference that links to
  this skill for colour content.
- `ds-couture` — design-first companion that consults this skill
  when committing to a palette after archetype selection.
- `ds-polish` — palette correction pass (semantic-vs-series leaks,
  reflex palettes).
- `ds-critique` — palette violations during the Slop Test.

