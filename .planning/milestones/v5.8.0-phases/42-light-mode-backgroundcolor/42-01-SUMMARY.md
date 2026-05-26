---
phase: 42-light-mode-backgroundcolor
plan: 01
subsystem: splunk-viz-packs/references
tags:
  - light-mode
  - backgroundcolor
  - templates
  - documentation
  - THM-05
requirements:
  - LM-01
  - LM-02
dependency-graph:
  requires: []
  provides:
    - THM-05 rule reachable on every vp-viz code-gen path (Classic + Extension API)
    - Cross-referenced doc graph across the four vp-viz reference files
    - Plugin version 5.9.1 ready for push to main
  affects:
    - Future /vp-init / vp-create generations (Classic .tar.gz and Extension API .spl)
tech-stack:
  added: []
  patterns:
    - "THM-05: unconditional opt('backgroundColor') read AFTER var t = theme.getTheme(...), wrapped in hexFromSplunk() per B22, used in BOTH light and dark paint paths"
    - "Extension API equivalent: read opts.backgroundColor once at render start, never re-derive from state.theme inside addThemeListener callback"
key-files:
  created:
    - .planning/phases/42-light-mode-backgroundcolor/42-01-SUMMARY.md
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md
    - plugins/splunk-viz-packs/.claude-plugin/plugin.json
decisions:
  - "Honored CONTEXT D-01 four-file edit pattern (theme-template, pre-code-checklist, visualization-js-template, config-json-template)"
  - "Honored CONTEXT D-02 functional rule: unconditional opt() read AFTER var t, used in BOTH render paths"
  - "Honored CONTEXT D-03: no check_design.js validator rule added — deferred as D12 backlog item"
  - "Honored CONTEXT D-04: no test pack retrofit; templates only"
  - "Honored CONTEXT D-05: Extension API gets one-paragraph rule + live var bg line, no WRONG/RIGHT block (Classic-only)"
  - "Honored CONTEXT D-06 + memory feedback_plugin_version_bump.md: patch bump 5.9.0 -> 5.9.1"
  - "Honored prior_decision B22: hexFromSplunk() wraps every color picker opt() read across Classic AND Extension API"
metrics:
  duration_seconds: 248
  duration_minutes: 4.1
  tasks_completed: 5
  files_modified: 5
  commits: 5
  completed_date: 2026-05-24
---

# Phase 42 Plan 01: Light Mode backgroundColor Template Fix Summary

Documentation-only fix landing the THM-05 unconditional-bg-read pattern across four `splunk-viz-packs/skills/vp-viz/references/` files (Classic + Extension API) and bumping plugin.json to 5.9.1 — closes LM-01 and LM-02 by preventing the 2026-05-22 Tesla FSD light-mode failure mode in all future Claude-generated viz code.

## What Was Built

Five additive, surgical edits across the splunk-viz-packs reference doc graph:

1. **theme-template.md** — New H2 section `## Background Color (THM-05): user opt() overrides theme default in both modes` appended after the THM-04 inner-shadow block. Includes a 2-paragraph rule statement + a single ES5 fenced block with the WRONG / RIGHT contrast (WRONG = opt() trapped inside `if (isDark)` with `t.panel` leaking in the else branch — the Tesla FSD failure mode; RIGHT = unconditional `var bg = hexFromSplunk(opt('backgroundColor', t.bg), t.bg);` AFTER `var t`, with the same `bg` variable feeding the fillRect in both light and dark paths). Cross-references to pre-code-checklist.md THM-05 line and to both Extension API note files.

2. **pre-code-checklist.md** — One new checklist line inserted into the JS light theme cluster, immediately after the THM-04 inner-shadow line: `□ JS: backgroundColor read unconditionally — var bg = hexFromSplunk(opt('backgroundColor', t.bg), t.bg); — rendering uses bg in BOTH isDark paths, never t.bg/t.panel directly (THM-05/LM-01)`. Dual-tagged THM-05/LM-01 for theme-family + requirement-ID traceability. File line count 95 → 96.

3. **visualization-js-template.md** (Extension API) — One-line THM-05 pointer comment naming `config-json-template.md` as the full-rule source + Classic equivalent, immediately followed by the live code line `var bg = hexFromSplunk(opts.backgroundColor, t.bg);` inside the render() option-reads cluster. Uses the existing `opts` alias from line 146 and honors B22's hexFromSplunk wrapper. No WRONG/RIGHT block here per CONTEXT D-05.

4. **config-json-template.md** (Extension API) — New H2 section `## Background Color Note (THM-05)` appended after the existing `## Reading Options in visualization.js` block (sibling H2, NOT H3). Contains the single-paragraph Extension API rule covering the three required facts: (a) read `state.options.backgroundColor` once at the top of `render()` wrapped in `hexFromSplunk()` per B22; (b) use the single `bg` variable as the fill in every paint call; (c) do NOT re-derive bg from `state.theme` inside the `addThemeListener` callback. Cross-reference to theme-template.md THM-05 + pre-code-checklist.md THM-05.

5. **plugin.json** — Version field bumped 5.9.0 → 5.9.1 (patch). All other fields untouched. Valid JSON preserved.

## Lines Added (rough count)

| File | Lines added |
|---|---|
| theme-template.md | 26 |
| pre-code-checklist.md | 1 |
| visualization-js-template.md | 3 |
| config-json-template.md | 8 |
| plugin.json | 1 line changed (no net add) |

## THM-05 Cross-Reference Graph

