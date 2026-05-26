---
phase: 25-backgrounds-preview-assets
plan: "02"
subsystem: generate_assets / validate_viz / vp-create
tags: [preview-dimensions, domain-symbols, appicon, silhouette, validator]
dependency_graph:
  requires:
    - 25-01
  provides:
    - preview.png at 116x76 (official Splunk spec) with 2-color fills
    - DOMAIN_SYMBOLS table + matchDomain() + drawSymbol() / drawSymbol2x() in generate_assets.js
    - generateAppIcon() 3-tier cascade: domain keyword -> viz-type annotation -> letter fallback
    - validate_viz.sh A02 check updated from 300x200 to 116x76
    - vp-create/SKILL.md checklist updated to 116x76 preview dimensions
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
tech_stack:
  added: []
  patterns:
    - Secondary color derivation: prefer dark.s1/dark.series[0], fallback to computed shift from accent
    - Alternating accent/secondary colors in bars, grid, timeline, scatter, network silhouettes
    - DOMAIN_SYMBOLS lookup + matchDomain() keyword cascade for app basename
    - drawSymbol() / drawSymbol2x() pixel-art symbol library (15 domains, 1x + 2x variants)
    - 3-tier appIcon cascade: domain keyword -> @viz-type annotation -> letter fallback
    - TDD RED (test commit 6c8a408) -> GREEN (implementation commit 1a38b6b)
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
decisions:
  - "T9 preview.png size threshold reduced from >500 to >100 bytes — 116x76 silhouette PNGs at deflate level 6 compress to ~276 bytes, well under the old 300x200 threshold of 500"
  - "T17 domain symbol comparison uses full file diff (not byte-slice) — at compression level 0 (store mode) used for 36x36 icons, symbol vs letter pixel differences first appear at byte 958+, outside a 200-byte slice"
  - "Both generate_assets.js copies are byte-identical — vp-create is a full copy (not a delegate) while validate_viz.sh in vp-create is a thin delegate to the vp-viz canonical"
  - "drawSymbol2x() is a standalone function (not a scale wrapper) to stay within ES5 CJS pure style — no const/let/arrow functions"
metrics:
  duration: "~11 minutes"
  completed: "2026-05-20T21:14:00Z"
  tasks_completed: 2
  files_modified: 5
---

# Phase 25 Plan 02: Preview 116x76 Resize and Domain Symbol AppIcon Summary

Preview.png resized to 116x76 (official Splunk spec) with 2-color fills; appIcon now shows domain-specific pixel-art symbols for 15 industry verticals via keyword cascade; validator A02 check updated atomically.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Resize silhouettes to 116x76, add secondary color, add DOMAIN_SYMBOLS cascade | 6c8a408 (RED), 1a38b6b (GREEN) | generate_assets.js x2, test_generate_assets.js |
| 2 | Update validate_viz.sh A02 check; update vp-create SKILL.md checklist | dbc6c90 | validate_viz.sh, SKILL.md |

## What Was Built

### Task 1 — Preview resize + domain symbol cascade

**Preview dimensions (116x76):**
- All 10 drawXxxSilhouette() functions rescaled from 300x200 to 116x76 using SCALE_X=116/300≈0.387, SCALE_Y=76/200=0.38
- Coordinates pre-computed and hard-coded per plan; `Math.max(1, ...)` guards prevent zero-width/height fills
- generatePreviews(): W=116, H=76; compressLevel=6 (>72px threshold); produces 276-byte KPI preview

**Secondary color fills:**
- generatePreviews() derives secondary color s1r/s1g/s1b: first prefers `dark.series[0]` or `dark.s1` hex, falls back to computed accent shift (multiply by 0.7, add 80/80/0 bias)
- Silhouettes using alternating colors: bars (even=accent, odd=s1), grid (even=accent, odd=s1), timeline (even=accent, odd=s1), scatter (alternating per point), network (hub=accent, spokes=s1)
- gauge: arc in accent, center stub and needle in variant colors; kpi: main rect in accent, label bars and side accents in s1

