---
name: ds-ref-brand
description: Brand discovery rules for Splunk dashboards — how to translate a brand book or reference URL ("match our brand", "look like Stripe") into specific Studio decisions. Color extraction from logo, tone-word translation (e.g., "warm" → which palette family), font fallbacks when brand fonts aren't available in Studio (which has fontFamily only on splunk.markdown), and brand-tinted neutrals via OKLCH. Use when ds-couture is gathering brand context, or when a user wants the dashboard to align with corporate identity.
---

# ds-ref-brand — Brand discovery for Splunk dashboards

## Scope (what's IN)

- Color extraction from logo (manual workflow + tools).
- Tone-word translation (3 brand words → palette + typography + density bias).
- Font fallback rules (Studio has fontFamily only on `splunk.markdown`).
- Brand-tinted neutrals via OKLCH.
- "Like X" translation playbook (cross-references `ds-ref-references`).

## Out of scope (what's NOT here)

- The brand-discovery workflow itself — lives in `ds-couture` as Design Context Protocol orchestration.
- Generic palettes — see `ds-ref-color`.
- Generic fonts — see `ds-ref-typography`.

## Consults

- `ds-ref-color` (OKLCH math + categorical paletting).
- `ds-ref-typography` (font fallbacks).
- `ds-ref-references` ("like X" translations).

## Consulted by

- `ds-couture` (brand-context phase of Design Context Protocol).

## Source / migration

- All new content — no existing source. New capability for the plugin.

## Estimated size

M

---

## When ds-couture invokes this skill

The `ds-couture` Design Context Protocol asks about brand context as one of its required inputs. Brand is one of the five mandatory inputs (audience, job-to-be-done, tone, anti-references, brand) — without it, every visual decision downstream is a guess that regresses to the AI mean.

If the user supplies a brand reference — a brand book PDF, a logo, a marketing site URL, a sentence like "match our corporate identity" or "look like Stripe" — the protocol routes to this skill for the rules of translation.

The discovery WORKFLOW (the conversation, the prompts, the order of questions) lives in `ds-couture`. This skill is the rulebook that workflow follows: how to extract a palette from a logo, how to convert tone words into Studio decisions, how to fall back when a brand font won't render in Studio, how to make neutrals feel like they belong to the brand.

If the user has NOT supplied brand context, ds-couture should still ask. Don't skip this skill because the user didn't volunteer brand info — the protocol's whole point is to refuse to design in the dark.

## Color extraction from a logo

When the user supplies a logo (or a brand-page URL where you can pull the logo), the goal is to land on a palette of 4–6 hexes that the customer would recognise as "ours" without seeing the logo itself.

**Manual workflow:**

1. **Open the logo** in a tool that lets you sample pixels: Figma, Sketch, macOS Digital Color Meter, Windows ColorPicker, or any image viewer with an eyedropper.
2. **Sample 3–5 dominant hexes.** Click on the largest contiguous color regions. Skip anti-aliased edges (the half-tone pixels at the boundary of a shape) — those are mixtures, not brand colors. If the logo uses a gradient, sample both endpoints.
3. **Identify the primary brand color.** Usually the most saturated, most-recognition hex — the one a customer would name if asked "what color is your brand?". For Stripe it is the indigo. For Splunk it is the green. For Atlassian it is the blue. There is almost always exactly one.
4. **Identify 1–2 secondary brand colors.** These are accent hues used in marketing illustrations, supporting graphics, the second-tier badges. They are NOT the primary, but they appear consistently. Many brands have only one secondary; some have two; very few have three.
5. **Identify the brand neutral.** Often a tinted grey — not pure `#888888`, but `#8B8C8E` or similar, with a chroma bias toward the brand hue. Marketing dark-mode pages and white-paper backgrounds reveal this neutral. If you cannot find one, default to a perceptual grey at L=0.5 in OKLCH.
6. **Test by occlusion.** Cover the logo. Looking only at your 4–6 hexes, would a customer say "those are our colors"? If no, you missed something — usually the secondary or neutral.

