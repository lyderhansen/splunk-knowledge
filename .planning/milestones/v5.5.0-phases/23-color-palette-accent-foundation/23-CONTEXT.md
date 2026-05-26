# Phase 23: Color Palette & Accent Foundation — Context

## Domain Boundary

Every formatter has rich brand swatches, light theme passes WCAG AA, and accentColor is restored as a transparent overlay effect in the Effects section.

## Requirements

- CP-01: 6-8 brand palette swatches in every color picker
- CP-02: Light textFaint passes WCAG AA 3:1
- CP-03: accentColor restored with transparent overlay rules

## Decisions

### D-01: accentColor picker in Effects section, not Color and style (CP-03)

accentColor picker is restored but moves to the **Effects** section (not Color and style). The Effects section becomes:
1. accentColor — color picker with brand palette swatches, `type="custom"`, help text: "Glow and highlight overlay color"
2. accentIntensity — text input (existing), help text updated: "0 = no glow/highlight, 50 = default, 80+ = dramatic. Controls glow halo, hover highlight, selection ring."
3. showGlow, showVignette, showAmbientLight, showGlassPanel (existing toggles)

**Usage rules (enforce in design-principles.md DPR-03b and formatter-patterns.md):**
- accentColor is used ONLY inside `withAlpha()` calls: `theme.withAlpha(accentColor, gi * 0.15)` for hover, `theme.withAlpha(accentColor, gi)` for glow halo
- NEVER as a solid fill: no `ctx.fillStyle = accentColor` without alpha
- intensity 0 = zero glow, zero highlight, zero overlay — completely clean
- intensity 80+ = dramatic, visible glow that's clearly intentional

**formatter-patterns.md updates:**
- Remove Phase 18 WRONG note about accentColor
- Add new NOTE: "accentColor is in Effects section (not Color and style). Controls glow/highlight overlay only — never solid fills. (Phase 23 CP-03)"
- Add accentColor picker template in the Effects section
- Update Color and style section: series pickers + bg/font colors only, no accent

**design-principles.md update:**
- DPR-03b: explicitly add "accentColor from Effects formatter, read via opt('accentColor', t.accent)" alongside the existing t.accent rule

### D-02: Brand swatches populated from theme.js palette (CP-01)

Every `<splunk-color-picker>` gets 6-8 `<splunk-color>` elements populated from the theme.js DARK palette values:
- bg, panel, text, accent, series[0], series[1], series[2], series[3], series[4]
- Pick the 6-8 most distinct colors from this set

**formatter-patterns.md update:**
- Color picker template instruction: "Populate `<splunk-color>` elements from theme.js DARK palette. Minimum 6 swatches per picker. Include: accent, series[0-4], and bg or panel for contrast."
- Example showing concrete `<splunk-color>#hex</splunk-color>` elements filled from a real theme

**vp-viz SKILL.md update:**
- Pre-code checklist: "Color pickers: read theme.js, populate 6-8 brand swatches as `<splunk-color>` elements"

### D-03: textFaint darker default for WCAG AA (CP-02)

Change `textFaint` in theme-template.md LIGHT object from `#8A8FA0` to `#6B7080` (or similar that achieves 3:1+ on `#F0F2F5` background).

Verify: `check_contrast.js` should pass with 0 WARN after the change.

**File:** theme-template.md (LIGHT.textFaint value)

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — Color and style + Effects sections
- `plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md` — DPR-03b accent rules
- `plugins/splunk-viz-packs/skills/vp-design/references/theme-template.md` — LIGHT.textFaint, palette values
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — pre-code checklist
- DataDrivers F1 app formatter patterns — 6 brand colors per picker reference

## Deferred Ideas

None.
