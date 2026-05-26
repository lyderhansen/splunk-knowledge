---
phase: 23-color-palette-accent-foundation
plan: 01
subsystem: ui
tags: [splunk, formatter, color-picker, brand-palette, theme]

# Dependency graph
requires: []
provides:
  - formatter-patterns.md color picker template with 8-swatch brand palette placeholders
  - pre-code-checklist.md brand swatch gate item
affects: [vp-viz, vp-create, vp-couture, splunk-viz-packs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Color picker template: 8 FILL_ placeholder swatches with populate-from-DARK comment"
    - "Pre-code checklist gate: 6-8 brand swatches before writing code"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md

key-decisions:
  - "Color picker template uses FILL_ placeholder names (FILL_ACCENT, FILL_S1..S5, FILL_BG, FILL_PANEL) so the instruction is self-documenting at generation time"
  - "Example block added inline under template (not in a separate section) to keep the doc compact and under 449 lines"
  - "Checklist item placed directly after minimum-10-controls item (same Formatter block) for discovery proximity"

patterns-established:
  - "Brand swatch rule: every <splunk-color-picker> MUST have 6-8 <splunk-color> elements from theme.js DARK at generation time"

requirements-completed: [CP-01]

# Metrics
duration: 3min
completed: 2026-05-20
---

# Phase 23 Plan 01: Color Palette & Accent Foundation — Brand Swatch Template Summary

**8-swatch brand palette template and pre-code gate added so every generated formatter color picker ships with theme.js DARK colors instead of zero or one generic swatches**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-20T11:06:39Z
- **Completed:** 2026-05-20T11:10:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced 2-swatch generic color picker template with 8-swatch template using FILL_ placeholders (accent, S1-S5, BG, PANEL) and explicit populate-from-DARK comment
- Added concrete Spotify-inspired example showing what hex values look like when filled in from theme.js DARK
- Updated bottom-of-file note to reinforce the 6-8 swatch rule and apply it to the Full formatter example's Series 1-5 pickers
- Added brand swatch checklist item to pre-code-checklist.md immediately after "minimum 10 controls" in the Formatter block

## Task Commits

Each task was committed atomically:

1. **Task 1: Update formatter-patterns.md color picker template** - `a19726d` (feat)
2. **Task 2: Add brand swatch checklist item to pre-code-checklist.md** - `29a0db2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` - Color picker template updated with 8 FILL_ placeholders + populate-from-DARK comment + Spotify example; note at bottom updated; 449 lines (under 450)
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md` - New checkbox item for 6-8 brand swatches from theme.js DARK palette added after "minimum 10 controls" item

## Decisions Made

- Used `#FILL_ACCENT`, `#FILL_S1` etc. as placeholder names rather than `{FILL}` to make the instruction self-documenting — when a generator sees these names it's obvious what each slot maps to in theme.js
- Condensed the 3-line comment into a single line to keep formatter-patterns.md under the 449-line target
- Removed the blank line between the template ``` closing and the example ``` opening to reclaim the 1 line needed to meet the limit

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Minor: initial edit added 24 lines (8 placeholder swatches + example block) against the 450-line cap, requiring three rounds of trimming (condensed comment, removed separator line, removed blank between code blocks). All trimming preserved the required content.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CP-01 satisfied: formatter-patterns.md template and pre-code-checklist.md both enforce 6-8 brand swatches from theme.js DARK
- Plans 02 and 03 can proceed independently (CP-02 light theme WCAG AA, CP-03 accentColor Effects section)

## Self-Check

### Files exist:
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md`: verified (449 lines, splunk-color>#FILL_ACCENT count=1)
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md`: verified ("6-8 brand swatches" count=1)

### Commits exist:
- `a19726d` feat(23-01): update color picker template with 8-swatch brand palette instruction
- `29a0db2` feat(23-01): add brand swatch checklist item to pre-code-checklist.md

## Self-Check: PASSED

---
*Phase: 23-color-palette-accent-foundation*
*Completed: 2026-05-20*
