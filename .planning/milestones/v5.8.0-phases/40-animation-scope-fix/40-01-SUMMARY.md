---
phase: 40-animation-scope-fix
plan: "01"
subsystem: splunk-viz-packs/skills/vp-recipes
tags: [documentation, animation, refactor, scope-rule]
dependency_graph:
  requires: []
  provides: [animation-scope-rule, corrected-helper-signatures]
  affects: [animation-recipes.md]
tech_stack:
  added: []
  patterns: [WRONG/RIGHT-table, primitive-parameter-passing]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
decisions:
  - "D-02: Pass speedMult/accentColor as direct primitive parameters (not an animOpts object) to keep signatures greppable and minimal"
  - "D-03: WRONG/RIGHT table placed at top of file in a dedicated H2 section, mirroring build-mjs-template.md style"
  - "D-04: LED pulse cadence in AB-02 and ANI-02 now scales by speedMult (700 * speedMult) for uniform speed-setting behavior"
  - "D-05: Cross-file grep confirmed viz-blueprints.md and canvas-recipes.md use name-only references; mood-recipes.md has an independent rAF glow implementation unrelated to the AB-02/ANI-02 LED pulse boilerplate — no edits needed in any cross-reference file"
  - "D-06: No validator changes in this phase — check_design.js and validate_viz.sh untouched"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  files_changed: 1
---

# Phase 40 Plan 01: Animation Scope Fix Summary

Refactored `animation-recipes.md` to eliminate the `opt()`-inside-helper anti-pattern. Added an explicit top-of-file scope rule section and corrected all five animation helper signatures to accept computed primitive values instead of `config`/`ns` closure references.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Insert Animation Helper Scope Rule section | 304cbbd2 | animation-recipes.md (+13 lines) |
| 2 | Refactor AB-01 and AB-02 helper signatures | 7cad8854 | animation-recipes.md (+10/-6 lines) |
| 3 | Refactor ANI-01, ANI-02, ANI-04 signatures; grep cross-files | f630da6f | animation-recipes.md (+10/-8 lines) |

## What Changed

### File: `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md`

**Baseline:** 519 lines. **Final:** 538 lines (+19 net lines).

**New section (Task 1):**
- Inserted `## Animation Helper Scope Rule` H2 at lines 8-19, between the header `---` divider and the existing `## Generic Entrance Boilerplate (AB-01)`
- Contains: one-paragraph `opt()` scope explanation, WRONG/RIGHT markdown table with AF-01/AF-02 findings, closing pointer, `---` divider
- All JS examples in table use ES5 `var` declarations

**AB-01 changes (Task 2):**
- `_startEntrance: function(config, ns)` → `_startEntrance: function(speedMult)`
- Internal `var speedMult = getSpeedMult(config, ns);` line removed from helper body
- `updateView` caller block now computes `speedMult` and passes it: `var speedMult = getSpeedMult(config, ns); this._startEntrance(speedMult);`

**AB-02 changes (Task 2):**
- `_startPulse: function()` → `_startPulse: function(speedMult, accentColor)`
- Cadence: `var cadenceMs = 700;` → `var cadenceMs = 700 * speedMult;` (D-04)
- `updateView` caller: `this._startPulse()` → `var speedMult = ...; var accentColor = opt('accentColor', t.accent); this._startPulse(speedMult, accentColor);`

**ANI-01 changes (Task 3):**
- `_startEntrance: function(config, ns)` → `_startEntrance: function(speedMult)`
- Internal `getSpeedMult` call removed from helper body
- `updateView` caller: `this._startEntrance(config, ns)` → `var speedMult = getSpeedMult(config, ns); this._startEntrance(speedMult);`

**ANI-02 changes (Task 3):**
- `_startPulse: function(cadenceMs)` → `_startPulse: function(speedMult, accentColor)`
- `cadenceMs = cadenceMs || 700;` → `var cadenceMs = 700 * speedMult;` (D-04)
- `updateView` caller: `this._startPulse(700)` → `var speedMult = getSpeedMult(config, ns); this._startPulse(speedMult, accentColor);`

**ANI-04 changes (Task 3):**
- `_startStaggeredEntrance: function(rowCount, config, ns)` → `_startStaggeredEntrance: function(rowCount, speedMult)`
- Internal `var speedMult = getSpeedMult(config, ns);` line removed from helper body
- No separate caller block exists in ANI-04 section (method definition only)

### D-05 Cross-File Grep Results

| File | Grep Target | Result | Action |
|------|-------------|--------|--------|
| `viz-blueprints.md` line 37 | `_startStaggeredEntrance` | Name-only reference: `_startStaggeredEntrance()` — no parameter list | No edit needed |
| `canvas-recipes.md` line 308 | `_startStaggeredEntrance` | Name-only prose reference | No edit needed |
| `mood-recipes.md` lines 285/289 | `_startPulse` | Independent rAF glow ring implementation (`function()` signature, rAF-based, completely different from AB-02/ANI-02 setInterval LED pulse) | No edit needed — different implementation |

## Verification Results

All plan verification commands pass:

```
grep -c '^## Animation Helper Scope Rule$' animation-recipes.md        → 1  (PASS)
grep -cE '_startEntrance: function\(config|...' animation-recipes.md   → 0  (PASS: no old signatures)
grep -c '_startEntrance: function(speedMult)' animation-recipes.md     → 3  (2 actual defs + 1 in WRONG/RIGHT table RIGHT column — correct)
grep -c '_startStaggeredEntrance: function(rowCount, speedMult)' ...   → 1  (PASS)
grep -c '_startPulse: function(speedMult, accentColor)' ...            → 2  (PASS)
grep -c 'cadenceMs.*speedMult' animation-recipes.md                    → 2  (PASS: AB-02 + ANI-02)
wc -l animation-recipes.md                                             → 538 (PASS: within 535-590 range)
```

## Deviations from Plan

None — plan executed exactly as written. Minor notes:

- The `_startEntrance: function(speedMult)` grep returns 3 instead of the expected 2: the third match is the RIGHT column cell of the WRONG/RIGHT table in the new scope rule section. This is intentional (it illustrates the correct pattern) and does not represent a duplicate definition.
- ANI-04 has no `updateView` caller block in the file (the section shows only the method definition). The plan's action to update the caller block was a no-op for ANI-04 — documented here per D-05 note style.
- mood-recipes.md `_startPulse` is an independent implementation, not a copy of the AB-02/ANI-02 boilerplate. No update needed.

## Known Stubs

None — this is a documentation-only phase. No data sources, no UI rendering, no stubs introduced.

## Threat Flags

None — documentation-only edits, no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `animation-recipes.md` exists at correct path: FOUND
- Task 1 commit 304cbbd2: FOUND in git log
- Task 2 commit 7cad8854: FOUND in git log
- Task 3 commit f630da6f: FOUND in git log
- No modifications to STATE.md, ROADMAP.md, check_design.js, validate_viz.sh, or any file other than animation-recipes.md: CONFIRMED
