---
phase: 12-dashboard-composition
plan: "01"
subsystem: vp-design
tags: [composition, dashboard, visual-hierarchy, depth, narrative, background-treatment]
dependency_graph:
  requires:
    - plugins/splunk-viz-packs/skills/vp-design/references/mood-and-design.md
    - plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md
  provides:
    - plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md
  affects:
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
tech_stack:
  added: []
  patterns:
    - "Option A/B/C background treatment menu driven by brand mood"
    - "Golden-ratio hero split: 1186px hero / 734px supporting on 1920px canvas"
    - "Shadow card recipe: panel group + 10px inset, fillColor 2-3 stops brighter, rx 8"
    - "Faux glow recipe: 3-layer nested rects at fillOpacity 0.04 / 0.08 / 0.6"
    - "Domain-to-narrative mapping: story-first panel arrangement per archetype"
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md
  modified:
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
decisions:
  - "Background treatment menu (3 options) driven by brand mood per D-01: Luxury/Futuristic/Speed/Playful get gradient PNG (Option A); Precision/Power/Trust/Organic/Minimal get flat+rects (Option B)"
  - "backgroundColor AND splunk.rectangle both always used together per D-02"
  - "Gradient backgrounds via generated PNG only — Dashboard Studio rectangles are flat-color only per D-04"
  - "Golden-ratio hero split: 1186px/734px on 1920px canvas per D-07 absolute positioning constraint"
  - "Mood-to-depth mapping table documents 9 moods with layer counts and card styles per D-08"
  - "Section headers via splunk.markdown are optional, Claude decides per D-11; fontFamily restricted to Splunk Platform Sans or Arial only"
metrics:
  duration: "3m 25s"
  completed: "2026-05-18T08:44:14Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 12 Plan 01: Dashboard Composition Reference Summary

**One-liner:** New 599-line `dashboard-composition.md` reference covers mood-driven background treatment (gradient PNG vs flat+rects), golden-ratio visual hierarchy math (1186px/734px), shadow card and faux glow depth recipes, and domain-to-narrative panel arrangement — wired into vp-design SKILL.md hand-off protocol as step 1.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create dashboard-composition.md reference file | 073c28b | plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md (created, 599 lines) |
| 2 | Wire dashboard-composition.md into vp-design SKILL.md | 666fa88 | plugins/splunk-viz-packs/skills/vp-design/SKILL.md (modified, +8/-6 lines) |

## What Was Built

### dashboard-composition.md (Task 1)

A 599-line prescriptive reference file at `plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md` covering 7 sections:

1. **Purpose and When to Load** — loaded at vp-design step 7 (hand-off), before writing dashboard JSON
2. **Background Treatment Menu (DSH-01)** — 3 options with JSON code examples:
   - Option A: Gradient wash PNG via `splunk.image` at z=0 (`/static/app/{app_id}/images/bg_gradient.png`, `preserveAspectRatio: false`)
   - Option B: Flat tint `backgroundColor` + low-opacity `splunk.rectangle` layers
   - Option C: Radial accent glow via large rounded rectangle at fillOpacity 0.03–0.06
   - Mood-to-background mapping table: Luxury/Futuristic/Speed/Playful → Option A; Precision/Power/Trust/Organic/Minimal → Option B
3. **Visual Hierarchy (DSH-02)** — Golden-ratio math (1186px hero / 734px supporting / 20px gutter on 1920px canvas), asymmetric KPI strip (560px hero / 380px supporting), zone layout sketches with pixel values for all 4 archetypes (Executive, Operational, SOC, Analytical)
4. **Depth via Card Grouping (DSH-03)** — Mood-to-depth mapping table (9 moods), shadow card recipe (panel group + 10px inset, 15–20 HSL lightness units above canvas), faux glow recipe (3 nested rects at 0.04/0.08/0.6 opacity), z-order rule and pitfall warning, complete structure array example
5. **Narrative Panel Arrangement (DSH-04)** — Domain-to-narrative mapping (6 domains: SOC, Executive, Operations, Analyst, Retail, Healthcare), density rhythm (sparse → medium → dense), optional section headers with fontFamily enum constraint documented
6. **Anti-Patterns** — 6 Slop Test failures with explanations
7. **Composition Checklist** — 10-item checklist Claude runs before finalizing dashboard JSON

### vp-design SKILL.md (Task 2)

Two changes to `plugins/splunk-viz-packs/skills/vp-design/SKILL.md`:
- **Hand-off protocol:** New item 1 "Load dashboard-composition.md from vp-design/references/" added before vp-viz (items 2–7 renumbered)
- **References section:** New first bullet "[Dashboard composition](references/dashboard-composition.md)" added before mood-and-design entry
- File stays at 178 lines (well under 500-line SKILL.md limit)

## Success Criteria Verification

- [x] dashboard-composition.md exists at `plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md`
- [x] File has 599 lines (>= 250 required) covering all 7 sections
- [x] Background treatment menu has 3 options (A, B, C) with JSON code examples for each
- [x] Gradient PNG path uses `/static/app/{app_id}/images/bg_gradient.png`
- [x] Visual hierarchy includes golden-ratio math (1186px hero / 734px supporting)
- [x] Depth section includes mood-to-depth mapping table and both shadow card and faux glow JSON recipes
- [x] Narrative section includes domain-to-narrative mapping table with 6 domain rows
- [x] Anti-patterns section lists 6 items
- [x] Composition checklist present with 10 checkbox items
- [x] All D-01 through D-11 decisions honored in content
- [x] vp-design SKILL.md references dashboard-composition.md in 2 places (hand-off protocol + references section)
- [x] Hand-off protocol lists dashboard-composition.md as item 1 (before vp-viz)
- [x] SKILL.md remains under 500 lines (178 lines)
- [x] No existing content removed from SKILL.md — only additions

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The reference file is self-contained with all pixel values, JSON structures, and mapping tables inline. No data sources to wire, no placeholders.

## Threat Flags

None. This plan creates Markdown reference content only. No network endpoints, no auth paths, no file access patterns, no schema changes. T-12-01 (bg_gradient.png image path) is accepted — public static asset, no secrets involved.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-design/references/dashboard-composition.md` — EXISTS (599 lines)
- [x] `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` — MODIFIED (178 lines, 2 references to dashboard-composition.md)
- [x] Commit 073c28b — EXISTS (create dashboard-composition.md)
- [x] Commit 666fa88 — EXISTS (wire into SKILL.md)
