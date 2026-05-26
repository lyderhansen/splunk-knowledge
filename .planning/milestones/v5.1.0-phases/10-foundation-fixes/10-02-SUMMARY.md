---
phase: 10-foundation-fixes
plan: "02"
subsystem: splunk-viz-packs
tags: [animation, edge-cases, entrance-animation, led-pulse, color-picker, hover]
dependency_graph:
  requires: []
  provides:
    - "animation-recipes.md entrance-off path fix"
    - "flashCritical LED pulse 8-24px range"
    - "drawPulsingIndicator solid inner fill"
    - "ECR-06 hexFromSplunk rule"
    - "ECR-07 showHoverEffect early-exit rule"
  affects:
    - "All generated visualization_source.js that use entrance animation"
    - "All generated visualization_source.js that use flashCritical LED pulse"
    - "All generated visualization_source.js with color picker controls"
    - "All generated visualization_source.js with hover highlight"
tech_stack:
  added: []
  patterns:
    - "Explicit entrance-off path: _entranceDone=true AND _entranceProgress=1"
    - "Widened flashCritical blur: 8-24px range (was 4-12px)"
    - "drawPulsingIndicator with innerAlpha solid fill behind shadow glow"
    - "hexFromSplunk on all color picker opt() reads"
    - "showHoverEffect instance property stored in updateView for event handler access"
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md
decisions:
  - "innerAlpha pulsing formula: 0.15 + 0.15 * Math.sin(phase * PI * 2) — range 0.15-0.30, synchronised with shadow pulse"
  - "Inner fill radius r * 1.8 — slightly larger than LED dot, creates visible halo without dominating"
  - "ECR-06 fallback for color pickers is empty string to opt(), with theme token as hexFromSplunk fallback — avoids hardcoded hex"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 2
---

# Phase 10 Plan 02: Animation and Edge Case Fixes Summary

**One-liner:** Fixed entrance-animation off-path (gauge stuck at zero) and flashCritical LED pulse visibility; added hexFromSplunk color picker rule and showHoverEffect early-exit pattern.

## What Was Done

### Task 1: animation-recipes.md — Three Targeted Fixes

**Fix 1 — Entrance-off path (FIX-02, D-03/D-04):**

The `rAF entrance pattern` section previously had no explicit handling for `showEntrance=false`.
The `_entranceProgress` variable was initialized to 0 and only driven to 1 by the rAF loop.
When `showEntrance=false`, the rAF never started — gauge arcs and bar heights (which multiply
by `_entranceProgress`) rendered at 0 forever.

Added an explicit `if (!showEntrance)` block that sets both `_entranceDone = true` and
`_entranceProgress = 1` immediately in `updateView`. The `prefersReducedMotion()` path was
also updated to set `_entranceProgress = 1` alongside `_entranceDone = true`.

**Fix 2 — flashCritical blur range (FIX-03, D-05):**

The LED pulse `shadowBlur` formula `4 + 8 * sin()` produced a range of 4-12px. On larger
panels and on light theme this oscillation was barely noticeable. Changed to
`8 + 16 * sin()` — range is now 8-24px, giving 2x the oscillation amplitude.
Cadence remains 700ms per D-07.

**Fix 3 — drawPulsingIndicator solid inner fill (FIX-03, D-06):**

Shadow-only pulse is invisible when the canvas rendering engine flattens shadows (common
in Splunk's Chromium version at small panel sizes). Added an optional `innerAlpha` parameter
that draws a larger filled circle (`r * 1.8`) behind the LED dot using `theme.withAlpha`.
The inner fill oscillates in sync with the shadow via the same `phase` variable.
Function signature remains pure ES5 with optional parameter handled by `if (innerAlpha > 0)`.

### Task 2: edge-cases.md — Two New ECR Patterns

**ECR-06: hexFromSplunk on All Color Picker Reads (FIX-04):**

Documented the B22 color picker integer delivery issue. Splunk delivers `<splunk-color-picker>`
values as decimal integers (`30646`, not `#0077B6`). Using the raw value as `ctx.fillStyle`
renders black. ECR-06 establishes the canonical pattern: `opt()` with empty string default,
`hexFromSplunk()` wrapping with a theme token as fallback. Applies to all color picker types.

**ECR-07: showHoverEffect Early-Exit in _onMouseMove (FIX-05):**

Documented the MP-03 performance issue. When `showHoverEffect=false`, the existing
`_startHoverTransition` check stops the animation but does not prevent `_onMouseMove` from
firing hit-testing and potentially `invalidateUpdateView`. ECR-07 establishes the canonical
early-exit: store `_showHoverEffect` as an instance property in `updateView` (event handlers
cannot read config), early-return in `_onMouseMove` before any processing.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — animation-recipes.md entrance-off + flashCritical | 6365d40 | animation-recipes.md |
| 2 — ECR-06 + ECR-07 in edge-cases.md | 79218e4 | edge-cases.md |

## Verification Results

All acceptance criteria passed:

- `_entranceProgress = 1` count in animation-recipes.md: **3** (entrance-off + prefersReducedMotion + entrance-off block body)
- `!showEntrance` count: **1**
- `8 + 16` blur formula present: **yes**
- Old `4 + 8` formula absent: **confirmed**
- `innerAlpha` count: **6**
- `r * 1.8` inner fill radius: **1**
- `ECR-06` present in edge-cases.md: **yes**
- `ECR-07` present in edge-cases.md: **yes**
- `hexFromSplunk` count in edge-cases.md: **4+**
- `_showHoverEffect` count in edge-cases.md: **2**
- No `const`/`let` in either file: **confirmed**
- `edge-cases.md` header unchanged: **confirmed**

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.
Both files are reference documentation only.

Threat mitigations documented as required:
- T-10-03 (color picker integer tampering): mitigated by ECR-06 documenting hexFromSplunk wrapping
- T-10-04 (mouse event flood DoS): mitigated by ECR-07 documenting showHoverEffect early-exit

## Known Stubs

None — these are reference documentation files, not generated code.

## Self-Check: PASSED

Files exist at worktree paths:
- plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
- plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md

Commits exist:
- 6365d40 — feat(10-02): fix entrance-off path and flashCritical pulse in animation-recipes.md
- 79218e4 — feat(10-02): add ECR-06 hexFromSplunk and ECR-07 showHoverEffect patterns to edge-cases.md
