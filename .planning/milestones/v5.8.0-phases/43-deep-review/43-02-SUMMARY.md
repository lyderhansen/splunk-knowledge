---
phase: 43-deep-review
plan: "02"
subsystem: splunk-viz-packs/skills
tags: [review, skills, vp-viz, vp-design, vp-init, vp-create, vp-debug, vp-recipes, wave-2]
dependency_graph:
  requires: []
  provides: [43-WAVE-2-REVIEW-SKILLS.md]
  affects: [wave-3-scripts-review, remediation-plans]
tech_stack:
  added: []
  patterns: [BLOCKER/WARNING/NIT severity rubric, coverage-summary table]
key_files:
  created:
    - .planning/phases/43-deep-review/43-WAVE-2-REVIEW-SKILLS.md
  modified: []
decisions:
  - "Preview.png ownership stale in vp-viz (rule 13) and vp-init (STAGE 3 summary) — both cite generate_assets.js+300x200, Phase 41 changed to generate_previews.py+116x76"
  - "CP-01 (6-8 brand swatch extraction) absent from vp-design — highest remediation priority"
  - "vp-debug heading B1-B21 vs table B1-B23 — trivial fix"
  - "THM-05 debug entry absent from vp-debug — needs addition"
  - "animation-recipes.md confirmed at vp-recipes/references/ (not vp-viz) — CONTEXT.md D-06 had wrong path"
metrics:
  duration_minutes: 32
  completed_date: "2026-05-24"
  tasks_completed: 4
  tasks_total: 4
  files_created: 1
  files_modified: 0
---

# Phase 43 Plan 02: Wave 2 SKILL.md Review Summary

Exhaustive end-to-end read of all 6 vp-* SKILL.md files with Phase 22-42 coverage verification, cross-reference resolution, and broken-rules.md B-code drift analysis.

## What Was Built

`43-WAVE-2-REVIEW-SKILLS.md` — per-SKILL findings for all 6 vp-* skills (vp-viz, vp-design, vp-init, vp-create, vp-debug, vp-recipes) with BLOCKER/WARNING/NIT classification and a 26-row Coverage Summary table.

## Findings Summary

### BLOCKERs (5)

1. **[vp-viz:413] preview.png quick rule 13 stale** — still says `generate_assets.js` + `300x200`. Phase 41 changed to `generate_previews.py` + `116x76 RGB`.

2. **[vp-init:81] STAGE 3 pipeline summary stale** — "Step 3b: generate_assets.js (icons + previews + gradient bg)" does not reflect the Phase 41 split. generate_previews.py is invisible here.

3. **[vp-design] CP-01 6-8 brand swatch step missing** — Brand Research step describes hex codes but omits the explicit instruction to extract 6-8 `<splunk-color>` swatches for formatter color picker presets. Formatter pickers will have no brand palette without this step.

4. **[vp-debug:77] BROKEN section heading says B1-B21** — summary table inside has B1-B23 (B22 and B23 added in v4.1.0). Stale heading truncates the rule set.

5. **[vp-debug] THM-05 / backgroundColor light-mode fix absent** — Phase 42's most recent landed fix has no debug entry. A developer debugging light-mode background color issues finds nothing in vp-debug.

### WARNINGs (8)

1. **[vp-viz] Budget headroom 13 lines** — 487/500 lines; dangerously close to the Phase 29 cap.
2. **[vp-viz] Animation Helper Scope Rule (AF-01) not eagerly visible** — only in lazy-loaded animation-recipes.md, not in CRITICAL SUBSET or an inline note.
3. **[vp-design] Accent role not stated in design brief output block** — accent={hex} in palette without "hover/glow/selection only" note.
4. **[vp-design] FC-02 partial — hand-off message missing Format forward** — hand-off to vp-viz doesn't explicitly carry the Format: classic/extension value.
5. **[vp-init] ds-create cross-plugin ref missing full path** — table cites ds-create by skill name only; no file path for Claude to navigate.
6. **[vp-create:53] "Phase 31" internal planning reference** — Extension validation comment says "see Phase 31" with no resolvable file.
7. **[vp-debug] E01-E05 (Extension API) codes absent** — no flowchart path or quick-fix entry for Extension API validation failures.
8. **[vp-debug] A01-A04 (asset validation) codes absent** — FAIL A01-A04 from validate_viz.sh has no vp-debug entry.
9. **[vp-debug] AF-01 animation scope rule absent** — "animation not working" debug path missing.
10. **[vp-recipes] animation-recipes.md only reachable via all-patterns.md** — no direct link in vp-recipes/SKILL.md References section; vp-viz cites it directly.

### NITs (4)

1. vp-viz: No explicit FC-04 tag on Extension API checklist reference line.
2. vp-design: Design brief palette has only 4 theme tokens — theme.js has more.
3. vp-debug: broken-rules.md detailed sections only for 4 of 23 B-codes (deferred to Wave 3).
4. vp-recipes: Intro line prose-references canvas-recipes.md without a Markdown link.

## Coverage Summary Status

26 change-IDs verified. 6 NO/PARTIAL rows:
- CP-01 — NO (vp-design)
- FC-02 — PARTIAL (vp-design)
- FC-04 — PARTIAL (vp-viz)
- PP-01 stale — NO (vp-viz, vp-init)
- AF-01 eager — PARTIAL (vp-viz)
- LM-02 — NO (vp-debug)

## Deviations from Plan

None — plan executed exactly as written. Review-only work; no source files modified.

## Stubs

None — this plan produces a review document only.

## Threat Flags

None — documentation review, no new executable surface.

## Self-Check: PASSED

- [x] `.planning/phases/43-deep-review/43-WAVE-2-REVIEW-SKILLS.md` exists (399 lines)
- [x] 6 H2 sections present: vp-viz, vp-design, vp-init, vp-create, vp-debug, vp-recipes
- [x] Coverage Summary H2 with 26 rows
- [x] No SKILL.md files modified
- [x] Commits 25dd905f (task 1), 4cce62b6 (task 2), 416fc24e (task 3), 4a875137 (task 4) all exist
