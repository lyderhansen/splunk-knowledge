---
phase: 24-animation-boilerplate
plan: "01"
subsystem: splunk-viz-packs/skills/vp-recipes
tags: [animation, boilerplate, entrance, led-pulse, es5, canvas-viz]
dependency_graph:
  requires: []
  provides:
    - Generic Entrance Boilerplate (AB-01) in animation-recipes.md
    - Generic LED Pulse Boilerplate (AB-02) in animation-recipes.md
  affects:
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
tech_stack:
  added: []
  patterns:
    - rAF one-shot entrance with opacity fade-in and all required guards
    - setInterval LED pulse oscillation with shadowBlur 4-12px at 700ms cadence
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
decisions:
  - "Use opacity fade-in (ctx.globalAlpha) as the generic entrance default — works for any viz without modification"
  - "setInterval at 33ms (~30fps) for LED pulse — consistent with ACC-05 guidance"
  - "Both sections inserted at top of file (after header, before Timer lifecycle) for high visibility"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-20"
  tasks_completed: 2
  files_modified: 1
---

# Phase 24 Plan 01: Animation Boilerplate — SUMMARY

Two copy-paste-ready ES5 boilerplate sections added to animation-recipes.md: Generic Entrance Boilerplate (opacity fade-in rAF with all required guards) and Generic LED Pulse Boilerplate (setInterval shadowBlur oscillation for status indicators).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Generic Entrance Boilerplate (AB-01) | c0ad2fe | animation-recipes.md |
| 2 | Add Generic LED Pulse Boilerplate (AB-02) | c0ad2fe | animation-recipes.md |

## What Was Built

### Generic Entrance Boilerplate (AB-01)

Added `## Generic Entrance Boilerplate (AB-01)` section to animation-recipes.md with four clearly-labelled placement blocks:

- **In initialize():** `_entranceDone = false`, `_animating = false`, `_entranceProgress = 1`
- **In updateView:** prefersReducedMotion check, showEntrance opt() check (both set `_entranceProgress = 1` for off-path), start condition, and `ctx.globalAlpha = easeOutQuart(this._entranceProgress)` render application
- **_startEntrance method:** Single-loop guard, speedMult via `getSpeedMult()`, 350ms * speedMult duration, rAF step function with early-exit guard, completion: `_entranceDone = true; _animating = false`
- **In destroy():** `this._animating = false`

Override callout explains how to substitute `ctx.globalAlpha` with custom draw paths for gauges/bars/tables.

### Generic LED Pulse Boilerplate (AB-02)

Added `## Generic LED Pulse Boilerplate (AB-02)` section immediately after AB-01, with four clearly-labelled placement blocks:

- **In initialize():** `_pulseInterval = null`, `_pulseBlur = 0`
- **In updateView:** flashCritical opt(), prefersReducedMotion stop, hasCritical status scan loop, _startPulse/_stopPulse branching
- **_startPulse/_stopPulse methods:** Single-loop guard, `base=4 amp=8` shadowBlur range, `cadenceMs=700`, setInterval at 33ms, proper clearInterval in _stopPulse
- **In destroy():** `clearInterval(this._pulseInterval)` with null assignment

Apply callout explains ctx.save()/ctx.restore() discipline and references drawPulsingIndicator() helper.

## Verification Results

1. `grep "Generic Entrance Boilerplate" animation-recipes.md` → 1 match
2. `grep "Generic LED Pulse Boilerplate" animation-recipes.md` → 1 match
3. `grep "AB-01\|AB-02" animation-recipes.md` → 2 matches
4. No ES6 syntax (const/let/=>) in new sections (lines 1-130) → CLEAN
5. Section order: AB-01 (line 8) → AB-02 (line 73) → Timer lifecycle (line 131) → CORRECT

## Deviations from Plan

None - plan executed exactly as written.

Both tasks were implemented in a single edit since they target the same file and were both well-specified. A single commit covers both changes.

## Known Stubs

None — both boilerplates are complete and self-contained with all guards specified.

## Threat Flags

None — reference-only markdown file, no new runtime execution surface.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` exists and contains both sections
- [x] Commit c0ad2fe exists in git log
- [x] No ES6 syntax in new boilerplate sections
- [x] Section order correct (AB-01 before AB-02 before Timer lifecycle)
