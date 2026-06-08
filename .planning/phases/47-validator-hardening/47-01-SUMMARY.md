---
phase: 47-validator-hardening
plan: 01
subsystem: splunk-custom-viz
tags: [validator, splunk-custom-viz, bash, grep, harvest, k1b, k5, k6, k7]
requires:
  - tests/test51_cucm/HANDOFF.md (Correction 15 source)
  - tests/test52_asus_rog/HANDOFF.md (Corrections 23, 24, 26 source)
  - plugins/splunk-custom-viz/scripts/validate.sh (target)
  - plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md (target)
  - plugins/splunk-custom-viz/.claude-plugin/plugin.json (target)
provides:
  - K1b/K5/K6/K7 validator checks (bash functions in validate.sh)
  - KNOWN-CORRECTIONS.md entries #15, #23, #24, #26 with HANDOFF citations
  - splunk-custom-viz plugin v6.0.9
affects:
  - plugins/splunk-custom-viz/scripts/validate.sh
  - plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md
  - plugins/splunk-custom-viz/.claude-plugin/plugin.json
tech-stack:
  added: []
  patterns:
    - variable-name-tracking-reach-heuristic
    - newline-IFS-iteration-for-multi-word-tokens
    - awk-stanza-scoped-key-extraction
    - bsd-grep-extended-regex-only
key-files:
  created: []
  modified:
    - plugins/splunk-custom-viz/scripts/validate.sh (+224 lines)
    - plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md (+94 lines)
    - plugins/splunk-custom-viz/.claude-plugin/plugin.json (version 6.0.8 -> 6.0.9)
decisions:
  - K1b reach heuristic uses variable-name tracking (not 30-line window) — handles cross-function reach in mos_health_gauge
  - K1b secondary reach signal: LHS appears in ANY non-assignment line (count > 1) — covers helper-function reach like drawBand
  - K5 exemption is *Field SUFFIX (not field* prefix) — empirically verified against test51/52
  - K6 scope is */src/visualization_source.js only (not shared/theme.js) — Pitfall #3
  - K7 exempt prefixes are splunk/ds/input/drilldown — drilldown was added beyond the plan-locked three after discovering drilldown.setToken in test52 ops_view.xml
metrics:
  duration: 5m
  completed: 2026-06-08
---

# Phase 47 Plan 01: Validator Hardening (K1b/K5/K6/K7) Summary

Four new grep-based validator checks (K1b, K5, K6, K7) added to `plugins/splunk-custom-viz/scripts/validate.sh` to catch the dead-picker, dead-text-input, unembedded-font, and cross-app-type-mismatch failures that shipped in test51_cucm and test52_asus_rog under v6.0.8. KNOWN-CORRECTIONS.md gains entries #15/#23/#24/#26 with HANDOFF citations. Plugin bumped to 6.0.9.

## What Was Built

### Task 1: check_k1b / check_k5 / check_k6 / check_k7 in validate.sh — commit `9d2075bd`

Four self-contained bash functions inserted between the existing K3 block (ended line 224) and the design-fidelity check (line 225 in pre-edit numbering):

| Check | Catches | Heuristic | Exemptions |
|---|---|---|---|
| K1b | Color picker opt()-read but value never reaches ctx.* | Variable-name tracking: LHS of `opt(...)` assignment must appear on a `ctx.` line OR in any non-assignment line elsewhere in the file | None (inline `opt()` consumed directly is allowed via "no LHS captured -> pass") |
| K5 | Text/number input declared in formatter but never opt()-read OR opt()-read but never reaches ctx.* | Two-stage: opt() called check, then same variable-name tracking as K1b | `*Field` suffix (data-field-name overrides) |
| K6 | Font declared in `ctx.font` string but no matching `@font-face` block in same viz's visualization.css | Family extraction via `grep -oE '"[A-Za-z][A-Za-z0-9 _-]*"'`; CSS intersect via `@font-face` regex | `sans-serif`, `monospace`, `serif`, `system-ui`, `Inter`, `Arial`, `Helvetica` |
| K7 | Dashboard XML viz type prefix doesn't match parent `[package] id` | `awk` stanza-scoped `id` extraction from app.conf; `grep -oE` on `"type":` strings in views/*.xml | `splunk`, `ds`, `input`, `drilldown` (Splunk built-ins) |

**Files modified:** `plugins/splunk-custom-viz/scripts/validate.sh` — 324 -> 548 lines (+224).

### Task 2: KNOWN-CORRECTIONS.md entries + plugin.json version bump — commit `7c69fa44`

Four new entries inserted after Correction 14 and before the `## Process note` section:

