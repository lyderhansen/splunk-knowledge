---
phase: 09-animation-motion
plan: "01"
subsystem: splunk-viz-packs/skills/vp-recipes
tags: [animation, skill-docs, vp-recipes, ES5, rAF]
dependency_graph:
  requires: []
  provides: [animation-recipes.md activated, ANI-01 patterns, ANI-02 patterns, ANI-03 patterns, ANI-04 patterns, ANI-06 patterns]
  affects: [vp-viz SKILL.md MUST-LOAD wiring (plan 03)]
tech_stack:
  added: []
  patterns: [requestAnimationFrame entrance, LED pulse rAF, eased hover lerp, staggered row entrance, prefers-reduced-motion ES5]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
decisions:
  - "DO NOT LOAD gate removed — animation-recipes.md is now fully active and ready for MUST-LOAD wiring in plan 03"
  - "All four new sections (entrance, LED pulse, hover easing, stagger) added with ES5-only code"
  - "prefers-reduced-motion uses try/catch pattern for ES5 environments lacking window.matchMedia"
  - "Three-tier speedMult (slow=1.5x, normal=1.0x, fast=0.6x) documented on single line matching acceptance grep"
metrics:
  duration: "~3 min"
  completed: "2026-05-16"
  tasks_completed: 1
  files_modified: 1
---

# Phase 9 Plan 01: Animation Recipes Expansion Summary

**One-liner:** Animation-recipes.md expanded from 191 to 373 lines with all four ANI pattern sections (entrance rAF, LED pulse, hover easing, stagger), prefers-reduced-motion enforcement, and three-tier animationSpeed multiplier — DO NOT LOAD gate removed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove gate and add rAF entrance + LED pulse + prefers-reduced-motion patterns | d543823 | plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md |

## What Was Built

Rewrote `animation-recipes.md` from a 191-line gated placeholder into a 373-line fully activated pattern library. All pre-existing content was preserved (setInterval lifecycle, easing functions, speed modifiers table, motion timing constants, rAF baseline pattern) and four new sections were added:

1. **rAF entrance per viz type (ANI-01):** One-shot entrance with `_entranceDone` + `_animating` guards, 350ms base duration multiplied by `speedMult`, and a per-viz style table (gauge=arc fill/easeOutQuart, bar=height grow/easeOutQuart, KPI=count-up/easeOutExpo, table/leaderboard=stagger, area/line=left-to-right draw). `reanimateOnRefresh` documented as default OFF.

2. **LED pulse pattern (ANI-02):** Continuous rAF loop using `sin()` to oscillate `shadowBlur` between 4–12px at 700ms cadence. `_pulsing` guard prevents stacked loops. `_stopPulse()` documented for `destroy()` cleanup. All shadow mutations use `ctx.save()/ctx.restore()` per ECR-05. Default OFF (`flashCritical: false`), triggered only on critical/error severity data.

3. **Eased hover transition (ANI-03):** Lerps `_hoverAlpha` 0→0.12 on enter, 0.12→0 on leave, over 150ms with `easeInOutQuad`. `_hoverAnimating` guard prevents stacked rAF. Per-viz behavior table documents chart-types needing value label alongside highlight vs. table/leaderboard highlight-only.

4. **Staggered row entrance (ANI-04):** Per-row delay offset, total stagger capped at 500ms regardless of row count. `Math.min(500 / rowCount, 80)` per-row delay formula documented.

Also added:
- **prefers-reduced-motion section:** ES5 `try/catch` detection function, enforcement table specifying which features are disabled (entrance/pulse) vs. allowed (hover highlight).
- **Three-tier speedMult update** to existing speed modifiers section: `slow=1.5x, normal=1.0x, fast=0.6x` on a single line (matching acceptance grep check), plus `getSpeedMult()` helper function.
- **Cross-references updated:** Removed gating note, added ECR-05 edge-cases.md link, updated to "MUST-LOAD wired in vp-viz SKILL.md" note.

## Verification Results

| Check | Result | Target |
|-------|--------|--------|
| DO NOT LOAD gate | 0 occurrences | 0 |
| requestAnimationFrame | 12 occurrences | >=4 |
| shadowBlur | 3 occurrences | >=2 |
| 150ms hover | 3 occurrences | >=1 |
| prefers-reduced-motion | 2 occurrences | >=2 |
| ES5 violations (const/let/arrow) | 0 | 0 |
| Phase 9 only text | 0 | 0 |
| speedMult single-line match | PASS | pattern match |
| stagger 500ms cap | 2 occurrences | >=1 |
| Line count | 373 | 300-380 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — animation-recipes.md is a complete pattern library with no placeholder content. All patterns include runnable ES5 code with destroy() cleanup, guard flags, and ECR-05 compliance notes.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan modified documentation only (a markdown reference file). No threat flags.

## Self-Check: PASSED

- [x] File exists: `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md`
- [x] Commit d543823 exists in git log
- [x] All acceptance criteria verified (373 lines, 0 ES5 violations, all patterns present)
