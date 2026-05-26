---
phase: 44-chunked-code-emission-in-cv-create
plan: 01
subsystem: splunk-custom-viz
tags: [splunk-custom-viz, cv-create, boilerplate, sentinels, es5]
dependency_graph:
  requires: []
  provides:
    - "Four literal sentinel block comments inside boilerplate_emit.js render-function bodies (CV-RENDER-DARK-BEGIN/END, CV-RENDER-LIGHT-BEGIN/END)"
  affects:
    - "plugins/splunk-custom-viz/scripts/boilerplate_emit.js"
tech_stack:
  added: []
  patterns:
    - "Grep-stable block-comment sentinels as deterministic Edit anchors"
key_files:
  created:
    - .planning/phases/44-chunked-code-emission-in-cv-create/44-01-SUMMARY.md
  modified:
    - plugins/splunk-custom-viz/scripts/boilerplate_emit.js
decisions:
  - "Sentinels are block comments (/* ... */) per D-02 — line comments (// ...) would be ambiguous with the existing TODO line and would not be safely strippable by a future cleanup pass"
  - "Sentinels sit BELOW the mandatory `t = this._resolveTheme(t, opt);` line so the cv-create Step 3b Edit's old_string never includes Rule 7, eliminating accidental removal"
metrics:
  duration: "~3 minutes"
  completed: 2026-05-26
requirements: [CHUNK-02]
---

# Phase 44 Plan 01: Chunked Code Emission Sentinels Summary

Added four literal sentinel block comments inside the `boilerplate_emit.js` template so cv-create's chunked per-viz emission (Plan 02) has deterministic Edit anchors around each render-function body.

## What changed

`plugins/splunk-custom-viz/scripts/boilerplate_emit.js` — two string-template fragments updated to insert `/* CV-RENDER-DARK-BEGIN */` / `/* CV-RENDER-DARK-END */` around the `_renderDark` TODO body and `/* CV-RENDER-LIGHT-BEGIN */` / `/* CV-RENDER-LIGHT-END */` around the `_renderLight` TODO body. Pure ES5 string-concat change; no new JS constructs introduced.

## Reproduced excerpt from a sample invocation

`node plugins/splunk-custom-viz/scripts/boilerplate_emit.js test_viz test_app.test_viz` now emits:

```javascript
    _renderDark: function(ctx, data, t, w, h, opt) {
        t = this._resolveTheme(t, opt);  // ← MUST be first line (Rule 7)
        /* CV-RENDER-DARK-BEGIN */
        // TODO: implement per visual_reference_html [data-theme="dark"]
        /* CV-RENDER-DARK-END */
    },
    ...
    _renderLight: function(ctx, data, t, w, h, opt) {
        t = this._resolveTheme(t, opt);  // ← MUST be first line (Rule 7)
        /* CV-RENDER-LIGHT-BEGIN */
        // TODO: implement per visual_reference_html [data-theme="light"]
        /* CV-RENDER-LIGHT-END */
    },
```

All four sentinels are visible in the documented positions and each pair encloses only the existing TODO comment (the D-04 baseline "empty" state).

## Verification

The plan's embedded automated verification command was run from the repo root:

```bash
node plugins/splunk-custom-viz/scripts/boilerplate_emit.js test_viz test_app.test_viz \
  > /tmp/cv-44-01-out.js 2>&1 \
  && grep -q '/\* CV-RENDER-DARK-BEGIN \*/' /tmp/cv-44-01-out.js \
  && grep -q '/\* CV-RENDER-DARK-END \*/' /tmp/cv-44-01-out.js \
  && grep -q '/\* CV-RENDER-LIGHT-BEGIN \*/' /tmp/cv-44-01-out.js \
  && grep -q '/\* CV-RENDER-LIGHT-END \*/' /tmp/cv-44-01-out.js \
  && awk '/CV-RENDER-DARK-BEGIN/,/CV-RENDER-DARK-END/' /tmp/cv-44-01-out.js | sed '1d;$d' \
       | grep -q 'TODO: implement per visual_reference_html \[data-theme="dark"\]' \
  && awk '/CV-RENDER-LIGHT-BEGIN/,/CV-RENDER-LIGHT-END/' /tmp/cv-44-01-out.js | sed '1d;$d' \
       | grep -q 'TODO: implement per visual_reference_html \[data-theme="light"\]' \
  && ! node plugins/splunk-custom-viz/scripts/boilerplate_emit.js 2>/dev/null \
  && ! node plugins/splunk-custom-viz/scripts/boilerplate_emit.js "bad name" ns 2>/dev/null \
  && echo "ALL_PASS"
```

Output: **`ALL_PASS`**.

Acceptance-criteria spot checks also confirmed:
- `grep -c` returns exactly `1` for each of the four sentinel strings
- Rule 7 ordering: the `_resolveTheme(t, opt)` line precedes the `CV-RENDER-DARK-BEGIN` sentinel (`awk` predicate returns `1`); same for the light path
- Args-validation guards still trigger: zero-arg invocation exits non-zero with the usage message; whitespace-in-viz_name invocation exits non-zero via the regex guard

## Preservation guarantees

- `t = this._resolveTheme(t, opt);  // ← MUST be first line (Rule 7)` is **outside** each begin/end sentinel pair — a future cv-create Step 3b body Edit physically cannot drop this line
- Existing pre-template guards (`args.length < 2`, `/^[a-zA-Z0-9_-]+$/` regex) are unchanged
- Existing CREATIVE PORT comment block above `_renderDark` is intact
- All helpers (`safeStr`, `safeNum`, `hexFromSplunk`, `getOption`, `detectTheme`) and module-export functions (`initialize`, `formatData`, `getInitialDataParams`, `updateView`, `_resolveTheme`, `_onMouseMove`, `_onClick`, `reflow`, `destroy`) are unchanged
- Output is still pure ES5 — sentinels are `/* ... */` block comments, no template literals, arrow functions, `const`, or `let` were introduced

## Deviations from Plan

None — plan executed exactly as written.

## Consumer pointer

Plan 02 of this phase (`44-02-PLAN.md`, rewrite of cv-create chunked-emission workflow) will reference the four literal sentinel strings as the deterministic `old_string` anchors for its per-viz four-tool-call sequence (D-01). The begin/end pair surrounds only the placeholder TODO body, so a single Edit can swap `BEGIN + TODO + END` → `BEGIN + filled body + END` without disturbing surrounding code, the Rule 7 line, or sibling functions.

## Self-Check: PASSED

- File modified: `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` — FOUND
- Verification command: `ALL_PASS` returned
- Commit `a150cd96` exists on `main` and contains the boilerplate_emit.js change
