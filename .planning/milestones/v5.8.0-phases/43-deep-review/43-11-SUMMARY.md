---
phase: 43-deep-review
plan: 11
subsystem: splunk-dashboard-studio
tags: [ds-create, ds-ref-layout-grid, ds-ref-archetypes, ds-int-tabs, ds-int-tokens, ds-ref-jsonata, ds-ref-syntax, schema-fix, drilldown, tabs]
dependency_graph:
  requires: []
  provides:
    - ds-create eventHandlers drilldown generation (not deprecated options.drilldown)
    - ds-ref-layout-grid correct tabs schema (object + items + layoutDefinitions as object)
    - ds-ref-archetypes 1920x1080 minimum canvas for all archetypes
    - ds-int-tokens clarified form. prefix usage
  affects:
    - plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md
tech_stack:
  added: []
  patterns:
    - eventHandlers array drilldown format (replaces deprecated options.drilldown)
    - tabs as object with items array and object layoutDefinitions (correct DS schema)
key_files:
  created: []
  modified:
    - plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md
    - plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md
decisions:
  - ds-create drilldown section updated to use eventHandlers array with options.drilldown enable pattern
  - ds-ref-layout-grid tabs schema replaced — tabs is object with items array, layoutDefinitions is object keyed by layoutId
  - All archetype canvas sizes updated to 1920x1080 minimum to match ds-ref-layout-grid authoritative rule
metrics:
  duration: ~15min
  completed: "2026-05-25"
  tasks_completed: 2
  files_modified: 7
---

# Phase 43 Plan 11: ds-* Schema/Format Fixes Summary

Cluster D dashboard-studio skill corrections — eventHandlers drilldown format, tabs schema object shape, canvas size consistency, stale scaffold removal, and NIT cross-references.

## What was built

Seven `splunk-dashboard-studio` SKILL.md files corrected across two tasks:

- **Task 1 (35f79829):** ds-create + ds-ref-layout-grid — BLOCKERs B-18 and B-19
- **Task 2 (2f6eb365):** ds-ref-archetypes + ds-int-tabs + ds-int-tokens + ds-ref-jsonata + ds-ref-syntax — WARNINGs W-26/W-27/W-28/W-30 + NITs N-22/N-23/N-24

## Changes by file

### ds-create/SKILL.md (B-18)

"Panel drilldowns" section replaced deprecated `options.drilldown = "all"` + `options.drilldownAction` generation instruction with the current `eventHandlers` array format. The new section:

1. Shows `options.drilldown: "all"` used correctly as a click-enable flag (not as a routing mechanism)
2. Documents the `eventHandlers` array with a `drilldown.linkToDashboard` example
3. Explains the four action types (`setToken`, `linkToSearch`, `linkToDashboard`, `customUrl`)
4. Adds a deprecated note: "Legacy `options.drilldown` / `options.drilldownAction` are deprecated — use `eventHandlers` array (see `ds-int-drilldowns`)"

### ds-ref-layout-grid/SKILL.md (B-19, W-28)

1. Removed stale `> **Status:** skeleton only.` marker
2. Removed "Source / migration" and "Estimated size" scaffold sections
3. Replaced "Required wrapper structure" example — wrong format (tabs as bare array, layoutDefinitions as array with id fields) → correct format (tabs as object with items array, layoutDefinitions as object keyed by layoutId, showTabBar inside tabs.options)
4. Added clarifying note explaining the five key differences from the deprecated format
5. Fixed two `layoutDefinitions[n]` abbreviated notes to use `layoutDefinitions["layout_key"]` form

### ds-ref-archetypes/SKILL.md (W-26, W-27)

1. Removed stale `> **Status:** skeleton only.` marker
2. Removed "Source / migration" and "Estimated size" scaffold sections
3. Updated Scope section: "1440×960 exec" → "1920×1080 minimum all archetypes"
4. Updated Executive Summary: "Canvas: 1440×960" → "Canvas: 1920×1080 minimum" with cross-reference to ds-ref-layout-grid §Canvas Sizes
5. Updated Operational Monitoring: removed "or 1440×960 (laptop check-in)" variant
6. Updated Analytical deep-dive: "1440×960 or wider" → "1920×1080 minimum, often scrollable vertically"

### ds-int-tabs/SKILL.md (N-22)

Added "See also" cross-reference in the token-driven tab switching section: "See also: `ds-ref-jsonata` for token expression syntax; `ds-int-tokens` for token binding patterns."

### ds-int-tokens/SKILL.md (W-30)

Updated "URL parameters" entry in "5 places tokens come from" section. Old text said `form.<name>` URL params. New text clarifies: "No `form.` prefix in Dashboard Studio token names — the `form.` prefix is Classic/Simple XML syntax, not used in DS token names."

### ds-ref-jsonata/SKILL.md (N-23)

Added confidence tier note below Higher-order functions table + Lambda syntax section: `$map`/`$filter`/`$reduce` are [Standard JSONata] and not individually confirmed against a live DS instance. Advises testing before relying on lambda expressions in production.

### ds-ref-syntax/SKILL.md (N-24)

Added warning note above flat Grid (row-oriented) layout example: "This flat format is shown for reference only. Per `ds-int-tabs`, ALL Dashboard Studio layouts (including grid) must be wrapped in `tabs` + `layoutDefinitions`. The flat format is rejected by the current schema validator."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Context] ds-ref-archetypes: all canvas references updated (not just Executive Summary)**
- **Found during:** Task 2
- **Issue:** Plan specified updating only the Executive Summary canvas from "1440×960" to "1920×1080 minimum". However, two other archetypes (Operational Monitoring and Analytical deep-dive) also contained "1440×960" references that would conflict with the authoritative 1920px minimum rule.
- **Fix:** Updated all three canvas references to "1920×1080 minimum" for full consistency with ds-ref-layout-grid §Canvas Sizes.
- **Files modified:** `plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md`
- **Commit:** 2f6eb365

**2. [Rule 1 - Bug] ds-ref-layout-grid: layoutDefinitions[n] array notation fixed in two places**
- **Found during:** Task 1
- **Issue:** The abbreviated note after the Required Wrapper Structure example and the canvas size example both said `layoutDefinitions[n]` or `layoutDefinitions[0]` — the old array-index notation. These were inconsistent with the newly corrected object-keyed format.
- **Fix:** Updated both to use `layoutDefinitions["layout_key"]` / `layoutDefinitions["layout_main"]` notation.
- **Files modified:** `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md`
- **Commit:** 35f79829

No auth gates encountered. No test files modified.

## Known Stubs

None — all changes are authoritative documentation corrections, not placeholder content.

## Threat Flags

None — this plan edits documentation/skill files only. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced.

## Self-Check: PASSED