- **#15** (K5 / test51): Every formatter text-input must be opt()-read AND reach ctx.*. Cites `tests/test51_cucm/HANDOFF.md`.
- **#23** (K1b / test52): Color picker opt() value must reach ctx.*. Cites `tests/test52_asus_rog/HANDOFF.md`. Documents the `_hoverTint` underscore-alias bug-bait pattern.
- **#24** (K7 / test52): Dashboard XML viz type prefix must match parent `[package] id`. Cites `tests/test52_asus_rog/HANDOFF.md`. Documents built-in prefix exemptions.
- **#26** (K6 / test52): Declared brand font must have matching `@font-face` block. Cites `tests/test52_asus_rog/HANDOFF.md`. Documents Phase 48 hand-off to embed_fonts.sh.

Plugin version `6.0.8` -> `6.0.9`. No other plugin.json edits.

**Files modified:** `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` (+94 lines), `plugins/splunk-custom-viz/.claude-plugin/plugin.json` (1-line version bump).

## Smoke Gate Results (9 verification checks from PLAN `<verification>`)

| # | Gate | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | K1b positive (test52 rog_telemetry_viz) | At least one FAIL K1b emitted | 8 K1b FAILs across rog_clock_dual_dial / rog_fan_curve / rog_frametime_pulse / rog_session_timeline / rog_thermal_radar (incl. the canonical `rog_session_timeline accentColor` violator) | PASS |
| 2 | K1b A1 gate (mos_health_gauge MUST NOT fail) | Empty output | Empty — no FAIL K1b on mos_health_gauge. Cross-function reach (`_resolveTheme -> drawBand`) clears via the "LHS appears in any non-assignment line" secondary signal. | PASS |
| 3 | K5 positive (test51 cisco_collab_viz) | At least one FAIL K5 | 8 K5 FAILs naming `accentIntensity` (across all 6 vizs) plus `tollThreshold` and `synthThreshold` (mos_health_gauge). | PASS |
| 4 | K5 *Field exemption (must be empty) | Empty | Empty — no FAIL K5 on `mosField`, `rigField`, `recordsField`. | PASS |
| 5 | K6 positive (test52) | FAIL K6 naming Chakra Petch or JetBrains Mono | 14 K6 FAILs naming "Chakra Petch" and "JetBrains Mono" across 7 vizs. | PASS |
| 6 | K7 clean merge (must be empty) | Empty | Empty — `asus_rog_command_center` has correctly-rewritten prefixes; `splunk`/`ds`/`input`/`drilldown` built-ins exempt. | PASS |
| 7 | KNOWN-CORRECTIONS entries (must be 4) | `grep -cE '^## Correction (15\|23\|24\|26) — '` returns 4 | 4 | PASS |
| 8 | Version bumped | `"version": "6.0.9"` | `"version": "6.0.9",` present | PASS |
| 9 | K1/K2/K3 comment markers preserved (must be 3) | `grep -cE '^# K(1\|2\|3) —'` returns 3 | 3 | PASS |

**Bonus gate (K7 synthetic positive):** Hand-constructed a synthetic test by copying `captain_brief.xml` and replacing one `"type": "asus_rog_command_center.rog_rig_grid"` with `"type": "wrong_app.rog_rig_grid"`. Ran `validate.sh` against the synthetic dir and confirmed `FAIL K7: synthetic.xml: viz type prefix "wrong_app" does not match parent app id "asus_rog_command_center"`. PASS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Font extraction loop broke on multi-word family names ("Chakra Petch" -> "Chakra" + "Petch")**

- **Found during:** Gate 4 first run produced 4 separate FAILs per viz (`Chakra`, `Petch`, `JetBrains`, `Mono`) instead of the expected 2 (`Chakra Petch`, `JetBrains Mono`).
- **Issue:** The naive `for FAM in $FAMILIES; do` loop word-splits on whitespace; multi-word font families like "Chakra Petch" got tokenized into separate words.
- **Fix:** Replaced word-iteration with newline-IFS iteration (`OLDIFS="$IFS"; IFS=$'\n'; for FAM in $FAMILIES; do ...; done; IFS="$OLDIFS"`). The exempt-list inner loop continues to use whitespace IFS because exempt families are single-word. Empty-token skip added defensively.
- **Files modified:** `plugins/splunk-custom-viz/scripts/validate.sh` (`check_k6` body).
- **Commit:** `9d2075bd` (folded into Task 1 commit).

**2. [Rule 3 - Blocking] K7 exempt-prefix list was incomplete — `drilldown` was missing**

