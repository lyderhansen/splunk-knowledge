---
phase: 14-smart-fields-domain-ideation
plan: "01"
subsystem: vp-design
tags: [domain-ideation, viz-design, skill-authoring, domain-templates]
dependency_graph:
  requires: []
  provides: [domain-visual-language-step, domain-unique-mandate, canvas-complexity-gate, domain-templates-soc-energy-healthcare]
  affects: [vp-design/SKILL.md, vp-design/references/domain-templates.md]
tech_stack:
  added: []
  patterns: [domain-visual-language-research, canvas-complexity-gate, proxy-patterns]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md
decisions:
  - "Added step 3b as intermediate workflow step — does not renumber existing steps"
  - "Used proxy pattern for generation_mix Sankey (Overambitious tier) — documented in domain-templates.md note"
  - "Added domain visual language notes to all 6 domains (including F1, Retail, NOC) not just the 3 required"
metrics:
  duration: "~16 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 2
---

# Phase 14 Plan 01: Domain Visual Language Ideation Summary

## One-liner

Domain-first viz ideation added to vp-design workflow — step 3b mandates domain research before selection, with 9 domain-unique viz entries across SOC/Energy/Healthcare, a Canvas complexity gate, and proxy patterns for overambitious types.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add domain visual language step 3b and domain-unique mandate to vp-design SKILL.md | 357961b | plugins/splunk-viz-packs/skills/vp-design/SKILL.md |
| 2 | Expand domain-templates.md with domain-unique viz entries, visual language notes, complexity gate | 5526c63 | plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md |

## What Was Built

### Task 1: vp-design/SKILL.md

Added 20 lines to the vp-design workflow skill:

1. **Step 3b in workflow block** — inserted between "Design direction" (step 3) and "Viz inventory" (step 4). The step directs Claude to load domain-templates.md for precedents and produce 2-3 domain-unique viz concepts before touching the inventory.

2. **Domain visual language research section** — a new `## Domain visual language research (step 3b)` section after the inline code warning. Contains:
   - 4-step procedure (load templates, domain concept sketch, identify domain-unique concepts, classify Canvas complexity)
   - Canvas complexity gate (Renderable / Stretched / Overambitious) with per-tier decision rules
   - Domain lock assertion ("Could this inventory appear in a different domain with different colors?")
   - DOM-02 mandate: minimum 2 domain-unique viz types per pack

3. **Viz pack rules bullet** — added "Minimum 2 domain-unique viz types (from domain-templates.md 'no generic equivalent' entries)" to the existing Viz pack rules section.

File grew from 178 to 198 lines (well under 500-line limit).

### Task 2: domain-templates.md

Added 72 lines to the domain templates reference file:

1. **Domain visual language notes** for all 6 domains (F1, SOC, Retail, Healthcare, NOC, Energy) — 2-3 sentence industry convention descriptions seeding the domain concept sketch step.

2. **SOC domain-unique entries (3)**:
   - `kill_chain_stage_flow` — MITRE stage band chart, band width = alert volume (no generic equivalent)
   - `threat_tactic_heatmap` — ATT&CK tactic x severity grid, fixed ATT&CK column ordering (no generic equivalent)
   - `dwell_time_histogram` — detection gap in days, log-scale x-axis (no generic equivalent)

3. **New Energy / Utilities domain section** with 6 total viz entries including 3 domain-unique:
   - `soc_thermometer` — battery state-of-charge vertical fill bar with segmented fill (no generic equivalent)
   - `grid_frequency_band` — frequency deviation chart with ±0.2Hz amber and ±0.5Hz red tolerance bands (no generic equivalent)
   - `generation_mix_bars` — Sankey proxy: horizontal bars with directional arrow indicators (no generic equivalent)

4. **Healthcare domain-unique entries (3)**:
   - `ward_occupancy_bars` — bar per ward with capacity reference lines and zone colors (no generic equivalent)
   - `vital_sparkline_matrix` — patient rows x vital columns sparkline grid (no generic equivalent)
   - `triage_horizon` — horizon chart of wait time by triage category (no generic equivalent)

5. **Canvas complexity gate section** before Design anti-patterns — Renderable/Stretched/Overambitious tiers with 5 proxy patterns (topology map, force-directed graph, Sankey flow, geospatial grid, candlestick) and warning sign detection.

File grew from 98 to 169 lines (well under 500-line limit).

## Verification Results

| Check | Result |
|-------|--------|
| step 3b in vp-design workflow block | PASS |
| Domain visual language research section with complexity gate | PASS |
| 2 domain-unique mandate in viz pack rules | PASS |
| Domain visual language notes: 6 domains | PASS (6, needed 3+) |
| "no generic equivalent" entries: 9 | PASS (9, needed 9) |
| Canvas complexity gate with proxy patterns | PASS (5 proxy patterns, needed 4) |
| vp-design/SKILL.md under 500 lines | PASS (198 lines) |
| domain-templates.md under 500 lines | PASS (169 lines) |

## Deviations from Plan

### Enhancements applied automatically

**1. [Rule 2 - Missing critical functionality] Added domain visual language notes to F1, Retail, and NOC**

The plan specified adding notes to SOC, Energy, and Healthcare. However, the plan also specified adding notes "to ALL five existing domains (F1, SOC, retail, healthcare, NOC)" in the Task 2 action block. Notes were added to all 6 domains (including the new Energy section) to match the action spec, which is more complete than the minimum requirement listed in acceptance criteria.

- **Found during:** Task 2, reviewing the action spec vs acceptance criteria
- **Fix:** Added domain visual language notes to F1, Retail, and NOC in addition to the three required domains
- **Impact:** Only additive — no behavioral change, richer reference material

None of the plan's success criteria (DOM-01 through DOM-04) were compromised.

## Known Stubs

None. Both files contain complete, actionable content with no placeholder text.

## Threat Flags

None. Both modified files are developer-authored markdown reference docs. No new network endpoints, runtime code, auth paths, or file access patterns introduced.

## Self-Check: PASSED

Files exist:
- plugins/splunk-viz-packs/skills/vp-design/SKILL.md — FOUND (198 lines)
- plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md — FOUND (169 lines)

Commits exist:
- 357961b — feat(14-01): add domain visual language step 3b to vp-design workflow
- 5526c63 — feat(14-01): expand domain-templates.md with domain-unique viz entries and complexity gate
