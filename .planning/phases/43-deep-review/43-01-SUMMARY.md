---
phase: 43-deep-review
plan: "01"
subsystem: documentation-review
tags: [review, references, wave-1, blockers, vp-viz, vp-recipes]
dependency_graph:
  requires: []
  provides: [43-WAVE-1-REVIEW-REFERENCES.md]
  affects: [43-02-PLAN.md, 43-03-PLAN.md, 43-06-PLAN.md]
tech_stack:
  added: []
  patterns: [exhaustive-file-read, severity-classification, coverage-summary-table]
key_files:
  created:
    - .planning/phases/43-deep-review/43-WAVE-1-REVIEW-REFERENCES.md
  modified: []
decisions:
  - "Wave 1 confirms THM-05/LM-01/LM-02/AF-01/AF-02/MC-01 are consistently documented — no remediation needed for those"
  - "THM-01/THM-02 are not formally tagged anywhere in the plugin — remediation must define these as explicit rule IDs or retire them from the checklist"
  - "B-code tagging gap (B5/B7/B9/B10/B20/B21) is the highest-value Wave 3/7 target since it breaks the FAIL-code-to-docs cross-reference chain"
  - "animation-recipes.md stays in vp-recipes/references/ — adding a location note is sufficient, no move required"
metrics:
  duration_minutes: 65
  completed_date: "2026-05-24"
  tasks_completed: 4
  files_reviewed: 13
---

# Phase 43 Plan 01: Wave 1 Reference File Review Summary

**One-liner:** Exhaustive end-to-end review of all 13 Wave 1 reference files found 6 BLOCKERs, 11 WARNINGs, 7 NITs; THM-05/AF-01/AF-02/MC-01 verified consistent.

## What Was Done

Performed exhaustive file-by-file review (per CONTEXT D-02) of all 13 reference files in scope for Wave 1:

- `plugins/splunk-viz-packs/skills/vp-viz/references/` (12 files)
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` (1 file, misfiled from CONTEXT.md perspective but correct per RESEARCH)

Output artifact: `.planning/phases/43-deep-review/43-WAVE-1-REVIEW-REFERENCES.md`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Review theme/checklist foundation cluster (3 files) | e3a14000 | 43-WAVE-1-REVIEW-REFERENCES.md |
| 2 | Review Extension API + formatter pattern cluster (5 files) | e3a14000 | 43-WAVE-1-REVIEW-REFERENCES.md |
| 3 | Review viz blueprints + recipes + edge cases cluster (5 files) | e3a14000 | 43-WAVE-1-REVIEW-REFERENCES.md |
| 4 | Write Wave 1 Coverage Summary table | e3a14000 | 43-WAVE-1-REVIEW-REFERENCES.md |

## Key Findings

### BLOCKERs (6)

1. **THM-01/THM-02 undefined** — These change-IDs from the review checklist have no explicit code tags in any plugin file. Rules exist in prose but are not tagged with `(THM-01)` / `(THM-02)` anchors that a developer can grep for.

2. **D10 (@viz-type) missing from Extension API template** — `visualization-js-template.md` template code block does not have `// @viz-type:` as its first line. Every Extension API viz generated from this template will fail `check_design.js D10`.

3. **B5/B7/B9/B10/B20/B21 not tagged** — `validate_viz.sh` emits `FAIL B5` through `FAIL B21` but the corresponding rules in `pre-code-checklist.md` don't carry explicit `(B5)` etc. tags. Only B22 is tagged. Cross-reference chain broken.

4. **conf-templates.md savedsearches.conf Extension API path undocumented** — Only Classic path shown. Extension API path is materially different; omission would mislead Claude into writing wrong config for Extension API packs.

5. **showGlassPanel in formatter-patterns.md Effects prose (line 173)** — Contradicts the locked "no drawGlassPanel" decision. The actual `<form>` code template does NOT include this control (so generation is safe), but the prose description at line 173 lists it alongside `showAmbientLight`, `showVignette`, `showGlow`.

6. **animation-recipes.md AB-02 assumes `t` in scope** — The Generic LED Pulse Boilerplate `updateView` block uses `opt('accentColor', t.accent)` without showing the required `var t = theme.getTheme(detectTheme());` preamble declaration. Developers copying only the AB-02 block get `ReferenceError: t is not defined`.

### Verified Consistent (no remediation)

- **THM-05 / LM-01 / LM-02** — All 4 files (theme-template.md, pre-code-checklist.md, visualization-js-template.md, config-json-template.md) consistent with WRONG/RIGHT pattern and cross-link footers.
- **AF-01 / AF-02** — Animation Helper Scope Rule correctly documented in animation-recipes.md with explicit WRONG/RIGHT table. All 5 boilerplates pass primitives (speedMult, accentColor) not config/ns.
- **EF-02** — `@splunk/dashboard-studio-extension` bundled (no external clause) correctly documented in build-mjs-template.md.
- **EF-03** — `[${vizName}]` bare stanza pattern present in both package-mjs-template.md and conf-templates.md (conf-templates.md missing EF-03 citation — WARNING but not BLOCKER).
- **MC-01** — Multi-Channel Composite blueprint fully present in viz-blueprints.md:554-602 with F1 telemetry worked example.
- **PP-01 / PP-02** — generate_previews.py first / buildSolidPng fallback correctly implemented in package-mjs-template.md.
- **All 5 cross-plugin ds-* skill references** — Verified by RESEARCH, confirmed during Cluster 1/2 read.

## Deviations from Plan

None. Plan executed exactly as written. All 13 files read end-to-end. All 4 tasks complete with verification passing.

## Known Stubs

None. This plan produces only a review document; no implementation code.

## Threat Flags

None. This plan is discovery-only; no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check

### Files Created

- `.planning/phases/43-deep-review/43-WAVE-1-REVIEW-REFERENCES.md` — FOUND (committed at e3a14000)
- `.planning/phases/43-deep-review/43-01-SUMMARY.md` — this file

### Commits

- `e3a14000` — docs(43-01): wave 1 reference file review

### Verification Commands Passed

All 4 task automated verify checks passed:
- Task 1: `grep -q "## Cluster 1: Theme + Checklist Foundation"` — PASSED
- Task 2: awk range on Cluster 2 contains BLOCKER/WARNING/NIT — PASSED
- Task 3: awk range on Cluster 3 with Coverage Summary delimiter — PASSED
- Task 4: Coverage table has ≥20 rows matching change-ID pattern — PASSED

## Self-Check: PASSED