- **Found during:** Pre-implementation inspection of `tests/test52_asus_rog/app_build/asus_rog_command_center/default/data/ui/views/ops_view.xml`, which contains `"type": "drilldown.setToken"`. The plan locked the exempt list to `splunk|ds|input` (per CONTEXT.md Decision and 47-PATTERNS.md Pattern D). Running K7 with only those three would have produced `FAIL K7: ops_view.xml: viz type prefix "drilldown" does not match parent app id "asus_rog_command_center"` on the clean merge, breaking Gate 5/6.
- **Fix:** Added `drilldown` to the exempt list (`case "$PFX" in splunk|ds|input|drilldown) continue;; esac`).
- **Rationale:** `drilldown` is a Splunk Dashboard Studio built-in type for setToken actions — it is not a custom-app reference. Same category as `splunk.markdown` / `ds.search` / `input.timerange`. The plan's Pitfall #6 documents the principle ("Exempt Splunk built-in types"), and adding `drilldown` to the list extends that principle to a built-in the planner had not catalogued.
- **Files modified:** `plugins/splunk-custom-viz/scripts/validate.sh` (`check_k7` case statement).
- **Commit:** `9d2075bd` (folded into Task 1 commit).

**3. [Rule 1 - Bug] Plan's K1b reach heuristic would have false-positived on mos_health_gauge**

- **Found during:** Pre-implementation trace — `c.good = hexFromSplunk(opt("goodColor", ...))` in `_resolveTheme` is consumed via `drawBand(..., t.good, ...)` (line 180) which never contains `ctx.` on the same line. The plan's primary heuristic `grep -E "ctx\." "$SRC" | grep -qE "[.[:space:]]${LHS}\b"` would have FAILed K1b on `goodColor`, `warnColor`, `alertColor` — violating Gate 2.
- **Fix:** Augmented the heuristic with a SECONDARY signal: if the LHS name appears in ANY non-assignment line (`grep -cE "\b${LHS}\b" > 1`), that counts as "reached" via helper-function indirection. This widens the heuristic per researcher A1's explicit license to "widen variable-tracking rules or relax to 'any opt(K) call + any ctx. reference somewhere = pass'."
- **Verification:** `_hoverTint` in test52 `rog_session_timeline` appears EXACTLY ONCE (the assignment line); count=1 -> still FAIL. `c.good` in mos_health_gauge appears 6+ times across the file; count > 1 -> PASS. Both gates satisfied with a single unified heuristic.
- **Files modified:** `plugins/splunk-custom-viz/scripts/validate.sh` (`check_k1b` and `check_k5` reach loops).
- **Commit:** `9d2075bd`.

### Plan-Lock Adjustments (documented, not auto-fixed)

**Gate 3's K5 expectation lists `showHoverEffect` as an expected positive.** `showHoverEffect` is `splunk-radio-input`, not `splunk-text-input` or `splunk-number-input`. The plan's locked element selector is text+number only ("Element selector: both `splunk-text-input` AND `splunk-number-input` (researcher confirmed both in test51/test52)"). I followed the locked behavior contract — K5 fires on `accentIntensity` / `tollThreshold` / `synthThreshold` (3 of 4 listed) and silently ignores radio-inputs. If radio-input coverage is wanted, that is a clean follow-up plan (`check_k5_radio` or generalize K5's element selector).

## Line Count Delta

| File | Before | After | Delta |
|---|---|---|---|
| `plugins/splunk-custom-viz/scripts/validate.sh` | 324 | 548 | +224 |
| `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` | 463 | 557 | +94 |
| `plugins/splunk-custom-viz/.claude-plugin/plugin.json` | 21 | 21 | 0 (version string only) |

## Commits

- `9d2075bd` — `feat(splunk-custom-viz): add K1b/K5/K6/K7 validator checks (47-01)`
- `7c69fa44` — `docs(splunk-custom-viz): KNOWN-CORRECTIONS #15/#23/#24/#26 + bump to 6.0.9 (47-01)`

## Next Plan

**Plan 47-02 (no-regression sweep, VAL-05)** depends on this plan. It will run the new K1b/K5/K6/K7 checks across every in-repo viz pack via a `tests/validate_sweep.sh` helper and confirm zero new FAILs on packs that previously passed under v6.0.8. Expected outputs that this plan already foreshadows for the sweep to catalogue:

- K1b: at least 9 FAILs across test51 (1) + test52 (8) — known shipped bugs
- K5: at least 8 FAILs in test51 — known shipped bugs
- K6: 14 FAILs in test52 standalone — Phase 48 (FONT-01..03) closes this loop
- K7: 0 FAILs in merged app builds (already-clean merges); 0 FAILs in standalone packs (silent skip on no views/)

## Self-Check: PASSED

- Files exist: `/Users/joehanse/.../plugins/splunk-custom-viz/scripts/validate.sh` (548 lines), `/Users/joehanse/.../plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` (557 lines), `/Users/joehanse/.../plugins/splunk-custom-viz/.claude-plugin/plugin.json` (version 6.0.9).
- Commits in git log: `9d2075bd` and `7c69fa44` both present on `main`.
- All 9 verification checks PASS (see Smoke Gate Results table above).
- VAL-01 (K1b), VAL-02 (K5), VAL-03 (K6), VAL-04 (K7) requirements satisfied.
