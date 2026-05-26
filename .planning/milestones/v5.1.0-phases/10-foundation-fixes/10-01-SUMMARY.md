---
phase: 10-foundation-fixes
plan: "01"
subsystem: splunk-viz-packs/vp-viz
tags: [getOption, config-lookup, formatter, check_design, D08]
dependency_graph:
  requires: []
  provides: [getOption-template, D08-getOption-regex]
  affects: [plugins/splunk-viz-packs/skills/vp-viz/SKILL.md, plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js]
tech_stack:
  added: []
  patterns: [two-path-getOption-config-lookup, D08-reverse-regex-extension]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
decisions:
  - "Keep opt() wrapper in updateView template — delegates to getOption() so existing call sites (opt('themeMode'), opt('accentIntensity'), etc.) remain unchanged while gaining short-key fallback"
  - "getOption placed before module.exports as a top-level function — accessible from updateView without closure capture issues"
  - "D08 reverse regex uses non-capturing group for optional config/ns prefix args so both opt('key') and getOption(config,ns,'key') match with a single pattern"
metrics:
  duration: "~5 min"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 2
---

# Phase 10 Plan 01: getOption Two-Path Config Lookup — SUMMARY

**One-liner:** Replaced broken single-path opt() with two-path getOption() in SKILL.md template and extended D08 regex to validate both call signatures.

## What was built

### Task 1 — SKILL.md source template (commit b1b640d)

The visualization_source.js template in SKILL.md previously used a single-path `opt()` helper that only read `config[ns + key]`. When a user changed a setting in the Format panel (short key path), the viz ignored it — a silent miss that is the root cause of FIX-01, FIX-04, and FIX-05.

Changes made:
- Replaced the `opt()` body in `updateView` with an inline safe namespace capture + delegation to `getOption()`
- Added `getOption()` as a top-level function (before `module.exports`) with two-path lookup: namespaced key first, then short key fallback
- Added `// Two-path config lookup` comment pointing to formatter-patterns.md
- Added `hexFromSplunk() wraps ALL color picker opt() reads` checklist item in the pre-code checklist

Result: SKILL.md is 478 lines (under 500 limit). The `opt()` convenience wrapper is preserved so existing call patterns (`opt('themeMode', 'auto')`, `opt('accentIntensity', '50')`, etc.) are backward-compatible — they now delegate to getOption() and gain the short-key fallback path.

### Task 2 — check_design.js D08 reverse regex (commit 1965993)

The D08 reverse check previously only matched `opt('key')` patterns. After the SKILL.md template update, generated vizs use `getOption(config, ns, 'key', ...)` — the old regex would miss all those calls, making D08 a dead check.

Changes made:
- Replaced `var optPattern = /opt\((['"])([^'"]+)\1\)/g;` with `var optPattern = /(?:opt|getOption)\((?:[^,]*,\s*[^,]*,\s*)?(['"])([^'"]+)\1/g;`
- The new regex matches both: `opt('key'`, `getOption(config, ns, 'key'`
- Updated `emitWarn` message to reference `opt/getOption` for clarity

File remains pure ES5 (no const/let/arrow). Node usage error still exits code 2.

## Verification results

```
function getOption in SKILL.md:    1  (pass)
getOption(config, ns, key in SKILL.md: 2  (pass)
config[ns + key] in getOption:     present (pass)
config[key] fallback in getOption: present (pass)
hexFromSplunk checklist item:      2  (pass, two occurrences — checklist + quick-rules)
SKILL.md line count:               478 lines (pass, < 500)
opt('themeMode') still present:    1  (pass — backward compat)
old single-path opt body:          0  (pass — removed)

getOption in check_design.js:      3  (pass, >= 2)
const/let/arrow in check_design:   0  (pass — pure ES5)
node usage exit code:              2  (pass)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan modifies skill instruction templates and a validator script. No UI stubs or placeholder data.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. The getOption function is a pure config-read helper with explicit defaultValue fallback — per threat register T-10-01, the mitigation is in place.

## Self-Check: PASSED

- plugins/splunk-viz-packs/skills/vp-viz/SKILL.md: present, 478 lines
- plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js: present, modified
- Commit b1b640d: feat(10-01): replace opt() with getOption() two-path lookup in SKILL.md template
- Commit 1965993: feat(10-01): update D08 reverse regex in check_design.js to match getOption() calls
