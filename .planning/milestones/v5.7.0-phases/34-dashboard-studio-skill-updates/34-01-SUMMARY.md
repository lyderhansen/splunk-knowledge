---
phase: 34-dashboard-studio-skill-updates
plan: 01
subsystem: documentation
tags: [splunk-dashboard-studio, drilldowns, tokens, visibility, JSONata, eval-expressions, cross-dashboard]

# Dependency graph
requires: []
provides:
  - "ds-int-drilldowns: linkToDashboard array+value format, key vs value distinction, columnFormat.data DS expression requirement, three-handler chain cross-dashboard ±N minute recipe"
  - "ds-int-tokens: expressions stanza (eval+conditions), JSONata syntax correction, $eval:name$ reference with working/failing locations, version requirements"
  - "ds-int-visibility: input.button toggle recipe, conditions source-code-only caveat, expressions.eval as sibling to conditions"
affects: [splunk-dashboard-studio, drilldowns, tokens, visibility, cross-dashboard-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-handler chain: setToken (capture) → setToken (materialize eval) → linkToDashboard (pass regular tokens)"
    - "JSONata for eval expressions, not SPL eval — & for concat, ? : for ternary, $now() for dates"
    - "input.button toggle with $eval:name$ dynamic label and ternary detailsVisibility toggle"

key-files:
  created: []
  modified:
    - plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-visibility/SKILL.md

key-decisions:
  - "linkToDashboard.tokens must use array+value (never object map, never key) — live-tested error table added"
  - "Dashboard Studio eval uses JSONata not SPL eval — documented with operator table and confirmed differences"
  - "$eval:name$ does NOT work in input.timerange defaultValue — three-handler chain is the only working cross-dashboard time range pattern"
  - "Conditions are source-code only — Token Manager UI creates eval expressions but not conditions"
  - "columnFormat.data must be a DS expression starting with > — plain string causes e.map is not a function"

patterns-established:
  - "Three-handler chain for cross-dashboard ±N minute time range: setToken key→capture, setToken value→materialize eval, linkToDashboard value→pass regular tokens"
  - "input.button toggle: detailsVisibility token + ternary eval for toggle and label + condition for containerOptions.visibility"

requirements-completed: [SU-01, SU-02, SU-03]

# Metrics
duration: 5min
completed: 2026-05-22
---

# Phase 34 Plan 01: Dashboard Studio Skill Updates Summary

**Live-tested corrections to three DS interactivity skills: linkToDashboard array+value format, JSONata eval expressions (not SPL), $eval:name$ limitations, input.button toggle pattern, and three-handler chain cross-dashboard time range recipe**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-22T14:31:34Z
- **Completed:** 2026-05-22T14:36:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Fixed active bug: `linkToDashboard.tokens` documented with tested-format table (object map = `e.map is not a function`, array+key = undefined values, array+value = works)
- Added three-handler chain cross-dashboard ±N minute recipe — the only working pattern for time picker seeding via eval
- Added full `expressions` stanza documentation with JSONata syntax correction, $eval:name$ reference locations, and version requirements table
- Added official `input.button` toggle recipe with complete JSON and key/value distinction note

## Task Commits

1. **Task 1: Update ds-int-drilldowns** - `dc336bdf` (feat)
2. **Task 2: Update ds-int-tokens** - `b1bd370e` (feat)
3. **Task 3: Update ds-int-visibility** - `6939d6db` (feat)

## Files Created/Modified

- `plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md` — linkToDashboard format table, key vs value clarification, columnFormat.data gotcha, three-handler chain recipe (193 → 304 lines)
- `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md` — expressions stanza section, JSONata operators table, $eval:name$ works/fails list, 5th token source (181 → 306 lines)
- `plugins/splunk-dashboard-studio/skills/ds-int-visibility/SKILL.md` — input.button toggle recipe, conditions source-only caveat, expressions.eval as sibling note (261 → 326 lines)

## Decisions Made

- All JSON examples sourced from `tests/test40_rema/HANDOVER-token-eval.md` and official Splunk 10.4 docs — no invented examples
- Three-handler chain documented with step-by-step "why it works" explanation, not just the recipe
- Conditions-source-only limitation prominently placed in both "Where conditions live" section AND the Caveats section to maximize discoverability

## Deviations from Plan

None — plan executed exactly as written. The pre-verification check that "ds-int-visibility already correctly uses containerOptions.visibility" was confirmed by reading the file (schema section at line 29-51 was already correct — only additions were needed).

## Issues Encountered

None — all content was available from the HANDOVER-token-eval.md primary source. The three-handler chain JSON was lifted directly from Part B of the handover (live-tested format).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three critical DS interactivity skills now have live-tested, authoritative content
- Cross-dashboard navigation patterns are documented with exact JSON — ready for vp-create and ds-init to reference
- ds-int-drilldowns, ds-int-tokens, ds-int-visibility are the source of truth for interactive dashboard generation

## Known Stubs

None.

## Threat Flags

None — documentation files only, no network endpoints or auth paths.

## Self-Check: PASSED

Files verified:
- `plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md` — 304 lines (PASS <= 500), three-handler chain present (4 matches), columnFormat.data present (3 matches), eval reference present (7 matches)
- `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md` — 306 lines (PASS <= 500), JSONata present (8 matches), expressions present (10 matches), eval: present (13 matches)
- `plugins/splunk-dashboard-studio/skills/ds-int-visibility/SKILL.md` — 326 lines (PASS <= 500), input.button present (5 matches), Token Manager present (3 matches), containerOptions present (12 matches)

Commits verified: dc336bdf, b1bd370e, 6939d6db

---
*Phase: 34-dashboard-studio-skill-updates*
*Completed: 2026-05-22*
