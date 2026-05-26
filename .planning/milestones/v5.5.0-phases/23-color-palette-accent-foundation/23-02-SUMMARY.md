---
phase: 23-color-palette-accent-foundation
plan: "02"
subsystem: splunk-viz-packs / skill references
tags: [wcag, contrast, accent-color, formatter-patterns, design-principles, light-theme]
dependency_graph:
  requires: []
  provides: [CP-02, CP-03]
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md
tech_stack:
  added: []
  patterns:
    - "accentColor picker in Effects section only — never Color and style"
    - "accentColor used exclusively inside withAlpha() — never ctx.fillStyle = accentColor"
    - "opt('accentColor', t.accent) pattern for formatter override source"
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md
decisions:
  - "textFaint #6B7080 chosen for WCAG AA 3:1+ ratio on #F0F2F5 background (D-03)"
  - "accentColor picker moved to Effects section (not Color and style) per D-01"
  - "accentColor is overlay-only: withAlpha() calls exclusively, never solid fill"
metrics:
  duration_minutes: 1
  completed_date: "2026-05-20"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 23 Plan 02: LIGHT.textFaint WCAG Fix + accentColor Formatter Restoration Summary

**One-liner:** LIGHT.textFaint darkened to #6B7080 for WCAG AA compliance; accentColor picker restored to Effects section with 8-swatch template and withAlpha()-only usage contract.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix LIGHT.textFaint and restore accentColor in formatter-patterns.md | e5fc2a2 | theme-template.md, formatter-patterns.md |
| 2 | Update design-principles.md DPR-03b with formatter accentColor source | 269945f | design-principles.md |

## What Was Done

### Task 1 — theme-template.md + formatter-patterns.md (e5fc2a2)

Three targeted edits across two files:

**theme-template.md:** `LIGHT.textFaint` changed from `#8A8FA0` to `#6B7080`. The old value had ~2.5:1 contrast ratio on `#F0F2F5` background — below WCAG AA minimum (3:1). The new value achieves 3:1+ (CP-02).

**formatter-patterns.md — WRONG block:** The line `WRONG: accentColor picker in Color and style → removed in Phase 18 (D-10). Use series color pickers instead.` was replaced with `NOTE: accentColor picker belongs in Effects section (not Color and style). Controls glow/highlight overlay only — never solid fill. (Phase 23 CP-03)`. This corrects the Phase 18 incorrect removal (CP-03).

**formatter-patterns.md — Effects section:** Added `accentColor` color picker as the first control in the `<form section-label="Effects">` block, before `showAmbientLight`. Template includes 8 `<splunk-color>` swatches using `#FILL_*` placeholders populated from theme.js DARK palette at generation time. Updated the Effects section description bullet to state that accentColor is FIRST in Effects and is ONLY used inside `withAlpha()`.

File stays at 443 lines — within the 460-line limit.

### Task 2 — design-principles.md DPR-03b (269945f)

Two additions to DPR-03b:

**Rule line updated:** Added `(or accentColor from the Effects formatter, read via opt('accentColor', t.accent))` to the rule so the formatter override path is explicitly named alongside `t.accent`.

**"Accent IS appropriate for" list extended:** Added new bullet:
> accentColor from Effects formatter — read via `opt('accentColor', t.accent)` then `hexFromSplunk()`; this value overrides `t.accent` as the glow/highlight color when set in the Format panel

File stays at 252 lines — within the 260-line limit.

## Verification Results

| Check | Result |
|-------|--------|
| `#6B7080` in theme-template.md LIGHT.textFaint | PASS |
| `#8A8FA0` NOT in theme-template.md | PASS |
| `accentColor` appears 3 times in formatter-patterns.md | PASS |
| `removed in Phase 18` NOT in formatter-patterns.md | PASS |
| `accentColor` appears 2 times in design-principles.md DPR-03b | PASS |
| formatter-patterns.md line count <= 460 | PASS (443) |
| design-principles.md line count <= 260 | PASS (252) |

## Success Criteria Verification

1. **Formatter placement** — A Claude executor reading formatter-patterns.md will place accentColor in Effects (not Color and style), with 8-swatch template and help text "Glow and highlight overlay color — used only in withAlpha()". PASS.

2. **Design principles read pattern** — A Claude executor reading DPR-03b now sees `opt('accentColor', t.accent)` then `hexFromSplunk()` as the correct read pattern; the rule text names withAlpha() exclusively. PASS.

3. **Light theme WCAG** — A Claude executor generating theme.js for a light theme will produce `textFaint: '#6B7080'` which passes WCAG AA 3:1+ on `#F0F2F5` background. PASS.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The `#FILL_ACCENT`, `#FILL_S1`...`#FILL_S5`, `#FILL_BG`, `#FILL_PANEL` placeholders in the accentColor picker template are intentional instruction-time placeholders. They are not rendered stubs — they appear inside a skill reference file (not runtime code). The instruction text directs Claude to populate them from the theme.js DARK palette at generation time. This is the established `{{PLACEHOLDER}}` pattern for all formatter templates in this skill.

## Threat Flags

None — all changes are doc-only modifications to skill reference files. No new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` — modified, contains `#6B7080`
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — modified, contains `accentColor` (3 hits)
- `plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md` — modified, contains `accentColor` (2 hits)
- Commits e5fc2a2 and 269945f exist in git log
