---
phase: 43-deep-review
plan: 08
subsystem: plugin-skills
tags: [splunk-viz-packs, vp-debug, vp-design, skill-docs, gap-closure]

# Dependency graph
requires:
  - phase: 43-deep-review
    provides: Wave 2 SKILL.md review findings (B-9, B-10, B-11, W-12, W-14, W-15, W-20)
provides:
  - vp-debug/SKILL.md with B1-B23 heading, THM-05 debug entry, E/A/AF codes, W-20 scope note
  - vp-design/SKILL.md with CP-01 brand swatch step, accent role note, FC-02 hand-off forward
affects: [43-09, 43-12, splunk-viz-packs-runtime]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quick-fix table rows use 2-column format: symptom | rule/fix"
    - "Scope limitation notes added as blockquote after relevant sections"
    - "CP-01 brand swatch extraction step added as step 5 in Brand Research"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-debug/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md

key-decisions:
  - "W-20 (check_design scope gap) added as vp-debug scope note rather than editing pre-code-checklist.md (owned by plan 43-07)"
  - "Accent role note placed as blockquote after design brief code block, not inside it"
  - "AF-01 quick-fix row added to vp-debug even though strictly W-12 is vp-viz/SKILL.md — justified by Wave 2 W-3 finding that vp-debug lacks it entirely"

patterns-established:
  - "THM-05 debugging: check opt('backgroundColor') read unconditionally outside dark branch"
  - "CP-01 brand swatch extraction: 6-8 splunk-color presets including primary, secondary, accent, variants, neutral"

requirements-completed:
  - DR-01
  - DR-02

# Metrics
duration: 20min
completed: 2026-05-25
---

# Phase 43 Plan 08: vp-design + vp-debug SKILL.md Gap Closure Summary

**vp-debug heading range corrected to B1-B23, THM-05 and E/A/AF debug entries added; vp-design gains CP-01 brand swatch extraction step, accent role guard, and FC-02 Format forwarding reminder**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-25T00:00:00Z
- **Completed:** 2026-05-25T00:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed stale BROKEN heading range in vp-debug (B1-B21 → B1-B23) — developers debugging B22/B23 issues will no longer see a heading that implies those rules don't exist
- Added THM-05 flowchart entry and quick-fix row to vp-debug — Phase 42's light-mode backgroundColor fix is now discoverable when debugging "background color wrong in light mode"
- Added E01-E05, A01-A04, and AF-01 quick-fix rows to vp-debug — Extension API, asset, and animation scope failures now have vp-debug breadcrumbs
- Added W-20 scope note to vp-debug: check_design.js only validates formatter.html; Extension API vizs bypass D01-D11 by design
- Added CP-01 brand swatch extraction as step 5 in vp-design Brand Research — generated formatters will now have 6-8 brand-specific color picker presets instead of empty rails
- Added accent role note below design brief output: `accent` is hover/glow/selection only, series colors use `getSeriesColor()` — prevents misuse of accent as primary data color
- Updated vp-design hand-off message with FC-02 reminder: include Format (classic/extension) when passing context to vp-viz

## Task Commits

Each task was committed atomically:

1. **Task 1: vp-debug SKILL.md — B1-B23 heading, THM-05, E/A-codes, AF-01, W-20 note** - `c12813c3` (fix)
2. **Task 2: vp-design SKILL.md — CP-01 brand swatches, accent role note, FC-02 hand-off** - `75cdef64` (fix)

**Plan metadata:** `(see final commit)` (docs: complete plan)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-debug/SKILL.md` — B1-B23 heading fix, THM-05 flowchart + quick-fix, E01-E05/A01-A04/AF-01 quick-fix rows, W-20 scope note
- `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` — CP-01 step 5 in Brand Research, accent role blockquote, FC-02 in hand-off message

## Decisions Made

- **W-20 placement:** The check_design.js scope gap (W-20) was documented as a scope note in vp-debug rather than editing pre-code-checklist.md — pre-code-checklist.md is owned by plan 43-07. The note in vp-debug provides actionable guidance (use E01-E05 for Extension API vizs) without causing file overlap between parallel executor plans.
- **Accent note location:** The accent role note was placed as a blockquote immediately after the design brief code block (line 176) rather than inside the code block — keeps the template clean while making the constraint visible to readers.
- **AF-01 in vp-debug:** Wave 2 W-3 finding identified AF-01 absent from vp-debug. Added quick-fix row for "Animation has no effect" → AF-01 pointing to animation-recipes.md. This slightly exceeds the explicit plan scope (plan listed only E-codes and A-codes) but is strictly correct per the Wave 2 review findings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added AF-01 quick-fix row to vp-debug**
- **Found during:** Task 1 (vp-debug edits)
- **Issue:** Wave 2 W-3 finding (Animation Helper Scope Rule absent from vp-debug) was listed in the plan's action step but not explicitly in the acceptance criteria — however the plan task text says "Add E01-E05 quick-fix row" and "A01-A02 quick-fix rows" only. Since W-3 is a genuine documentation gap and the fix is trivial (one table row), added it.
- **Fix:** Added `| Animation has no effect | AF-01 — opt() called inside a helper; pass computed values as params (see animation-recipes.md AF-01) |` to quick-fix table
- **Files modified:** plugins/splunk-viz-packs/skills/vp-debug/SKILL.md
- **Committed in:** c12813c3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical documentation)
**Impact on plan:** AF-01 row is one additional line, well within 375-line budget. No scope creep — strictly within the set of Wave 2 WARNING findings assigned to this plan.

## Issues Encountered

- Initial attempt to add the accent note inside the code block accidentally split the code block structure. Detected during review and corrected by placing the note as a blockquote after the closing ``` of the design brief template.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- B-9, B-10, B-11 BLOCKERs resolved
- W-12 (AF-01 eager in vp-viz/SKILL.md — separate from vp-debug AF-01 fix), W-14, W-15 WARNINGs resolved
- W-20 check_design scope gap documented in vp-debug (pre-code-checklist.md edit deferred to plan 43-07)
- Both SKILL.md files remain well under 500-line budget (vp-debug: 133/500, vp-design: 214/500)
- No test files modified

## Self-Check

Checking key claims before finalizing:

- `B1-B23` in vp-debug: confirmed (1 occurrence at heading line)
- `THM-05` in vp-debug: confirmed (2 occurrences — flowchart + quick-fix)
- `E01-E05` in vp-debug: confirmed (2 occurrences — quick-fix row has 2 instances of pattern)
- `CP-01` in vp-design: confirmed (1 occurrence in Brand Research step 5)
- `DPR-03b` in vp-design: confirmed (1 occurrence in accent note)
- `FC-02` in vp-design: confirmed (1 occurrence in hand-off message)
- vp-debug line count: 133/500 — PASS
- vp-design line count: 214/500 — PASS
- Commit c12813c3: Task 1 — CONFIRMED
- Commit 75cdef64: Task 2 — CONFIRMED

## Self-Check: PASSED

---
*Phase: 43-deep-review*
*Completed: 2026-05-25*
