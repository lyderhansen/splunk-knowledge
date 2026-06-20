---
phase: 51-splunk-spl-reference-debt
plan: 01
subsystem: documentation
tags: [splunk-spl, reference, gotchas, spl, harvest]

# Dependency graph
requires: []
provides:
  - "spl-gotchas trap #27 (relative_time All-time picker case() wrapper)"
  - "spl-gotchas Token substitution safety section"
  - "spl-gotchas Reshape recipes pointer to reference/reshape-wide-to-tall.md"
  - "reference/reshape-wide-to-tall.md full makemv+mvexpand+case recipe"
  - "multisearch.md inputlookup incompatibility gotcha"
  - "stats.md round(avg(field), N) invalid-syntax gotcha"
  - "splunk-spl plugin v1.2.1"
affects: [52-dashboard-relative-time, splunk-spl, vp-create]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Long how-to recipes live in reference/ with a pointer+summary in spl-gotchas to respect the SKILL.md line budget"
    - "Token-fed functions guarded with case()/if() edge-case branches"

key-files:
  created:
    - plugins/splunk-spl/reference/reshape-wide-to-tall.md
  modified:
    - plugins/splunk-spl/skills/spl-gotchas/SKILL.md
    - plugins/splunk-spl/reference/multisearch.md
    - plugins/splunk-spl/reference/stats.md
    - plugins/splunk-spl/.claude-plugin/plugin.json

key-decisions:
  - "SPL-04 full recipe placed in reference/reshape-wide-to-tall.md, only a pointer+summary in spl-gotchas, to respect the 555-line cap"
  - "Removed two redundant '---' separators between the three new sibling sections to land spl-gotchas exactly at 555 lines"
  - "Bumped plugin.json description count 26 -> 27 traps to match the new trap"

patterns-established:
  - "Token substitution safety: never let a token flow directly into a format-strict function; wrap in case()/if()"
  - "Wide->tall reshape via makemv+mvexpand+case instead of untable for Canvas vizs"

requirements-completed: [SPL-01, SPL-02, SPL-03, SPL-04, SPL-05]

# Metrics
duration: 14min
completed: 2026-06-20
---

# Phase 51 Plan 01: splunk-spl Reference Debt Summary

**Harvested four real-build SPL traps (All-time relative_time, multisearch+inputlookup, stats round(avg), token substitution safety) plus a wide->tall reshape recipe into the splunk-spl plugin and bumped it to v1.2.1.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-20
- **Completed:** 2026-06-20
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 edited)

## Accomplishments
- Added numbered trap #27 documenting `relative_time(now(), "0")` All-time picker breakage with the verbatim `case()` wrapper, cross-referencing Phase 52 DS-04 by name only.
- Added a "Token substitution safety" section naming trap #27 as its canonical worked example (SPL-01 <-> SPL-05 link is coherent, same commit).
- Created `reference/reshape-wide-to-tall.md` with the test52 makemv+mvexpand+case recipe and an explicit non-contradicting distinction from trap #19 (sparkline typing).
- Added per-command gotchas to multisearch.md (inputlookup incompatibility + append/discriminator alternative) and stats.md (round(avg(field), N) invalid syntax + post-stats eval correction).
- Bumped plugin version 1.2.0 -> 1.2.1; spl-gotchas held at exactly 555 lines (cap respected).

## Task Commits

1. **Task 1: trap #27 + token-safety + reshape recipe** - `3f96c319` (docs)
2. **Task 2: multisearch+inputlookup + stats round(avg) gotchas** - `f81c8ff9` (docs)
3. **Task 3: version bump to 1.2.1 + line-count trim** - `3b9dc9b6` (docs)

## Files Created/Modified
- `plugins/splunk-spl/skills/spl-gotchas/SKILL.md` - Trap #27, Token substitution safety section, Reshape recipes pointer (final: 555 lines, up from 529)
- `plugins/splunk-spl/reference/reshape-wide-to-tall.md` - New: full wide->tall reshape recipe + trap #19 distinction
- `plugins/splunk-spl/reference/multisearch.md` - inputlookup incompatibility gotcha
- `plugins/splunk-spl/reference/stats.md` - round(avg(field), N) invalid-syntax gotcha
- `plugins/splunk-spl/.claude-plugin/plugin.json` - version 1.2.1, trap count 26 -> 27

## Decisions Made
- Placed SPL-04's full recipe in reference/ (pointer in spl-gotchas) per the line-budget constraint.
- After adding all content the file was 559 lines (over the 555 cap, because trap #27's verbatim SPL block is ~8 lines longer than the plan's ~13-line estimate). Removed two redundant `---` separators between the three new sibling sections (Token safety, Reshape recipes, Command index) to land exactly at 555. The `## Command index` heading still provides clean visual separation, so no readability loss.
- Bumped the plugin.json description's trap count from 26 to 27 to keep it accurate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] spl-gotchas exceeded the 555-line verify gate**
- **Found during:** Task 3 (line-count verification)
- **Issue:** After the verbatim content additions the file was 559 lines; the Task 3 `<verify>` hard-gates at `<= 555`. The overrun came from trap #27's required verbatim SPL fenced block being ~8 lines longer than the plan's ~13-line estimate. The full recipe was correctly in reference/, not the cause.
- **Fix:** Removed two redundant `---` section separators between the three newly-added sibling sections. No content was cut; all verbatim snippets remain intact.
- **Files modified:** plugins/splunk-spl/skills/spl-gotchas/SKILL.md
- **Verification:** `test "$(wc -l < ...)" -le 555` -> PASS at exactly 555 lines.
- **Committed in:** 3b9dc9b6 (Task 3 commit)

**2. [Rule 2 - Missing Critical] Updated plugin.json description trap count**
- **Found during:** Task 3 (version bump)
- **Issue:** Description stated "26 silent-fail traps"; adding trap #27 made it stale/inaccurate.
- **Fix:** Changed 26 -> 27 in the description string.
- **Files modified:** plugins/splunk-spl/.claude-plugin/plugin.json
- **Verification:** Visual; version verify still PASS.
- **Committed in:** 3b9dc9b6 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical/accuracy)
**Impact on plan:** Both within scope and necessary to pass verification and keep metadata accurate. No content paraphrased; all verbatim snippets preserved. No scope creep.

## Issues Encountered
None beyond the line-budget overrun documented above.

## User Setup Required
None - documentation-only changes.

## Next Phase Readiness
- SPL-language side of the All-time `relative_time` trap is documented and linked by name to Phase 52 DS-04, which owns the dashboard-side wrapper. Phase 52 can cross-reference trap #27 without duplication.
- splunk-spl is at v1.2.1 with 27 traps + the new reshape reference file.

## Self-Check: PASSED

- FOUND: plugins/splunk-spl/reference/reshape-wide-to-tall.md
- FOUND: plugins/splunk-spl/skills/spl-gotchas/SKILL.md (trap #27, token-safety, reshape pointer)
- FOUND: plugins/splunk-spl/reference/multisearch.md (inputlookup gotcha)
- FOUND: plugins/splunk-spl/reference/stats.md (round(avg) gotcha)
- FOUND: plugins/splunk-spl/.claude-plugin/plugin.json (1.2.1)
- FOUND commits: 3f96c319, f81c8ff9, 3b9dc9b6

---
*Phase: 51-splunk-spl-reference-debt*
*Completed: 2026-06-20*