**Tools to recommend:**

- **Coolors.co color-from-image** — drag in a logo, get a palette automatically. Quick first pass.
- **Figma plugin "Image Palette"** — works inside a designer's existing Figma file; useful if the user already has brand assets there.
- **Adobe Color** — Color Wheel mode lets you extract a palette from an uploaded image and immediately check harmony.
- **macOS Digital Color Meter** (built-in) — exact pixel-level hex sampling from anything on screen.

**Output format:** a small structured block that ds-couture can pass to `ds-ref-color`:

```
brand-palette:
  primary:    #635BFF   # the recognition color
  secondary1: #00D4FF   # accent
  secondary2: #FF80BF   # optional second accent
  neutral:    #2A2D3A   # tinted grey, chroma toward primary
```

`ds-ref-color` takes this and produces the OKLCH-spaced sequential and categorical palettes used in Studio panels.

## Tone-word translation

The Design Context Protocol asks the user for **three brand words** ("warm, technical, trustworthy" — not "modern, clean, minimal"; those are dead categories). Each tone word maps to concrete Studio decisions: a palette family, a typography stance, and a density bias for the layout.

| Brand word | Palette family | Typography | Density |
|---|---|---|---|
| **Warm** | warm-shifted hues (oranges, reds, ambers; OKLCH hue 30–80); paper or off-black canvas instead of pure black/white | serif display for headers; humanist sans for body | medium — generous padding, room to breathe |
| **Clinical** | cool, desaturated (blues, teals, OKLCH chroma ≤0.08); pure white or near-white canvas | geometric sans throughout; tight tracking | high — tight gutters, more panels per row, thin strokes |
| **Bold** | high-contrast pairs (saturated primary + near-black neutral); aggressive accent | display weight for headers (700–900); chunky body sans | low — fewer, larger panels; lots of negative space around the heroes |
| **Calm** | low-chroma, low-contrast (OKLCH chroma 0.02–0.06); muted accent | sans serif with generous line-height (1.6+); regular weight | low — generous gutters, fewer panels, lots of whitespace |
| **Technical** | mono-tinged neutral palette; cool accent; restrained chroma | monospace as accent (KPI numbers, code samples); humanist sans for body | high — table-friendly grid, dense fixed-width readouts |
| **Trustworthy** | brand-blue + neutral (the boring, safe combination — banks, infra, B2B); minimal accent | sans + steady type scale (no display fireworks); regular and medium weights only | medium — predictable grid, no asymmetric flourishes |
| **Playful** | high-chroma primary + secondary; rounded accents; willingness to use 3–4 hues | display headers with personality (rounded sans, soft serif); regular body | medium — varied panel sizes, occasional asymmetry, decorative accents allowed |

**Combining three words:**

The user gives three words. They will sometimes conflict. "Bold + Calm" pulls in opposite directions; "Warm + Clinical" the same. Resolve via the **dominant brand attribute** rule:

1. Of the three words, identify which one the customer's brand actually leads with — the word their marketing repeats, the word that shows up first in their value proposition.
2. That word wins the palette family.
3. The second word modulates typography.
4. The third word modulates density only.

