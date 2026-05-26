---
phase: 16-code-quality-reference-cleanup
plan: 01
subsystem: documentation
tags: [canvas-recipes, reference-cleanup, cross-references, vp-viz]

# Dependency graph
requires:
  - phase: 06-premium-rendering-recipes
    provides: "split recipe files (depth, texture, typography, animation) that canvas-recipes.md now cross-references"
provides:
  - "canvas-recipes.md trimmed from 998 to 498 lines (50% reduction)"
  - "Cross-references to all 4 split recipe files for every removed section"
  - "All 20 essential functional patterns preserved and verified"
affects: [vp-viz, vp-create, vp-recipes, all phases that load canvas-recipes.md for viz generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-reference pattern: remove duplicates, add inline pointer to authoritative split file"
    - "Inline code block condensing: preserve function signatures and logic, collapse boilerplate spacing"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md

key-decisions:
  - "Removed tinted neutrals section entirely — authoritative copy is in texture-recipes.md (DPR-02)"
  - "Removed stagger entrance sub-section — authoritative copy is in animation-recipes.md (ANI-04)"
  - "Removed fitText bold variant — authoritative copy is in typography-recipes.md"
  - "Removed simple roundRect duplicate — kept only the guarded version with null/negative-radius guard"
  - "Replaced full animation setInterval block with 3-line cross-reference to animation-recipes.md"
  - "Removed decimals control table — fmtNum recipe and decimals recipe already cover this"
  - "Condensed hover tooltip system from ~210 lines to ~65 lines (kept initialize, _onMouseMove, rectangular hitTest, table row highlight; cross-referenced donut/line patterns)"
  - "Condensed remaining verbose sections (badge colors, font loading, variable scope, date parsing, data principles, effects stacking order)"

patterns-established:
  - "Condensation pattern: code block line reduction by collapsing single-statement lines onto one line while preserving readability"
  - "Cross-reference format: 'See [split-file.md](path) — functionName description. Never [anti-pattern].'"

requirements-completed: [CQ-01]

# Metrics
duration: 12min
completed: 2026-05-18
---

# Phase 16 Plan 01: Canvas Recipes Trim Summary

**canvas-recipes.md halved from 998 to 498 lines by removing duplicates of split recipe files and condensing verbose sections, with cross-references replacing all removed content**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-18T19:32:00Z
- **Completed:** 2026-05-18T19:44:03Z
- **Tasks:** 2 (1 execution, 1 verification)
- **Files modified:** 1

## Accomplishments

- canvas-recipes.md reduced from 998 to 498 lines (50% reduction) — meets CQ-01 requirement
- All 20 essential functional patterns verified present via grep
- All 4 split file cross-references (depth, texture, typography, animation) confirmed in top table
- Every removed section replaced with an inline cross-reference to its authoritative home
- No functional recipe lost — hover tooltip, drilldown, KPI stacking, sparkline, all parsers, all primitives preserved

## Task Commits

1. **Task 1: Audit and trim canvas-recipes.md** - `378bbba` (refactor)
2. **Task 2: Verify cross-references and content completeness** - no commit needed (verification only, no issues found)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md` — trimmed 500 lines: 7 sections removed (duplicates), 6 sections condensed, cross-references added

## Decisions Made

- Removed entire "Tinted neutrals" section (replaced by cross-reference to texture-recipes.md) — function and tint amounts table already authoritative there
- Removed entire "Stagger entrance for lists" sub-section (replaced by cross-reference to animation-recipes.md) — ANI-04 staggered row entrance is authoritative there
- Removed "Fit text to width (bold variant)" (typography-recipes.md is authoritative)
- Removed simple `roundRect` (duplicate of guarded version; kept only guarded version with null/negative-radius guard)
- Removed animation setInterval block — replaced with 3-line cross-reference; rAF is preferred, setInterval for LED pulse is documented in animation-recipes.md
- Removed "Number formatting with decimals control" table — `fmtNum` recipe and `decimals` recipe are already in file
- Condensed hover tooltip system to ~65 lines: kept tooltip setup, `_onMouseMove`, rectangular `_hitTest`, table row highlight; removed donut/line hitTest patterns (now deferred to per-viz implementation note)

## Deviations from Plan

None - plan executed exactly as written. All sections identified in the plan were removed or condensed as specified. All cross-references were added as required.

## Issues Encountered

None. The file required iterative condensation across multiple sections to reach the 500-line target (initial rewrite was 616 lines), but all cuts were within the plan's scope.

## Known Stubs

None — this plan modifies reference documentation only. No data flow or rendering stubs introduced.

## Threat Flags

None — documentation-only change with no runtime impact.

## Next Phase Readiness

- canvas-recipes.md is now under 500 lines and satisfies CQ-01
- Plan 16-02 (generated code quality fixes) can proceed immediately
- All cross-references verified correct — downstream Claude sessions loading canvas-recipes.md will be directed to split files for texture/animation/typography depth content

---
*Phase: 16-code-quality-reference-cleanup*
*Completed: 2026-05-18*

## Self-Check: PASSED

- [FOUND] plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md (498 lines, under 500)
- [FOUND] commit 378bbba (refactor(16-01): trim canvas-recipes.md from 998 to 498 lines)
- All 20 essential patterns confirmed via grep
- All 4 split file cross-references confirmed present
