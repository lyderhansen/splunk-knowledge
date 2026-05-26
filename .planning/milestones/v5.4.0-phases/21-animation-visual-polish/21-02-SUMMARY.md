---
phase: 21-animation-visual-polish
plan: 02
subsystem: skill-docs
tags: [splunk-viz-packs, vp-viz, animation, light-theme, skill-enforcement]

# Dependency graph
requires:
  - phase: 20-series-colors
    provides: baseline skill files that this plan augments
provides:
  - Animation enforcement checklist items in vp-viz SKILL.md CRITICAL SUBSET
  - Light theme contrast guard in vp-viz SKILL.md CRITICAL SUBSET
  - "NOT decorative" enforcement paragraph in viz-blueprints.md animation settings section
affects: [vp-viz, animation-recipes, viz-blueprints]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Animation controls documented as mandatory JS branching requirements, not optional decorative toggles"
    - "Light theme contrast warning at the checklist level, referencing known ghost-text pitfall"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md

key-decisions:
  - "rAF entrance loop, setInterval pulse, and animationSpeed multipliers called out explicitly in CRITICAL SUBSET — not just in animation-recipes.md"
  - "D08 limitation documented: it catches unread controls but not controls with no JS effect"
  - "SKILL.md stays under 500 lines (463 lines after additions)"

patterns-established:
  - "Enforcement pattern: checklist item says what MUST happen + calls out the failure mode"

requirements-completed: [AN-01, AN-02, AN-03, VP-02]

# Metrics
duration: 8min
completed: 2026-05-19
---

# Phase 21 Plan 02: Animation Enforcement + Light Theme Contrast — Skill Documentation

**Added mandatory animation JS branching requirements to vp-viz SKILL.md CRITICAL SUBSET and "NOT decorative" enforcement paragraph to viz-blueprints.md, closing the gap where animation controls were documented but not enforced.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-19T00:00:00Z
- **Completed:** 2026-05-19T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added animation enforcement item to SKILL.md CRITICAL SUBSET: rAF entrance loop with this._entranceDone flag, setInterval pulse loop, animationSpeed slow/normal/fast multipliers — all marked as mandatory, not optional
- Added light theme contrast guard to SKILL.md CRITICAL SUBSET: hero values must use t.text (full opacity), never textFaint or textDim
- Updated CRITICAL SUBSET header from "10 most-failed rules" to "12 most-failed rules" to reflect the two new items
- Inserted "NOT decorative settings" enforcement block in viz-blueprints.md immediately after the flashCritical Note line, before the Drilldown section
- Documented D08 limitation: the check catches unread formatter controls but cannot detect controls that are read but produce no JS branching effect

## Task Commits

1. **Task 1: Add animation + light theme checklist items to vp-viz SKILL.md** - `20b8bb1` (feat)
2. **Task 2: Add animation enforcement paragraph to viz-blueprints.md** - `f8c8a0b` (feat)

**Plan metadata:** (final docs commit to follow)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` - Two new CRITICAL SUBSET items: animation enforcement and light theme contrast guard; header updated to "12 most-failed rules"; file at 463 lines (within 500-line limit)
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` - "NOT decorative settings" enforcement block inserted after animation settings Note line, documenting per-control JS requirements and D08 limitation

## Decisions Made

- Placed both new items in CRITICAL SUBSET rather than only in the full pre-code-checklist.md — the CRITICAL SUBSET is the highest-visibility location Claude reads before writing any code
- Used imperative "MUST" language throughout to distinguish from guidance ("should") items
- Documented animationSpeed multipliers inline in the checklist item (slow=1.5x, normal=1.0x, fast=0.6x) so the values are immediately actionable without requiring a file read

## Deviations from Plan

None — plan executed exactly as written.

Note: The plan's verification check `grep -c "rAF entrance" SKILL.md` expected a count of 1, but the existing animation-recipes cross-reference at line 410 already contained "rAF entrance", so the count is 2. This is a pre-existing occurrence; the new CRITICAL SUBSET item at line 64 is present and correct.

## Issues Encountered

None — both edits applied cleanly.

## Next Phase Readiness

- Animation enforcement guidance is now at the point Claude reads before writing any viz code
- Plan 03 (check_design.js D01 gradient escalation) can proceed — these are independent skill-doc vs. validator changes
- Future test sessions will surface whether the checklist additions are sufficient to drive correct JS branching

---
*Phase: 21-animation-visual-polish*
*Completed: 2026-05-19*
