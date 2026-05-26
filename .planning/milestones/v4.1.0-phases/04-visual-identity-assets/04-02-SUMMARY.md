---
phase: 04-visual-identity-assets
plan: "02"
subsystem: splunk-viz-packs
tags: [skill-authoring, visual-language, novelty-scoring, interactivity, canvas]
dependency_graph:
  requires: []
  provides: [viz-novelty-scores.md, visual-language-schema, interactivity-mandate]
  affects: [vp-design/SKILL.md, vp-viz/SKILL.md]
tech_stack:
  added: []
  patterns: [visual-language-schema, novelty-scoring, soft-warning]
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-design/references/viz-novelty-scores.md
  modified:
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
decisions:
  - "Soft warning only for low novelty packs — do NOT hard-block (D-11 mandate)"
  - "Visual Language schema uses 6 dimensions (cornerRadius/fillTechnique/strokeStyle/spacing/shadowDepth/dataPresentation)"
  - "5 brand reference mappings: Cloudflare, Hospital, Patagonia, Porsche, Stripe"
  - "Rule 15 in vp-viz updated: generate_assets.js replaces Pillow reference"
metrics:
  duration: "4 minutes"
  completed_date: "2026-05-15"
  tasks_completed: 3
  files_changed: 3
---

# Phase 04 Plan 02: Visual Language Schema + Novelty Scoring Summary

**One-liner:** Added Visual Language schema (6-dimension brand divergence spec), viz novelty scoring (1-5 table, 3xN threshold, soft-warning logic), and mandatory interactivity rules (VIZ-APPROPRIATE formatter settings, table sort/pagination, hover tooltip, KPI threshold color) across vp-design and vp-viz skill files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create viz-novelty-scores.md (DES-04) | c8f47bd | plugins/splunk-viz-packs/skills/vp-design/references/viz-novelty-scores.md |
| 2 | Update vp-design/SKILL.md (DES-05) | a760752 | plugins/splunk-viz-packs/skills/vp-design/SKILL.md |
| 3 | Update vp-viz/SKILL.md (DES-13/14) | c9047fa | plugins/splunk-viz-packs/skills/vp-viz/SKILL.md |

## What Was Built

### Task 1 — viz-novelty-scores.md (115 lines)

New reference file in `vp-design/references/` following the mood-and-design.md format:

- Scoring table: 22 viz types scored 1-5 (donut=1, timeline/sankey/waffle=5; unknown type=5 benefit of doubt)
- Pack threshold rule: 3 x vizCount minimum total (4-viz pack needs >= 12)
- When to warn section: lists low-scoring vizs + suggests score-4/5 replacements; explicitly states "Do NOT hard-block"
- Anti-donut alternatives table: 6 replacements (donut, pie, simple bar, plain KPI, simple line, half-donut gauge)
- Two scoring examples: low-score retail pack (6/12) and high-score CDN pack (21/15)

### Task 2 — vp-design/SKILL.md (137 to 176 lines)

Three additions, zero deletions of existing content:

1. **Novelty check section** (after viz pack rules): loads viz-novelty-scores.md, computes pack total, soft-warns if below threshold
2. **Visual Language schema block** (after design brief output format): shows the 6-field schema output format as a literal text block + table of 5 brand reference mappings (Cloudflare, Hospital, Patagonia, Porsche, Stripe)
3. **Reference link** appended to References section

### Task 3 — vp-viz/SKILL.md (437 to 450 lines)

Three additions within the 63-line budget:

1. **7 pre-code checklist items** after drilldown item: VIZ-APPROPRIATE formatter mandate, MANDATORY table sort/pagination, MANDATORY bar chart hover tooltip, MANDATORY KPI threshold color, MANDATORY drilldown emit, drilldownField formatter input, Visual Language consumption
2. **Visual Language consumption block** appended to "Unique rendering per brand": maps cornerRadius to roundRect rx, fillTechnique to gradient/flat/hatching, spacing to multiplier (tight=0.7, balanced=1.0, airy=1.4)
3. **Rule 15 replacement**: Pillow/PIL reference replaced with `node generate_assets.js <app_dir>` (correct tool per vp-create)

## Line Count Verification

| File | Before | After | Limit | Status |
|------|--------|-------|-------|--------|
| vp-design/SKILL.md | 137 | 176 | 500 | PASS |
| vp-viz/SKILL.md | 437 | 450 | 500 | PASS |
| viz-novelty-scores.md | 0 (new) | 115 | none | PASS (>= 40 required) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All content is substantive and complete. No placeholder text or incomplete sections.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Files are skill documentation only — they influence LLM code generation but do not execute directly.

## Self-Check: PASSED

- FOUND: plugins/splunk-viz-packs/skills/vp-design/references/viz-novelty-scores.md
- FOUND: plugins/splunk-viz-packs/skills/vp-design/SKILL.md
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
- FOUND commit c8f47bd (Task 1)
- FOUND commit a760752 (Task 2)
- FOUND commit c9047fa (Task 3)
- No unexpected file deletions
