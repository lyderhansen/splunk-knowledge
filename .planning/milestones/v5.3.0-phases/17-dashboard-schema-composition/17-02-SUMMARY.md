---
phase: 17-dashboard-schema-composition
plan: "02"
subsystem: splunk-viz-packs/skills/vp-create
tags: [dashboard-schema, depth-layers, background, markdown-title, ds-int-tabs, skill-reference]
dependency_graph:
  requires: []
  provides: [depth-layer-background-pattern, mandatory-title-panel, ds-int-tabs-conditional-load]
  affects: [plugins/splunk-viz-packs/skills/vp-create/references/dashboard-json-template.md, plugins/splunk-viz-packs/skills/vp-create/SKILL.md]
tech_stack:
  added: []
  patterns: [depth-layer-background, mandatory-splunk-markdown-title, conditional-must-load-gate]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-create/references/dashboard-json-template.md
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
decisions:
  - "Use APP_ID/BRAND_NAME as placeholder tokens in JSON examples so Claude substitutes real values at generation time"
  - "Keep viz_bg_gradient shared across tab layouts (referenced in each layoutDefinition structure) rather than duplicating viz entries per tab"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-18T20:35:37Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
requirements: [DQ-02, DQ-03, DQ-04]
---

# Phase 17 Plan 02: Dashboard Schema Composition — Depth-Layer Background + Title Panel Summary

Depth-layer background pattern (splunk.image bg_gradient + splunk.rectangle overlay) and mandatory splunk.markdown title panel added to dashboard-json-template.md JSON examples; conditional ds-int-tabs MUST-LOAD gate added to vp-create SKILL.md step 3c.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add depth-layer background pattern and splunk.markdown title to dashboard-json-template.md | 9bc1ba3 | plugins/splunk-viz-packs/skills/vp-create/references/dashboard-json-template.md |
| 2 | Add ds-int-tabs conditional MUST-LOAD and title checklist item to vp-create SKILL.md | 48412ec | plugins/splunk-viz-packs/skills/vp-create/SKILL.md |

## What Was Built

**dashboard-json-template.md** now shows the two-layer depth background pattern in both the simple (4-6 vizs) and tabbed (7+ vizs) layout JSON examples:
- `viz_bg_gradient` (`splunk.image`) at x:0 y:0 w:1920 h:1080 using `{{APP_ID}}/images/bg_gradient.png`
- `viz_depth_overlay` (`splunk.rectangle`) at same canvas size with `rgba(0,0,0,0.35)` fill
- `viz_title` (`splunk.markdown`) at x:20 y:20 w:1000 h:60 in all layouts
- Structure items order section updated to document the two-layer pattern explicitly
- Three new WRONG entries: missing bg_gradient (DS3 FAIL), no depth overlay (DQ-02 violation), missing title panel at y<=200 (DS4 FAIL)

**vp-create SKILL.md** now has:
- Step 3c MUST-LOAD item 3: conditional ds-int-tabs load when pack has 7+ vizs OR user requested tabs
- Packaging checklist item: "Dashboard has branded title panel (splunk.markdown viz_title at y <= 200 in structure)"
- Packaging checklist item: "ds-int-tabs loaded before dashboard JSON if pack has 7+ vizs or tabs requested"

## Verification Results

```
grep -c 'bg_gradient|depth_overlay|splunk.markdown' dashboard-json-template.md → 19 (expected 6+) PASS
grep -c 'ds-int-tabs' vp-create SKILL.md → 2 (expected 2+) PASS
wc -l vp-create SKILL.md → 195 lines (expected <= 500) PASS
wc -l dashboard-json-template.md → 181 lines (expected <= 200) PASS
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The JSON examples use `{{APP_ID}}` and `{{BRAND_NAME}}` placeholder tokens which are the intended pattern for reference templates — Claude substitutes real values at generation time.

## Threat Flags

None. Both files are internal skill references with no network endpoints or trust boundary changes.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-create/references/dashboard-json-template.md` exists and modified
- [x] `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` exists and modified
- [x] Commit 9bc1ba3 exists (Task 1)
- [x] Commit 48412ec exists (Task 2)
- [x] All grep verification counts pass
- [x] Both files under line limits
