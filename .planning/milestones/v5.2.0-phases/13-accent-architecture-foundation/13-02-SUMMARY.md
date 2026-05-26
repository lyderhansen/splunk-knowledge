---
phase: 13-accent-architecture-foundation
plan: "02"
subsystem: splunk-viz-packs skill layer
tags: [accent-architecture, series-colors, animation, setInterval, vp-viz, ACC-03, ACC-05, DPR-03b]
dependency_graph:
  requires: [13-01]
  provides: [ACC-01, ACC-02, ACC-05]
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
tech_stack:
  added: []
  patterns:
    - DPR-03b checklist enforcement in vp-viz SKILL.md pre-code checklist
    - ACC-03 uncapped accentIntensity multiplier in SKILL.md code template
    - ACC-05 setInterval 30fps for continuous animations replacing rAF
    - _pulseTimer guard preventing stacked intervals in LED pulse pattern
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
decisions:
  - "setInterval(fn, 33) for LED pulse: ACC-05 rule — rAF at 60fps is too CPU-intensive for dashboards with 5+ animated vizs simultaneously"
  - "Date.now() for elapsed time in setInterval-based pulse: rAF timestamp parameter not available in setInterval callback"
  - "_pulseTimer guard uses timer ID not boolean: clearInterval requires the ID returned by setInterval"
  - "gi floor at 0, no ceiling: ACC-03 allows values >1.0 for extreme glow effects; upper clamp removed from SKILL.md template"
metrics:
  duration: "~180s"
  completed: "2026-05-18T13:44:54Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 13 Plan 02: Code Template Enforcement Summary

Update the vp-viz code generation template to enforce accent/series separation at the checklist level and switch the LED pulse pattern from requestAnimationFrame to setInterval at 30fps.

## What Was Built

Pushed the ACC-01/ACC-02 accent-as-highlight model down to the code generation layer: the vp-viz SKILL.md pre-code checklist now has two explicit items that remind Claude to restrict t.accent to hover/glow/threshold roles and use getSeriesColor for multi-series data fills. The accentIntensity gi calculation no longer clamps at 1.0 (ACC-03: values above 100 produce extreme glow). The LED pulse animation pattern was migrated from rAF to setInterval at 30fps (ACC-05: reduces CPU load on multi-viz dashboards).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update vp-viz SKILL.md pre-code checklist and accentIntensity template | 30e65fc | plugins/splunk-viz-packs/skills/vp-viz/SKILL.md |
| 2 | Switch LED pulse from rAF to setInterval in animation-recipes.md | 77b7562 | plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md |

## Changes Detail

### Task 1: vp-viz SKILL.md (pre-code checklist + gi formula)

Added two new checklist items after the hexFromSplunk item and before the pure ES5 item:

1. **Accent role item:** `t.accent used ONLY for hover highlight, glow shadowColor, selection ring, threshold breach, focus indicator. Never as ctx.fillStyle for data bars, arcs, or area fills. See DPR-03b.`
2. **Series data fills item:** `multi-series fills use theme.getSeriesColor(i, t) from t.series[0]-[4]. Single-series vizs may use t.accent as the primary fill (KPI hero value, single gauge arc).`

Replaced the gi formula:
- Before: `gi = gi < 0 ? 0 : gi > 1 ? 1 : gi;` (with D-05 comment)
- After: `gi = gi < 0 ? 0 : gi;  // floor at 0, no ceiling` (with ACC-03 comment)
- Comment updated to: `ACC-03: accentIntensity /100 uncapped multiplier -- 0=off, 0.5=default, 1.0=full, >1.0=extreme`

File stayed at 478 lines (under 500 limit).

### Task 2: animation-recipes.md (LED pulse setInterval migration)

**LED pulse section changes (ANI-02):**
- `initialize()`: Added `this._pulseTimer = null` alongside existing `this._pulsing = false`
- `_startPulse()`: Replaced rAF loop with `setInterval(fn, 33)` using `Date.now()` for elapsed time; added `_pulseTimer` guard instead of `_pulsing` guard
- `_stopPulse()`: Added `clearInterval(this._pulseTimer); this._pulseTimer = null` after `this._pulseBlur = 0`
- `destroy()` comment: Added `clearInterval(this._pulseTimer); this._pulseTimer = null`

**Timer lifecycle section:** Updated to explain ACC-05 rationale — rAF at 60fps too CPU-intensive for dashboards with 5+ animated vizs.

**Motion timing constants section:** Updated rule from "requestAnimationFrame over setInterval for 60fps" to "requestAnimationFrame for one-shot entrance animations. setInterval at 30fps (~33ms) for continuous loops."

**One-shot animations unchanged:** ANI-01 (rAF entrance), ANI-03 (hover easing), ANI-04 (staggered entrance) — all verified still use requestAnimationFrame.

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| DPR-03b occurrences in SKILL.md | >=1 | 1 | PASS |
| getSeriesColor occurrences in SKILL.md | >=1 | 1 | PASS |
| gi uncapped (no `gi > 1` clamp) | true | true | PASS |
| setInterval count in animation-recipes.md | >=5 | 5 | PASS |
| requestAnimationFrame count in animation-recipes.md | >=4 | 10 | PASS |
| SKILL.md line count | <500 | 478 | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are in developer-authored checklist and reference files. No data flows, UI rendering, or runtime behavior stubs introduced.

## Threat Flags

None — T-13-03 (setInterval timer cleanup) was explicitly mitigated: `_pulseTimer` is cleared in both `_stopPulse()` and `destroy()`, and the guard `if (this._pulseTimer) { return; }` prevents interval stacking.

## Self-Check: PASSED

- `30e65fc` exists: confirmed
- `77b7562` exists: confirmed
- DPR-03b in SKILL.md: 1 occurrence (PASS)
- getSeriesColor in SKILL.md: 1 occurrence (PASS)
- gi > 1 clamp removed: confirmed (grep returns nothing)
- setInterval in animation-recipes.md: 5 occurrences (PASS)
- requestAnimationFrame in animation-recipes.md: 10 occurrences (PASS, entrance patterns intact)
- SKILL.md line count: 478 (under 500, PASS)
