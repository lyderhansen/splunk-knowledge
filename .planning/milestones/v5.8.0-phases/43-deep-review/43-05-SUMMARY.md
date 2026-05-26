---
phase: 43-deep-review
plan: "05"
subsystem: splunk-dashboard-studio
tags: [review, wave-5, dashboard-studio, cross-plugin-references, jsonata]
dependency_graph:
  requires: [43-RESEARCH.md, 43-CONTEXT.md]
  provides: [43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md]
  affects: []
tech_stack:
  added: []
  patterns: [BLOCKER/WARNING/NIT severity classification, defensive grep sweep]
key_files:
  created:
    - .planning/phases/43-deep-review/43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md
  modified: []
decisions:
  - "All 5 vp-* -> ds-* cross-plugin references verified: ds-create, ds-int-tabs, ds-int-drilldowns, ds-ref-archetypes, ds-ref-layout-grid"
  - "Phase 38 JR-01/JR-02 fully landed: ds-ref-jsonata has all required function families; ds-int-tokens has MUST LOAD directive"
  - "2 BLOCKERs found: ds-create deprecated drilldown generation; ds-ref-layout-grid wrong tabs schema"
  - "RESEARCH Assumption A2 confirmed: bounded list of 5 ds-* refs is complete"
metrics:
  duration: "35 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 0
---

# Phase 43 Plan 05: Wave 5 Dashboard Studio Review Summary

Exhaustive review of the 8 bounded splunk-dashboard-studio skills — 5 cross-referenced from vp-* skills and 3 touched by Phase 38 JSONata work. Produced `43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md` with BLOCKER/WARNING/NIT classification and Coverage Summary.

## What Was Done

**Task 1:** Reviewed 5 cross-referenced ds-* skills end-to-end (ds-create, ds-int-tabs, ds-int-drilldowns, ds-ref-archetypes, ds-ref-layout-grid). Verified all vp-* citation line numbers resolve. Verified SU-01 (linkToDashboard.tokens is array+value) and SU-03 (three-handler chain) locks in ds-int-drilldowns.

**Task 2:** Reviewed 3 Phase 38 skills (ds-ref-jsonata, ds-int-tokens, ds-ref-syntax). Verified JR-01 deliverable inventory (all 8 function families present in ds-ref-jsonata). Verified JR-02 MUST LOAD directive in ds-int-tokens. Verified Phase 38 cross-reference wiring in ds-ref-syntax.

**Task 3:** Ran defensive grep sweep (`grep -rE "ds-[a-z-]+" plugins/splunk-viz-packs/skills/ --include="*.md"`). Confirmed bounded list is complete — exactly 5 distinct ds-* references found, all already in scope. Produced Coverage Summary table covering all 8 skills.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 76712b83 | docs(43-05): Wave 5 review — 8 bounded dashboard-studio skills | 43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md |

## Findings

### BLOCKERs (2)

**1. [BLOCKER — schema/deprecated] ds-create generates deprecated drilldown format**
- File: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md:87`
- ds-create's "Panel drilldowns" section instructs generating `options.drilldown = "all"` + `options.drilldownAction`. ds-ref-syntax:349 says these are deprecated — use `eventHandlers` array.
- Fix: Update ds-create to generate `eventHandlers` format matching ds-int-drilldowns documentation.

**2. [BLOCKER — wrong schema] ds-ref-layout-grid "Required wrapper structure" uses wrong tabs format**
- File: `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md:83-104`
- The example shows `tabs` as bare array with `id`/`label`/`layoutDefinitionId` keys and `showTabBar` at layout-root and `layoutDefinitions` as array — all wrong. Correct format (from ds-int-tabs, ds-ref-syntax): `tabs` as object with `items` array + `options`, `layoutDefinitions` as object keyed by `layoutId`.
- Fix: Replace the code block with the correct format from ds-int-tabs.

### WARNINGs (5)

1. **ds-ref-archetypes:8** — stale "skeleton only" status marker (body is complete, 320+ lines)
2. **ds-ref-layout-grid:8** — same stale "skeleton only" marker
3. **ds-ref-archetypes exec canvas** — says "1440×960 (laptop)" but ds-ref-layout-grid mandates 1920px minimum. Inconsistency.
4. **ds-int-tokens:36** — "URL parameters" entry says `form.<name>` URL params, but ds-int-drilldowns says NO `form.` prefix. Classic/DS format confusion.
5. **ds-int-tabs WARNING** — schema inconsistency caused by ds-ref-layout-grid BLOCKER (see above).

### NITs (4)

1. ds-int-tabs — no link to ds-ref-jsonata for token-driven tab switching documentation
2. ds-ref-archetypes — "Scope" section promises per-archetype canvas dimensions but exec conflicts with 1920 rule
3. ds-ref-jsonata — higher-order functions ($map/$filter/$reduce) lack explicit [Standard JSONata] caveat for DS-unverified status
4. ds-ref-syntax — grid layout example shows deprecated flat format without tabs wrapper

## Phase 38 Compliance

All JR-01/JR-02 deliverables PASS:
- ds-ref-jsonata: operators, string functions, numeric functions, date/time (incl. $toMillis/$fromMillis/$now), array ops ($map/$filter/$reduce), path expressions, lambdas, 6 recipes
- ds-int-tokens: MUST LOAD directive present (line 182), inline JSONata condensed to 20-line summary
- SU-02 "JSONata not SPL eval" documented as HIGHEST FREQUENCY ERROR in ds-ref-jsonata Trap 1
- ds-ref-syntax: two cross-reference wiring points to ds-ref-jsonata verified

## Cross-Plugin References

All 9 vp-* → ds-* citation instances verified resolved. RESEARCH Assumption A2 confirmed — bounded list of 5 ds-* skills is complete, no additional references found in vp-* skills.

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed, all automated verification checks pass.

## Known Stubs

None — this plan is review-only (no source file edits).

## Self-Check: PASSED

- `.planning/phases/43-deep-review/43-WAVE-5-REVIEW-DASHBOARD-STUDIO.md` exists — FOUND
- `## Cross-referenced Skills` H2 with 5 sub-headings — PASS
- `## Phase 38 Skills` H2 with 3 sub-headings — PASS
- `## Defensive grep sweep` H2 — PASS
- `## Coverage Summary` H2 — PASS
- Commit 76712b83 exists — PASS
- No source files modified — PASS (review-only plan)
