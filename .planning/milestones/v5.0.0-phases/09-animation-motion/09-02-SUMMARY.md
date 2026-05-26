---
phase: 09-animation-motion
plan: "02"
subsystem: vp-viz references
tags: [animation, formatter, blueprints, documentation]
dependency_graph:
  requires: []
  provides: [animation-formatter-template, per-viz-animation-settings]
  affects: [vp-viz/references/formatter-patterns.md, vp-viz/references/viz-blueprints.md]
tech_stack:
  added: []
  patterns: [formatter-animation-section, animation-opt-read-pattern, per-type-flashcritical]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
decisions:
  - "flashCritical added to 6 status-bearing types: Ring Gauge, Status Chip, Live Ticker, Heat Grid, Needle Gauge, Status Matrix — matches D-04 scope"
  - "intro note in viz-blueprints.md explicitly documents that flashCritical CAN be added to any type based on brand personality (Claude has discretion)"
  - "animationSpeed default is normal (not fast) — conservative default prevents jarring first impressions"
metrics:
  duration: "~5 min"
  completed: "2026-05-16"
  tasks_completed: 2
  files_modified: 2
---

# Phase 9 Plan 02: Animation Formatter Controls and Blueprint Settings Summary

## One-liner

Animation formatter section (showEntrance, flashCritical, showHoverEffect, animationSpeed) added to formatter-patterns.md, and per-type animation settings appended to all 16 viz blueprints.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Animation section to formatter-patterns.md | 79b672b | formatter-patterns.md (+70 lines) |
| 2 | Add animation settings to all viz types in viz-blueprints.md | fef67dc | viz-blueprints.md (+27 lines, 16 Settings lines updated) |

## What Was Built

### formatter-patterns.md — New Animation Section (5th section)

Added after the Effects section with exactly 4 mandatory controls:

- `showEntrance` — radio toggle, default `"true"` (D-02: wow-factor on by default)
- `flashCritical` — radio toggle, default `"false"` (D-06: opt-in only, prevents alarm fatigue)
- `showHoverEffect` — radio toggle, default `"true"` (D-10: functional feedback)
- `animationSpeed` — 3-option radio (slow/normal/fast), default `"normal"` (D-13: three-tier multiplier)

Plus an optional 5th control (`reanimateOnRefresh`, default `"false"`) documented for real-time brand briefs.

Includes a complete `Animation opt() read pattern` code block showing the JS side: all 4 `opt()` calls, `speedMult` ternary mapping, and `prefers-reduced-motion` override logic (D-03). This ensures D08 bidirectional wiring check passes for all 4 controls.

All controls use `{{VIZ_NAMESPACE}}.controlName` naming and `value=` (not `default=`).

### viz-blueprints.md — Animation Settings on All 16 Types

Added introductory "Animation settings" note near the top explaining all 4 controls, default rationale, and that `flashCritical` can be added to any type at Claude's discretion.

Updated all 16 Settings lines:
- **All 16 types** received: `showEntrance`, `showHoverEffect`, `animationSpeed`
- **6 status-bearing types** additionally received: `flashCritical` — Ring Gauge, Status Chip/Badge, Live Ticker, Heat Grid/Matrix, Needle Gauge, Status Matrix/Health Grid

## Verification Results

All acceptance criteria passed:

```
formatter-patterns.md:
  Animation section:         1 (PASS)
  showEntrance default true: 1 (PASS)
  flashCritical default false: 1 (PASS)
  showHoverEffect default true: 1 (PASS)
  animationSpeed default normal: 1 (PASS)
  VIZ_NAMESPACE count: 27 (PASS, expect >=8)
  opt() pattern: 6 (PASS, expect >=4)
  reanimateOnRefresh: 1 (PASS)
  Line 208 Color and style: unchanged (PASS)

viz-blueprints.md:
  showEntrance count:    17 (PASS, 16 per-type + 1 in intro)
  showHoverEffect count: 17 (PASS)
  animationSpeed count:  17 (PASS)
  flashCritical count:    8 (PASS, expect >=6)
  KPI showEntrance intact: 1 (PASS)
  Animation settings note: 1 (PASS)
  Leaderboard maxRows.*scoreDigits.*rankField: 1 (PASS)
```

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| flashCritical on 6 status-bearing types | Matches 09-CONTEXT.md D-04 list (Ring Gauge, Status Chip, Live Ticker, Heat Grid, Needle Gauge, Status Matrix) |
| Explicit note that flashCritical is universally available | Claude has discretion per D-04; the note prevents confusion when adding to non-status vizs |
| opt() pattern includes prefers-reduced-motion | D-03 requirement — kills entrance and pulse, keeps hover (functional not decorative) |
| reanimateOnRefresh documented as optional only | D-01: default off, only surfaces when brand brief mentions real-time data |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both files are reference documentation, not UI components. No data source wiring required.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan modifies documentation-only reference files. No threat flags.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — exists, verified
- [x] `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — exists, verified
- [x] Commit 79b672b — exists in git log
- [x] Commit fef67dc — exists in git log
