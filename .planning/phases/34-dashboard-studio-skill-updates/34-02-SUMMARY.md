---
phase: 34
plan: 02
subsystem: splunk-dashboard-studio-skills
tags: [skill-updates, ds-ref-syntax, ds-ref-pitfalls, ds-int-defaults, token-eval, drilldown]
dependency_graph:
  requires: []
  provides: [ds-ref-syntax-columnformat, ds-ref-pitfalls-emap, ds-int-defaults-expressions]
  affects: [ds-ref-syntax, ds-ref-pitfalls, ds-int-defaults]
tech_stack:
  added: []
  patterns: [pitfall-matrix-row, sibling-stanza-cross-reference]
key_files:
  created: []
  modified:
    - plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-pitfalls/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-defaults/SKILL.md
decisions:
  - "Added columnFormat.data note to ds-ref-syntax visualizations section — plain string triggers e.map error, must be DS expression starting with >"
  - "Added input.button to ds-ref-syntax inputs section with version availability note (Enterprise 10.2+ / Cloud 10.1.2507+)"
  - "Added 3 pitfall rows to ds-ref-pitfalls interactivity table covering e.map, linkToDashboard undefined, and JSONata vs SPL eval confusion"
  - "Added expressions sibling stanza note and eval auto-react note to ds-int-defaults schema shape section"
metrics:
  duration: "1 minute"
  completed: "2026-05-22"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 34 Plan 02: Dashboard Studio Skill Updates (Reference + Pitfalls) Summary

**One-liner:** Three Dashboard Studio reference skills updated with token eval, columnFormat.data, and e.map pitfall entries sourced from test40 live testing.

## Tasks Completed

| # | Task | Commit | Result |
|---|------|--------|--------|
| 1 | Update ds-ref-syntax with input.button and columnFormat.data | 93851f2f | 421 lines (under 500); both items confirmed present |
| 2 | Add 3 pitfall rows to ds-ref-pitfalls | 0c15d915 | 177 lines; all 3 symptoms confirmed present |
| 3 | Add expressions stanza and eval auto-react note to ds-int-defaults | ea124103 | 153 lines; both additions confirmed present |

## What Was Added

### ds-ref-syntax (417 → 421 lines)

1. **input.button** — Added one-line note after the CRITICAL `input.timerange.defaultValue` warning listing all 5 input types including `input.button` with version note (Enterprise 10.2+ / Cloud 10.1.2507+).

2. **columnFormat.data** — Added a one-line note immediately before `## inputs and tokens` noting that `columnFormat.data` must be a DS expression starting with `>` and that a plain string causes `e.map is not a function`. Cross-references `ds-ref-pitfalls`.

3. **expressions and containerOptions.visibility** — Verified both sections are already adequately documented (expressions at lines 212-247, containerOptions.visibility at lines 249-267). No changes needed.

### ds-ref-pitfalls (174 → 177 lines)

Three new rows added to the Interactivity bugs table:

- **`e.map is not a function`** — Two causes: tokens as object map (should be array) or columnFormat.data as plain string (must be DS expression). Points to `ds-int-drilldowns` and `ds-ref-syntax`.
- **linkToDashboard tokens arrive as `undefined`** — `key` reads from click context, `value` sets URL parameter; must use `value` for forwarded tokens. Points to `ds-int-drilldowns` key vs value.
- **JSONata vs SPL eval confusion** — DS eval uses JSONata (`&` for concat, `? :` for ternary, `$now()` for dates). Points to `ds-int-tokens` Token eval expressions.

### ds-int-defaults (149 → 153 lines)

1. **Expressions sibling stanza** — Added paragraph after the three top-level keys list explaining that `expressions` (top-level, same level as `defaults`) holds `expressions.eval` and `expressions.conditions`. Cross-references `ds-int-tokens` and `ds-int-visibility`.

2. **Eval auto-react note** — Added one sentence at the end of the Initialising tokens section: eval results re-evaluate automatically whenever dependency tokens change, no manual refresh needed.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all entries are complete references pointing to existing fix skills.

## Threat Flags

None — documentation files only; no code execution, network access, or user input processing.

## Self-Check: PASSED

- FOUND: plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md
- FOUND: plugins/splunk-dashboard-studio/skills/ds-ref-pitfalls/SKILL.md
- FOUND: plugins/splunk-dashboard-studio/skills/ds-int-defaults/SKILL.md
- FOUND: commit 93851f2f (Task 1 — ds-ref-syntax)
- FOUND: commit 0c15d915 (Task 2 — ds-ref-pitfalls)
- FOUND: commit ea124103 (Task 3 — ds-int-defaults)
