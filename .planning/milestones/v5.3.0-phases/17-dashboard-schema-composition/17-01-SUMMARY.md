---
phase: 17-dashboard-schema-composition
plan: "01"
subsystem: validate_dash
tags: [validation, dashboard-schema, ds2, ds3, ds4, quality-gates]
dependency_graph:
  requires: []
  provides: [DS2-tab-schema-check, DS3-bg-gradient-check, DS4-title-panel-check]
  affects: [validate_viz.sh Phase 2 dashboard linting]
tech_stack:
  added: []
  patterns: [ES5-CJS, emitFail-violations++, hasTitleAtTop helper]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js
decisions:
  - DS3 checks specifically for bg_gradient in viz ID or options.src (not any splunk.image)
  - DS4 uses hasTitleAtTop() helper to support both simple and tabbed layouts
  - Legacy real-file tests updated to assert exit 1 with expected DS3/DS4 violations
  - Existing fixtures updated to include bg_gradient + markdown so B9/B10/DS1 tests remain isolated
metrics:
  duration_minutes: 15
  completed: "2026-05-18T20:38:09Z"
  tasks: 2
  files_modified: 2
---

# Phase 17 Plan 01: Dashboard Schema Composition Validators Summary

DS2/DS3/DS4 FAIL checks added to validate_dash.js with 10 new tests covering all pass/fail paths.

## What Was Built

Three new validation checks in `validate_dash.js` that enforce dashboard schema composition rules:

- **DS2** (tab schema correctness): Catches `layoutDefinitions` as array, `tabBarPosition` key in `tabs.options`, and bare string items in `tabs.items`
- **DS3** (background image): Enforces presence of a `splunk.image` viz whose ID or `options.src` contains `"bg_gradient"`
- **DS4** (title panel): Requires a `splunk.markdown` viz positioned at `y <= 200` in any structure array (simple or tabbed layouts)

All checks use pure ES5 CJS style. Every `emitFail()` call is immediately followed by `violations++`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: DS2/DS3/DS4 checks | e89a719 | feat(17-01): add DS2/DS3/DS4 checks to validate_dash.js |
| Task 2: DS2/DS3/DS4 tests | e1b62b6 | test(17-01): add DS2/DS3/DS4 tests to test_validate_dash.js |

## Verification

All 66 tests pass (up from 46):

```
=== Results: 66 passed, 0 failed ===
```

Grep check result: 15 matches for DS2/DS3/DS4 in validate_dash.js (excluding comments).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing test fixtures lacked bg_gradient/markdown**
- **Found during:** Task 2
- **Issue:** Several existing XML fixtures (XML_B10_BUILTIN, XML_B10_INPUT, XML_DS_MISSING, XML_DS_OK) and JSON mode fixtures were missing `splunk.image` with bg_gradient and `splunk.markdown`, causing them to fail DS3/DS4 and break their intended assertions.
- **Fix:** Added bg_gradient image and markdown title (at y=10) to each fixture that needed to remain "clean" for its original B9/B10/DS1 tests.
- **Files modified:** test_validate_dash.js
- **Commit:** e1b62b6

**2. [Rule 1 - Bug] Real test file test28 no longer has B10 violations**
- **Found during:** Task 2 — test28's assertion "reports FAIL B10" failed because test28 option keys are now properly namespaced (cloudflare_noc.cf_*.key format)
- **Issue:** The original test was written against an older version of the file; test28 has since been fixed.
- **Fix:** Updated test28 assertions to reflect current state: exits 1 (DS3/DS4 violations), no FAIL B10, confirms FAIL DS3 present.
- **Files modified:** test_validate_dash.js
- **Commit:** e1b62b6

**3. [Rule 1 - Bug] Real test file test25 expected exit 0 but now exits 1**
- **Found during:** Task 2 — test25 lacks bg_gradient and splunk.markdown, so DS3/DS4 correctly fire.
- **Fix:** Updated test25 assertion to expect exit 1 (legacy file behavior), while still asserting no FAIL B9/B10/DS1 (its original clean assertions).
- **Files modified:** test_validate_dash.js
- **Commit:** e1b62b6

## Known Stubs

None. Both files are fully implemented with no placeholder patterns.

## Threat Flags

None. No new network endpoints or trust boundaries introduced. validate_dash.js is a local dev-time tool.

## Self-Check: PASSED

- validate_dash.js exists and contains DS2/DS3/DS4: confirmed (15 grep matches)
- test_validate_dash.js exists and passes: confirmed (66/66 tests)
- Commits e89a719 and e1b62b6 exist in git log: confirmed
- No unexpected file deletions in either commit
