---
phase: 43-deep-review
plan: "07"
subsystem: splunk-viz-packs/references
tags: [doc-fix, b-code-tags, theme-rules, animation, formatter, Wave-1]
dependency_graph:
  requires: []
  provides: [B-code-tagged-checklist, D10-template, THM-01-THM-02, Accent-Architecture, Wave1-WARNINGs-resolved]
  affects: [pre-code-checklist, visualization-js-template, formatter-patterns, conf-templates, theme-template, build-mjs-template, package-mjs-template, canvas-recipes, animation-recipes, edge-cases, auto-field-patterns, config-json-template, viz-blueprints]
tech_stack:
  added: []
  patterns: [B-code anchors, THM heading promotion, WRONG/RIGHT framing]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md
    - plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/auto-field-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
decisions:
  - "THM-01 formalized as: light theme is NOT an inversion of dark — design LIGHT token set independently"
  - "THM-02 formalized as: LIGHT.textFaint '#6B7080' meets WCAG AA 3:1 on #F0F2F5 bg (CP-02)"
  - "showGlassPanel removed from Effects prose and code comment; ban note added (Dashboard Studio rectangles handle panel chrome)"
  - "D10 @viz-type annotation added as first line of visualization-js-template code block"
  - "Per-viz Animation notes added to all 16 viz types that lacked them (AB-03 partial closure)"
metrics:
  duration: "~40 minutes"
  completed: "2026-05-25"
  tasks_completed: 4
  tasks_total: 4
  files_modified: 13
---

# Phase 43 Plan 07: Reference Files Gap Closure Summary

**One-liner:** B-code tags backfilled, D10 template annotation added, showGlassPanel banned in prose, THM-01/THM-02 formalized, and all 11 Wave 1 WARNINGs resolved across 13 reference markdown files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | pre-code-checklist.md B-code tag backfill + THM-01/THM-02 | 064e6912 | pre-code-checklist.md |
| 2 | visualization-js-template.md D10 @viz-type + Classic callout | f1730bd5 | visualization-js-template.md |
| 3 | formatter-patterns + conf-templates + theme-template Wave 1 fixes | 70eb8862 | formatter-patterns.md, conf-templates.md, theme-template.md |
| 4 | 8 remaining reference files Wave 1 WARNINGs and NITs | 4e44b718 | build-mjs-template.md, package-mjs-template.md, canvas-recipes.md, animation-recipes.md, edge-cases.md, auto-field-patterns.md, config-json-template.md, viz-blueprints.md |

## BLOCKERs Resolved

### B-1: THM-01 and THM-02 undefined code IDs
- **Fix:** Added formal THM-01 and THM-02 checklist items to pre-code-checklist.md before THM-03
- **THM-01:** "light theme is NOT an inversion of dark — design LIGHT token set independently"
- **THM-02:** "LIGHT.textFaint '#6B7080' meets WCAG AA 3:1 on #F0F2F5 bg — never replace with a lower-contrast value (THM-02/CP-02)"

### B-2: D10 @viz-type missing from visualization-js-template.md
- **Fix:** Added `// @viz-type: {{VIZ_TYPE_PLACEHOLDER}}` as the very first line of the template code block, plus a D10 populator note listing the 10 valid types.

### B-3: B5/B7/B9/B10/B20/B21 not tagged in pre-code-checklist.md
- **Fix:** Appended `(B5)`, `(B7)`, `(B9)`, `(B10)`, `(B20)`, `(B21)` to each corresponding checklist item.

### B-4: conf-templates.md savedsearches.conf Extension API path undocumented
- **Fix:** Added Extension API path note explaining that `display.visualizations.custom.type` is correct for both Classic and Extension API; the distinction is in `visualizations.conf` via `framework_type = studio_visualization`.

### B-5: showGlassPanel in formatter-patterns.md Effects prose
- **Fix:** Removed `showGlassPanel` from the Effects section prose and the full example code comment. Added ban note: "showGlassPanel is BANNED — Dashboard Studio rectangles handle panel chrome."

### B-6: animation-recipes.md AB-02 assumes `t` in scope without showing declaration
- **Fix:** Added `// Required above this block: var t = theme.getTheme(detectTheme()); var ns = getNS(this);` comment immediately before the `var flashCritical` line in AB-02 updateView block.

## WARNINGs Resolved

- **W-1:** THM-03 and THM-04 promoted to `##` headings with WRONG/RIGHT framing in theme-template.md
- **W-2:** "Build Requirements (EF-01/EF-02)" footer added to config-json-template.md
- **W-3:** EF-03 citation added to conf-templates.md visualizations.conf section
- **W-4:** "## Accent Architecture (Phase 23 — CP-01/CP-02/CP-03)" section added to formatter-patterns.md
- **W-5:** `(D-09:` changed to `(Phase 41 D-02:` in package-mjs-template.md line 216
- **W-6:** "Extension API ONLY" callout added to top of visualization-js-template.md
- **W-7:** `var accentColor` declaration added to Animation opt() read pattern in formatter-patterns.md
- **W-8:** D10 source requirement note added to build-mjs-template.md Notes section
- **W-9:** `'${PREVIEW_SCRIPT_PATH}'` replaced with explicit TODO comment in package-mjs-template.md
- **W-10:** Per-viz Animation notes added to all 16 viz types in viz-blueprints.md that lacked them (AB-03 partial closure — Multi-Channel Composite already had notes)
- **W-11:** Full relative path `vp-debug/references/broken-rules.md` used in edge-cases.md ECR-06 cross-reference
- **W-20:** Extension API scope gap note added to pre-code-checklist.md Extension API section

## NITs Resolved

- **N-1:** Cross-link footer in theme-template.md updated with specific file references
- **N-2:** "minimum 10 controls" line updated to "target 14-18 for domain vizs; minimum 3 section-label sections (4 when Animation present)"
- **N-3:** "Phase 6" internal terminology removed from canvas-recipes.md; "Phase 9 only" replaced with contextual description
- **N-4:** Animation section comment added to Section Grouping in config-json-template.md
- **N-5:** `appIcon_2x.png` marked as optional/not generated in conf-templates.md directory structure
- **N-6:** Location note header added to animation-recipes.md explaining vp-recipes/ placement

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Deviation: Accidental commit to `main`

**Task 1** was committed to `main` (commit `0e6cc372`) instead of the worktree branch because initial `git` commands used the wrong working directory. This was corrected by cherry-picking the commit to the worktree branch as `064e6912`. The `main` branch has an extra commit ahead of the intended base — the orchestrator merge will need to handle this (or it will resolve naturally since the content is identical).

## Known Stubs

None — all changes are documentation corrections with no placeholder content.

## Threat Flags

None — changes are documentation-only, no new executable code surface.

## Self-Check: PASSED

All 13 modified files confirmed present in worktree. All 4 task commits (064e6912, f1730bd5, 70eb8862, 4e44b718) confirmed present in worktree branch history.