**Domain symbol cascade:**
- `DOMAIN_SYMBOLS`: 15-domain lookup table with keyword arrays for healthcare, security, network, automotive, energy, finance, retail, aviation, education, tech, music, sports, food, travel, manufacturing
- `matchDomain(baseName)`: iterates DOMAIN_SYMBOLS, lowercases baseName, returns first matching domain or null
- `drawSymbol(rows, symbolName, ox, oy, r, g, b)`: pixel-art icons in 28x28 area using fillRect() only; all 15 symbols implemented
- `drawSymbol2x(rows, symbolName, ox, oy, r, g, b)`: double-size variant for 72x72 appIcon_2x (56x56 drawing area)
- `generateAppIcon()`: 3-tier cascade: (1) matchDomain() on basename, (2) @viz-type annotation -> VIZ_TO_DOMAIN map, (3) letter fallback (existing behavior)

**Test suite (34 tests pass):**
- T8: asserts preview.png width=116, height=76
- T9: threshold updated to >100 bytes (correct for 116x76 at deflate level 6)
- T17: creates `test_soc_security_viz` (security keyword match) and `zzz_nomatch_viz` (letter fallback), compares full PNG files — differ at byte 958+

### Task 2 — Validator and SKILL.md sync

- `validate_viz.sh` line 195: condition `W -ne 300 || H -ne 200` changed to `W -ne 116 || H -ne 76`; error message updated from "need 300x200" to "need 116x76"
- `vp-create/SKILL.md` Step 3b description: `(300x200)` changed to `(116x76)`
- `vp-create/SKILL.md` packaging checklist: `preview.png at 300x200, >500 bytes` changed to `116x76, >100 bytes`
- `vp-create/scripts/validate_viz.sh` is a thin delegate to vp-viz canonical — no change needed there

## Test Results

```
=== Results: 34 passed, 0 failed ===
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T9 size threshold wrong for 116x76**
- **Found during:** Task 1 GREEN phase
- **Issue:** T9 asserted `preview.png size > 500` — valid for 300x200 PNG at ~8KB, but 116x76 with deflate level 6 compresses to ~276 bytes for sparse silhouette data
- **Fix:** T9 threshold reduced to `> 100 bytes` — a 116x76 PNG with real silhouette data is always well above 100 bytes
- **Files modified:** `test_generate_assets.js`
- **Commit:** 1a38b6b

**2. [Rule 1 - Bug] T17 comparison slice too narrow for store-mode icons**
- **Found during:** Task 1 GREEN phase
- **Issue:** T17 compared `bufSec.slice(33, 233)` (200 bytes) — but 36x36 icons use compression level 0 (store mode), so symbol vs letter pixel differences first appear at byte 958+ (after several rows of identical accent-color background)
- **Fix:** Changed comparison to `!bufSec.equals(bufNom)` — full file diff, guaranteed to catch any pixel difference
- **Files modified:** `test_generate_assets.js`
- **Commit:** 1a38b6b

## Known Stubs

None — all generators produce real pixel data. The DOMAIN_SYMBOLS table uses keyword matching that may produce false positives on edge cases (e.g., "network_kpi_viz" would match "network" domain), but this is cosmetic-only behavior with no data security implications (confirmed by T-25-03 threat disposition: accept).

## Threat Flags

No new security surface introduced. DOMAIN_SYMBOLS keyword match uses `baseName.toLowerCase().indexOf()` — string operations only, no filesystem access on the input.

## Self-Check: PASSED

All key files exist:
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
- FOUND: plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js (byte-identical to canonical)
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
- FOUND: plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
- FOUND: plugins/splunk-viz-packs/skills/vp-create/SKILL.md

Commits verified:
- 6c8a408: test(25-02): add failing tests (RED)
- 1a38b6b: feat(25-02): resize silhouettes and domain symbol cascade (GREEN)
- dbc6c90: feat(25-02): update A02 validator and SKILL.md
