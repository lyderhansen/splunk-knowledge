---
phase: 13-accent-architecture-foundation
plan: "01"
subsystem: splunk-viz-packs skill layer
tags: [accent-architecture, series-colors, design-principles, theme-template, formatter-patterns]
dependency_graph:
  requires: []
  provides: [ACC-01, ACC-02, ACC-03, DPR-03b]
  affects:
    - plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
tech_stack:
  added: []
  patterns:
    - getSeriesColor(i, t) indexed series color lookup with wrap-around
    - series[] array in theme objects (DARK and LIGHT) for brand-derived palette access
    - 60/30/10 accent/series/neutral color weight rule
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
decisions:
  - "series[] array reuses existing s1-s5 tokens grouped for indexed access — avoids introducing new token names"
  - "getSeriesColor falls back to [t.s1..t.s5] when t.series is missing — backward-compatible with existing theme.js instances"
  - "accentIntensity renamed from strength to multiplier semantically — no default value change (stays 50)"
metrics:
  duration: "144s"
  completed: "2026-05-18T13:33:55Z"
  tasks_completed: 3
  files_modified: 3
---

# Phase 13 Plan 01: Accent Architecture Foundation Summary

Establish the accent/series color separation model across three reference files: design-principles.md (DPR-03b rule), theme-template.md (series[] array and getSeriesColor helper), formatter-patterns.md (uncapped accentIntensity multiplier).

## What Was Built

Codified the accent-as-highlight-only color model that downstream viz generation will follow. Data fills now have a dedicated indexed palette (`t.series[i]`), accent is restricted to hover/glow/threshold roles, and the `accentIntensity` formatter control is documented as an uncapped multiplier (values above 100 supported).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add DPR-03b to design-principles.md | aad379d | plugins/splunk-viz-packs/skills/vp-design/references/design-principles.md |
| 2 | Add series[] and getSeriesColor() to theme-template.md | d97d8ef | plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md |
| 3 | Uncap accentIntensity in formatter-patterns.md | efcbb3f | plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md |

## Changes Detail

### Task 1: DPR-03b Rule (design-principles.md)

Added `### DPR-03b: Accent vs series color separation` subsection immediately after DPR-03, before DPR-04. The rule:
- `t.accent` is the HIGHLIGHT color — one per frame max
- Data series fills use `t.series[i]`, never `t.accent`
- 60/30/10 breakdown: neutrals / series fills / accent highlights
- Lists accent-appropriate and accent-inappropriate use cases
- Updated DPR-03 minimum implementation to use `theme.getSeriesColor(seriesIndex, t)` for gradient fills
- Updated quick reference table to include DPR-03b row

### Task 2: series[] Array + getSeriesColor() (theme-template.md)

- Added `series: ['{{DARK_S1}}', '{{DARK_S2}}', '{{DARK_S3}}', '{{DARK_S4}}', '{{DARK_S5}}']` to DARK object
- Added `series: ['{{PLACEHOLDER}}', ...]` to LIGHT object (brand-specific, Claude fills per brief)
- Added `getSeriesColor(i, t)` function: wrap-around via `i % s.length`, alpha fade for overflow series (pass 1+: alpha = max(0.3, 1.0 - pass*0.4))
- Fallback to `[t.s1..t.s5]` when t.series missing (backward compatible)
- Exported `getSeriesColor` in module.exports
- All code is pure ES5 (no const/let/arrow/template literals)

### Task 3: Uncapped accentIntensity (formatter-patterns.md)

Changed help text in both the template block (line ~54) and full formatter example (line ~258) from:
- Before: `"Glow and shadow strength (0=off, 100=full)"`
- After: `"Highlight glow multiplier (0=off, 50=default, 100+=extreme). Values above 100 amplify glow beyond the standard range."`

Default `value="50"` preserved unchanged. "series colors" already present in "Color and style" section description at both occurrences.

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| DPR-03b occurrences in design-principles.md | >=2 | 5 | PASS |
| getSeriesColor occurrences in theme-template.md | >=3 | 3 | PASS |
| multiplier occurrences in formatter-patterns.md | >=2 | 3 | PASS |
| const/let in theme-template.md code | 0 | 0 | PASS |
| series: array entries in theme-template.md | >=2 | 2 | PASS |
| 100+=extreme occurrences in formatter-patterns.md | >=2 | 2 | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The automated verify for getSeriesColor expected 3+ occurrences. The plan's action block included a usage comment (`// Usage: var color = getSeriesColor(barIndex, t);`) that satisfies this — added alongside the function declaration comment as specified implicitly by the plan's intent.

## Known Stubs

The `series[]` arrays in both theme objects use `{{PLACEHOLDER}}` / `{{DARK_S1}}` etc. tokens — this is intentional. These are template placeholders that Claude fills per brand brief during vp-design, not functional stubs. The actual hex values are supplied at viz generation time.

## Threat Flags

None — all changes are in developer-authored reference/template files. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check: PASSED

- `aad379d` exists: confirmed
- `d97d8ef` exists: confirmed
- `efcbb3f` exists: confirmed
- DPR-03b in design-principles.md: confirmed (5 occurrences)
- getSeriesColor in theme-template.md: confirmed (3 occurrences)
- multiplier in formatter-patterns.md: confirmed (3 occurrences)