```
                  pre-code-checklist.md
                          | (eagerly loaded; gates code-gen)
                          | THM-05/LM-01 line
                          v
                  theme-template.md (Classic source-of-truth)
                  THM-05 section: WRONG/RIGHT contrast
                          ^                              ^
                          |                              |
       (Classic equiv) -> |                              | <- (Classic equiv)
                          |                              |
                  config-json-template.md  <----  visualization-js-template.md
                  H2 "Background Color Note          THM-05 pointer comment + live
                      (THM-05)"                       var bg = hexFromSplunk(...) line
                  (Extension API rule source)
```

Wire confirmation (verified via grep at end-to-end check):
- pre-code-checklist.md → references THM-05 + tag matches theme-template.md heading
- theme-template.md → "See also: pre-code-checklist.md THM-05 line; visualization-js-template.md / config-json-template.md for the Extension API equivalent."
- visualization-js-template.md → comment names "config-json-template.md" and "theme-template.md THM-05"
- config-json-template.md → "Classic equivalent: theme-template.md THM-05 (WRONG/RIGHT contrast block) + pre-code-checklist.md THM-05 line."

All four files cross-reference each other; future Claude reading any one entry-point will be steered to the appropriate sibling.

## Commits

| Task | Type | Hash | Message |
|---|---|---|---|
| 1 | docs | 65e061c3 | docs(42-01): add THM-05 backgroundColor section to theme-template.md |
| 2 | docs | 1d96532e | docs(42-01): add THM-05 backgroundColor checklist gate to pre-code-checklist.md |
| 3 | docs | d3414377 | docs(42-01): add THM-05 bg read + pointer to visualization-js-template.md |
| 4 | docs | 55422655 | docs(42-01): add Background Color Note (THM-05) H2 to config-json-template.md |
| 5 | chore | e7c74411 | chore(42-01): bump splunk-viz-packs plugin.json 5.9.0 -> 5.9.1 |

## Requirement Coverage

- **LM-01** (covered) — The unconditional-read pattern is documented in all four reference files so future Claude-generated viz code (Classic AND Extension API) reads `opt('backgroundColor')` (Classic) / `opts.backgroundColor` (Extension API) unconditionally — wrapped in `hexFromSplunk()` per B22 — and uses the result in both light and dark render paths.
- **LM-02** (covered) — The correct pattern is documented in theme-template.md (with WRONG/RIGHT contrast block) AND pre-code-checklist.md (with one-line gate). Additionally documented in visualization-js-template.md + config-json-template.md per CONTEXT D-01.

LM-01 and LM-02 are **doc-only** addressed; no code generation triggered, no test pack modified, no validator rule added (CONTEXT D-03 + D-04 respected).

## Plugin Version Delta

`splunk-viz-packs` plugin: **5.9.0 → 5.9.1** (patch bump per CONTEXT D-06 and memory `feedback_plugin_version_bump.md`).

## Verification Results

End-to-end checks from the PLAN `<verification>` block (all 8 passed):

1. THM-05 present in both Classic reference files: PASS (theme-template.md + pre-code-checklist.md)
2. THM-05 reachable via Extension API path: PASS (visualization-js-template.md + config-json-template.md)
3. Plugin version is 5.9.1: PASS
4. THM-05 mention count per file ≥ 1: PASS (2, 1, 2, 1)
5. RIGHT pattern lifted into theme-template.md (Classic syntax): PASS
6. Extension API uses opts alias + hexFromSplunk wrapper (B22 honored): PASS
7. config-json-template.md heading is H2 (sibling level, not H3): PASS
8. Cross-references wire correctly between all four files: PASS

All `<acceptance_criteria>` checks per task also passed (verified individually during execution).

## Deviations from Plan

None — plan executed exactly as written. Task 1 used a single Edit anchored on the THM-04 fenced block end to append the new section after line 234 (the closing ``` fence of the existing THM-04 block). All other tasks used surgical single-anchor Edits matching the plan's prescribed insertion points.

Note: PLAN Task 1's range-scoped `awk` acceptance check is a known shell-pattern quirk (a `/X/,/X/` range matches start and end on the same line when the start line also matches the end pattern), so the `awk` check returned 0 even though the WRONG `if (isDark)` content is present in the new THM-05 section. A `sed`-based line-range check confirmed the substantive truth (2 occurrences of `if (isDark)` inside the THM-05 block, both `WRONG` and `RIGHT` labels present). All other acceptance criteria for Task 1 passed cleanly. Documented here as a verification-tool note, not a content deviation.

## Authentication Gates

None. No auth required for documentation edits or version bump.

## Known Stubs

None — this plan is doc-only and produces no UI stubs or empty-data render paths.

## Threat Flags

None — no new code paths, no new attack surface. Documentation-only edits to fenced markdown.

## Deferred Items (for backlog)

- **D12 validator rule** in `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js`: grep generated `visualization_source.js` for `if\s*\(\s*isDark\s*\).*opt\(\s*['"]backgroundColor` and FAIL validation when found. Belongs in a follow-up phase per CONTEXT D-03.
- **Retrofit Tesla FSD / older test packs** to demonstrate the fix end-to-end (CONTEXT D-04 explicitly defers this).
- **Extension API live test** — once v6.0 packs are built, confirm `addThemeListener` callback doesn't replace `options.backgroundColor`. Phase 43 (Deep Review) check item per CONTEXT `<deferred>`.

## Self-Check

Files created:
- FOUND: .planning/phases/42-light-mode-backgroundcolor/42-01-SUMMARY.md (this file)

Files modified:
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/references/config-json-template.md
- FOUND: plugins/splunk-viz-packs/.claude-plugin/plugin.json

Commits:
- FOUND: 65e061c3 (Task 1)
- FOUND: 1d96532e (Task 2)
- FOUND: d3414377 (Task 3)
- FOUND: 55422655 (Task 4)
- FOUND: e7c74411 (Task 5)

## Self-Check: PASSED
