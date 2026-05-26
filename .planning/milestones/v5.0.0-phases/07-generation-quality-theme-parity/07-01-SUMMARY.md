---
plan: "07-01"
phase: 07-generation-quality-theme-parity
status: complete
started: 2026-05-16
completed: 2026-05-16
---

## Summary

Expanded all viz-blueprints.md Settings lists to 10-14 context-aware formatter options per viz type (universal trio: themeMode, accentColor, accentIntensity) and added the Line Chart blueprint entry.

## What Was Done

### Task 1: Add universal trio to all Settings lists
- All 15 existing viz types now include `accentIntensity` in their Settings lines
- Status Chip expanded from 3 to 9 options
- Live Ticker: removed bgColor/textColor (DS panel controls), added accentIntensity
- All viz types at 10-14 formatter option target

### Task 2: Add Line Chart blueprint entry (CFG-03)
- Inserted between Spark Strip and Radar/Spider Chart
- 12 Settings options: lineField, xField, lineColor, showFill, showDots, lineWidth, unit, thresholdValue, thresholdColor, themeMode, accentColor, accentIntensity
- DPR cross-references: DPR-01, DPR-03, DPR-10
- Data contract: time-series rows with configurable xField and lineField

## Self-Check: PASSED

- [x] `grep -c 'accentIntensity' viz-blueprints.md` → 16 (all 16 viz types)
- [x] `grep 'Line Chart' viz-blueprints.md` → heading at line 217
- [x] Ring Gauge unchanged (still has zone controls)
- [x] File at 365 lines (under 500 limit)

## Key Files

### key-files.created
- plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md

## Deviations

Worktree merge failure: original executor commits landed on orphaned worktree branch. Recovered via cherry-pick (accentIntensity) + manual edit (Line Chart entry).
