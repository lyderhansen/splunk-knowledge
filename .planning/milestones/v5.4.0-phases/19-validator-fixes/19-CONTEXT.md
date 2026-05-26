# Phase 19: Validator Fixes — Context

## Domain Boundary

Fix three validator bugs in validate_dash.js and check_design.js so downstream phases (20, 21) generate code against accurate validation. These validators are the measuring instruments — they must be correct before we measure new output.

## Requirements

- VF-01: DS4 vizId/item mismatch
- VF-02: D11 scan strategy
- VF-03: DS5 wildcard strictness

## Decisions

### D-01: DS4 uses `item.item` with `item.vizId` fallback (VF-01)

Dashboard Studio spec uses `"item"` in structure arrays, not `"vizId"`. The DS4 check (validate_dash.js line 269) must use `item.item` as primary lookup, with `item.vizId` as backwards-compat fallback. Change: `mdIds.indexOf(item.item || item.vizId)`.

Also update DS3 (background check) if it iterates structure items — verify it uses the same pattern.

Update test fixtures to use `"item"` (spec-correct) instead of or alongside `"vizId"`.

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js` line 269
**Test file:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js`

### D-02: D11 uses `lastIndexOf` instead of `indexOf` (VF-02)

The D11 check finds `_onMouseMove` using `indexOf()` which returns the first occurrence — often a string literal or comment, not the method definition. Change to `lastIndexOf('_onMouseMove')`. The method definition in the `extend({})` object is always the last occurrence.

Keep the 1500-char scan window and existing guard regex pattern. One-line fix.

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` line 239
**Test file:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js`

### D-03: DS5 FAILs on missing default, WARNs on non-wildcard (VF-03)

Current DS5: FAIL if token has no `defaults.tokens.default` entry. Keep this.

Add: WARN (not FAIL) if a token default exists but value is not `"*"`. Some tokens legitimately default to specific values (time range tokens default to `-24h@h,now`), so a non-wildcard default is suspicious but not always wrong.

Use `emitWarn` (not `emitFail`) for the non-wildcard case. Add the WARN code as `DS5w` to distinguish from the existing `DS5` FAIL.

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js` after DS5 block
**Test file:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js`

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js` — DS3, DS4, DS5 checks
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — D11 check
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js` — DS test fixtures
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` — D11 test fixtures
- `docs/SplunkCloud-10.4.2604-DashStudio.txt` — Dashboard Studio v2 schema reference
- DataDrivers F1 app formatter patterns — reference for how professional vizs handle structure items

## Deferred Ideas

None — Phase 19 is a focused bug-fix phase.
