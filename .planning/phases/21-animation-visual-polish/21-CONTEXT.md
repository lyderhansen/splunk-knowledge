# Phase 21: Animation & Visual Polish — Context

## Domain Boundary

Make animation formatter controls produce their promised behaviors (entrance, LED pulse, speed) and enforce gradient fills + light theme contrast. The animation recipes already exist in animation-recipes.md — this phase wires them into the generation guidance.

## Requirements

- AN-01: showEntrance toggle works
- AN-02: flashCritical LED pulse works
- AN-03: animationSpeed produces different timing
- VP-01: Gradient fills enforced when visual language specifies gradient
- VP-02: Light theme WCAG AA contrast verified
- VP-03: seriesColors for built-in panels (already done in Phase 20)

## Decisions

### D-01: D01 becomes conditional FAIL for gradient enforcement (VP-01)

check_design.js D01 currently WARNs when no gradient calls are found. Change behavior:
- **Default:** WARN (no change for vizs without visual language annotation)
- **When `fillTechnique: gradient` is specified:** Escalate to FAIL

**Implementation:** The viz pack's `shared/theme.js` already contains visual language values (cornerRadius, shadowDepth, etc.). Add `fillTechnique` to the theme export. check_design.js reads `shared/theme.js` for the pack, checks for `fillTechnique` containing `'gradient'`, and escalates D01 to FAIL when present.

**Files:** check_design.js (D01 escalation), test_check_design.js (new fixture), theme-template.md (add fillTechnique export)

### D-02: Animation enforcement via viz-blueprints.md per-viz patterns (AN-01, AN-02, AN-03)

The animation recipes exist in animation-recipes.md. The problem is Claude reads them but doesn't always implement them.

**Fix:** Add a MANDATORY animation checklist item to vp-viz SKILL.md pre-code checklist:
- "Every viz reads showEntrance, flashCritical, animationSpeed via opt() — if control is in formatter, the JS MUST use it (D08 catches missing reads, but logic must actually branch on the value)"

Also update viz-blueprints.md animation settings section to explicitly state: "These are NOT decorative settings. If showEntrance is in your formatter, your JS MUST contain an rAF entrance loop that checks this._entranceDone. If flashCritical is in your formatter, your JS MUST contain a setInterval pulse loop."

**Files:** vp-viz SKILL.md (checklist item), viz-blueprints.md (animation settings enforcement text)

### D-03: Light theme verification via existing check_contrast.js (VP-02)

check_contrast.js already verifies theme.js LIGHT palette token pairs against WCAG AA (4.5:1). This is sufficient — the theme tokens define what colors the viz code uses, so if the tokens pass contrast, the rendered output passes.

**Enhancement:** Add a note to the pre-code checklist in vp-viz SKILL.md: "After writing theme.js LIGHT object, mentally verify hero text color against bg — if textFaint is used for hero values, replace with text (full opacity). Reference: feedback_light_theme_contrast.md"

**File:** vp-viz SKILL.md (checklist note)

### VP-03: Already shipped

seriesColors and seriesColorsByField patterns were documented in dashboard-interactivity.md Section 8 during Phase 20. No additional work needed.

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — D01 check to modify
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` — D01 test fixtures
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` — existing recipes
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — pre-code checklist
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — animation settings section
- `plugins/splunk-viz-packs/skills/vp-design/references/theme-template.md` — fillTechnique export

## Deferred Ideas

None.