Example: a fintech says "trustworthy, bold, modern". Trustworthy is the dominant attribute (it's a fintech — trust is the whole product). Palette: brand-blue + neutral. Bold modulates typography → display weight on headers. "Modern" is rejected as a dead category and silently dropped; ask the user for a replacement word.

If the conflict is irreconcilable (the user insists on "Warm + Clinical" with both as dominant), surface it back to the user before continuing: "Warm and Clinical pull in opposite directions on the palette axis. Which one should win the canvas color and primary palette? The other will live in typography only."

## Font fallbacks under Studio constraints

Splunk Dashboard Studio has a hard platform constraint that brand-conscious designers always hit: **only the `splunk.markdown` visualization exposes a `fontFamily` option.** No other panel type — singlevalue, table, chart axes, legends, tooltip text, input labels — accepts a font override.

This means:

- **Brand display font** (e.g., GT Sectra, Fraunces, Söhne, Inter, a custom corporate typeface) → applies **only** in markdown panels. Section titles, KPI explanations, editorial annotations, brand quotes can all use the brand font.
- **Body text everywhere else** → singlevalue numbers, table cells, chart axis labels, legend entries, input dropdowns — these all use the Splunk default and cannot be overridden short of forking Splunk itself. Don't promise the customer otherwise.
- **Web fonts via @import or Google Fonts CDN are NOT supported.** Studio will silently fall back to the system stack. Don't reference web-only fonts.
- **The font must exist on the viewer's machine.** This is the same constraint as a 1995 web page: pick a brand-spirit font that's likely installed, or ship via the customer's corporate device-management system.

**Fallback strategy when the brand font won't load:**

1. **Identify the brand font's character.** Is it a humanist serif (warm)? A geometric sans (clinical)? A grotesque sans (bold)? A slab serif (technical)? A rounded display (playful)?
2. **Pick the closest free alternative** that ships in macOS, Windows, or both: Charter, Georgia, Cambria for humanist serifs; Helvetica, Arial, Inter (commonly installed) for grotesques; SF Pro / Segoe UI for system geometric sans; Menlo, Consolas, SF Mono for monospace.
3. **Cross-check against the reflex_fonts_to_reject list in `ds-ref-typography`.** That list captures fonts that read as AI-default no matter who's looking — Roboto, Open Sans, Source Sans Pro for body; Lato, Montserrat for display. If your fallback hits that list, pick again.
4. **If the brand font is a paid type foundry license** (Sectra, Söhne, Suisse, Druk), the customer's company almost certainly has a licensed copy somewhere. Ask the user to surface the `.woff` / `.otf` file and reference it from a markdown `<style>` block as the brand-font-stack — knowing it will only render in markdown panels.

**Output format for ds-couture's brief:**

```
brand-typography:
  display:  "GT Sectra, Charter, Georgia, serif"   # markdown only
  body:     "(Splunk default — cannot override)"
  mono:     "(Splunk default — cannot override)"
  notes:    "Brand display font applies in section markdown only.
             KPIs, tables, axes use Splunk default."
```

Pass this to `ds-ref-typography` for the rest of the typography decisions (scale, weight, line-height, casing).

## Brand-tinted neutrals via OKLCH

The neutrals — canvas background, panel surfaces, gridlines, axis ticks, divider strokes — are usually treated as "just grey". This is a missed opportunity. Tinting every neutral very slightly toward the brand hue creates **subconscious brand cohesion at the dashboard-as-a-whole level**, even when no individual neutral reads as "colored".

**Why OKLCH:** OKLCH separates lightness (L), chroma (C), and hue (H) perceptually. A small amount of chroma at a fixed hue produces a tint that humans see as "warm grey" or "cool grey" — coherent across all neutrals — without shifting the perceived lightness. RGB cannot do this without unintended lightness changes.

**Procedure:**

1. **Pick the brand hue in OKLCH.** Convert the brand primary hex to OKLCH (any tool: oklch.com, ColorAide, the CSS `oklch()` function in Chrome devtools). Note the hue value (e.g., Stripe indigo `#635BFF` → roughly OKLCH H=275).
2. **Set chroma to 0.005–0.01** for every neutral. Below 0.005 the tint is invisible. Above 0.01 the neutral starts reading as "blue" or "warm" rather than "grey-with-character".
3. **Apply to ALL neutrals at the same hue and chroma.** Canvas, panel surface, gridline, axis, divider, table-row alternate, separator. The trick is uniformity — if only some neutrals are tinted, the eye spots the inconsistency and the cohesion effect breaks.
4. **Vary lightness, not chroma or hue.** Canvas is lightest in dark mode (or darkest in light mode); panel one step in; gridline another step. The L axis carries the hierarchy; the C and H axes carry the brand tint.

**Example for a brand with hue H=275 (indigo):**

```
canvas-dark:    oklch(0.16 0.008 275)   # near-black, indigo-tinted
panel-dark:     oklch(0.20 0.008 275)
border-dark:    oklch(0.28 0.008 275)
gridline-dark:  oklch(0.32 0.008 275)
text-dim:       oklch(0.62 0.008 275)
text:           oklch(0.92 0.008 275)
```

The dashboard reads as black-on-grey to a casual observer, but it feels coherent and "ours" to the brand owner. The chroma value (0.008) is below the just-noticeable-difference threshold for most viewers in isolation, but cumulative across the canvas it lands.

**Cross-reference:** the OKLCH math, the canvas/panel/border ladder, and the Studio token mapping all live in `ds-ref-color`. This skill only specifies the hue (from brand) and the chroma range (0.005–0.01); `ds-ref-color` handles the rest.

## "Like X" translation playbook

When the user says "match our brand book" or "look like Stripe / Linear / Vercel / Notion / Apple", the playbook is the same regardless of whether X is a documented brand book or a famous reference site.

**Step 0 — Consult `ds-ref-references` first.**

`ds-ref-references` carries a curated set of well-known design references with pre-translated rules. If X is in that set ("looks like Linear", "feels like Stripe Dashboard", "Vercel-style"), use the curated translation directly and skip the manual extraction. Saves time and avoids second-guessing well-trodden references.

**If X is NOT curated, run the manual extraction:**

1. **Identify primary brand color.** Sample from logo or marketing-site hero. Use the Color extraction workflow above.
2. **Identify 1–2 secondary colors and the brand neutral.** Same workflow.
3. **Identify three brand tone words.** Read the brand's marketing copy, value proposition, "About" page. Three words that the brand uses about itself, not three words you generated. If the user can't supply them, derive them and ask for confirmation before continuing.
4. **Translate tone words → palette family + typography + density** using the Tone-word translation table above. Apply the dominant-brand-attribute rule when words conflict.
5. **Apply brand-tinted neutrals via OKLCH** at chroma 0.005–0.01 toward the primary hue.
6. **Surface conflicts back to the user before writing JSON.** Common conflicts: brand font is paid-license and won't render in Studio (offer fallback); brand uses red as primary and the dashboard is a SOC monitor where red means "alert" (offer accent-color remap); brand wants playful and the user persona is a CISO at 3am (offer to suppress playful in operational dashboards while keeping it in the executive variant).

**Output: a single brand brief**

The brief is what `ds-couture` passes downstream to `ds-ref-color`, `ds-ref-typography`, and `ds-ref-layout-grid`. It looks roughly like this:

```
brand-brief:
  source:       "Stripe brand book v3, 2025-01"
  palette:
    primary:    #635BFF   # OKLCH H=275
    secondary:  [#00D4FF, #FF80BF]
    neutral:    #2A2D3A
  tone-words:   [trustworthy, bold, technical]
  dominant:     trustworthy
  typography:
    display:    "Söhne, Inter, system-ui, sans-serif"  # markdown only
    body:       "(Splunk default)"
    mono:       "(Splunk default)"
  density:      medium     # from "trustworthy" dominant
  neutrals:
    chroma:     0.008
    hue:        275
  conflicts:
    - "Brand red conflicts with SOC alert color; remap accent to brand cyan."
    - "Brand display font is paid-license; verify customer has Söhne installed."
```

Pass this brief to:

- `ds-ref-color` for OKLCH palette generation, sequential ramps, categorical palettes, status colors
- `ds-ref-typography` for type scale, weight ladder, casing rules
- `ds-ref-layout-grid` for density-driven canvas zones, gutter sizing, panel-count budget

The brief is the contract. Once written, downstream skills don't ask brand questions again.
