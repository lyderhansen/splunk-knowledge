# Phase 7: Generation Quality & Theme Parity - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade vp-viz code generation so every viz has 10-14 context-aware formatter options AND a light theme that looks deliberately designed. This phase modifies how Claude generates formatter.html and visualization_source.js — applying the design rules codified in Phase 6 and adding intelligent configuration. No new reference files created; existing templates and blueprints are updated to produce better output.

</domain>

<decisions>
## Implementation Decisions

### Formatter Option Derivation
- **D-01:** viz-blueprints.md "Settings:" list is the baseline per viz type. Claude uses it as a suggestion (not minimum) and can drop irrelevant options or add 1-2 brand-specific ones based on reasoning about the brand brief.
- **D-02:** Universal options present on every viz: `themeMode` (auto/dark/light), `accentColor`, `accentIntensity` (0-100). These are always generated regardless of viz type.
- **D-03:** Do NOT duplicate Dashboard Studio panel-level settings (background color, font color) as formatter controls. Only expose settings that DS doesn't provide (themeMode, accentColor, accentIntensity, viz-specific controls). Evaluate per brand whether additional universal options are needed.
- **D-04:** CFG-08 reasoning: Claude studies the brand brief and viz type to determine which options make sense. A leaderboard gets maxRows/showGlow/scoreDigits; a KPI gets field/label/unit/decimals/showDelta. The blueprint guides but doesn't dictate.

### accentIntensity Scaling
- **D-05:** Linear mapping: `intensity / 100` multiplied directly against glow properties (shadowBlur, shadowColor alpha). Simple, predictable, 0 = no effect, 100 = full.
- **D-06:** accentIntensity=0 means clean and flat — no glow, no shadow, no ambient. Typography and gradients (DPR-01/03) still present but all decorative "mood" effects disappear. Good accessibility fallback.
- **D-07:** accentIntensity ONLY controls glow (shadowBlur + shadowColor alpha). Other mood effects (ambient light, vignette, accent lines, glass panels) get their own individual formatter settings so users can tune each independently.

### Light Theme Design Rules
- **D-08:** Hard rule — hero text is ALWAYS `t.text` (100% opacity) on light theme. Never use `t.textDim` or `t.textMuted` for hero values on light backgrounds. This is a structural enforcement, not a suggestion. (Memory: test24 ghost-text bug.)
- **D-09:** Light theme philosophy is Claude's discretion per brand — warmth vs neutral vs brand-tinted. No single prescribed approach.
- **D-10:** Glow/shadow scaling on light theme is Claude's discretion. REQUIREMENTS.md suggests `gi * (isDark ? 1.0 : 0.4)` as reference but Claude may determine a better approach per brand.

### Formatter Section Organization
- **D-11:** Hybrid grouping: Data fields first, then appearance controls clustered by what they affect (text color with text settings, glow with effects settings, etc.). Logical clustering over arbitrary categories.
- **D-12:** Minimum 4 section-labels in formatter.html (update DQG-05 threshold from 3 to 4 for Phase 7+ vizs).
- **D-13:** Help text only on non-obvious controls (e.g., "accentIntensity: Scales glow and shadow strength 0-100"). Skip help on self-explanatory controls like "Accent Color."

### Claude's Discretion
- Light theme philosophy (warmth vs neutral vs brand-tinted) — per brand
- Glow/shadow behavior on light theme — per brand
- Which individual mood effects get their own formatter toggles vs which stay auto-applied by mood
- Whether to add brand-specific formatter options beyond the blueprint baseline
- Which blueprint "Settings:" to include vs drop for a given brand

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 Design Layer (just completed — foundation for this phase)
- `plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md` — DPR-01 through DPR-10, Canvas API mappings
- `plugins/splunk-viz-packs/skills/vp-design/references/consistency-grid.md` — CON-01 through CON-05, shared function formulas
- `plugins/splunk-viz-packs/skills/vp-recipes/references/depth-recipes.md` — ambient light, vignette, gradient mesh, accent lines
- `plugins/splunk-viz-packs/skills/vp-recipes/references/texture-recipes.md` — noise grain, glass panels, tinted neutrals

### Code Generation Templates (being modified in this phase)
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — Exact Splunk HTML templates for formatter controls
- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` — Theme.js with DARK/LIGHT objects, getSpacing, getTypoScale, getHoverAlpha
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — Per-viz-type "Settings:" lists and creative direction

### SKILL Files (generation orchestration)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — Main viz generation skill with MUST-LOAD block
- `plugins/splunk-viz-packs/skills/vp-recipes/SKILL.md` — Recipe skill index

### Requirements
- `.planning/REQUIREMENTS.md` — CFG-01 through CFG-08 and THM-01 through THM-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `formatter-patterns.md` (196 lines): Has exact HTML templates for text input, radio toggle, color picker, theme selector, dropdown, number input. All use `{{VIZ_NAMESPACE}}` placeholder.
- `theme-template.md`: Already has independent DARK/LIGHT objects (not inverted). Has `getSpacing`, `getTypoScale`, `getHoverAlpha` shared functions. Comment says "Light theme is NOT an inversion of dark. Design independently."
- `viz-blueprints.md`: Already has "Settings:" list per viz type — this is the formatter derivation baseline.
- `validate_viz.sh` Phase 3 checks: Already validates formatter/JS bidirectional wiring (FAIL B-codes). DQG-05 (section-label count) plugs in at Phase 8.

### Established Patterns
- Inline code generation: formatter.html and visualization_source.js MUST be written inline in same context (not subagents). Proven in test22a/22b.
- `{{VIZ_NAMESPACE}}` in all formatter `name=` attributes — enforced by FAIL B10.
- `value=` (not `default=`) on form controls — enforced by FAIL B7.
- `type="custom"` on color pickers — enforced by FAIL B5.
- `themeMode` default is `"auto"` — enforced by FAIL B20.

### Integration Points
- `vp-viz SKILL.md` step 7: Where formatter.html is generated — needs per-type option derivation logic
- `vp-viz SKILL.md` step 5: Where visualization_source.js is generated — needs accentIntensity reading + light theme rules
- `theme-template.md` LIGHT object: Needs to express the "deliberately designed" light theme tokens

</code_context>

<specifics>
## Specific Ideas

- Individual mood effect toggles (ambient light, vignette, etc.) should each be a formatter control so users can tune independently rather than relying only on accentIntensity for all effects
- Dashboard Studio already handles bgColor/fontColor at panel level — don't duplicate those in viz formatters
- DQG-05 threshold should be updated from 3 to 4 section-labels minimum for Phase 7+ generated vizs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-Generation Quality & Theme Parity*
*Context gathered: 2026-05-16*
