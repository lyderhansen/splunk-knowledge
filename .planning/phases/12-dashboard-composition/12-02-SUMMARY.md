---
phase: 12-dashboard-composition
plan: "02"
subsystem: vp-create / vp-viz / generate_assets
tags: [assets, png, gradient, dashboard-composition, build-pipeline]
completed: "2026-05-18"
duration: "~10 minutes"
tasks_completed: 2
tasks_total: 2

dependency_graph:
  requires:
    - "12-01 (dashboard-composition.md reference file)"
  provides:
    - "1920x1080 branded gradient background PNG at build time"
    - "vp-create packaging checklist includes gradient background verification"
  affects:
    - "plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js"
    - "plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js"
    - "plugins/splunk-viz-packs/skills/vp-create/SKILL.md"

tech_stack:
  added:
    - "makeGradientRows(): diagonal linear gradient + radial accent glow, pure ES5"
    - "generateGradientBg(): 1920x1080 PNG output to appserver/static/images/"
  patterns:
    - "Diagonal gradient t=(tx+ty)/2 interpolation"
    - "Quadratic radial glow falloff at max 8% blend"
    - "Canonical source (vp-viz) copied to vp-create — identical files"

key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md

decisions:
  - "Gradient endpoint uses dark.panel blended at 60% toward bg — if dark.panel absent, fallback to solid bg (no crash)"
  - "Glow radius 600px at 30% left / 20% top positions accent in the hero zone per design brief"
  - "Compression level 6 inherited from existing makePng() logic for images > 72x72"
  - "fs.mkdirSync with recursive:true creates appserver/static/images/ without requiring caller to pre-create it"

requirements:
  - DSH-01
---

# Phase 12 Plan 02: Gradient Background PNG Generation Summary

Gradient background PNG generation added to the viz pack asset pipeline using brand colors from shared/theme.js, producing 1920x1080 bg_gradient.png at build time.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add makeGradientRows + generateGradientBg to generate_assets.js | 58f9e1e | Done |
| 2 | Update vp-create SKILL.md packaging checklist | d2f0213 | Done |

## What Was Built

**Task 1 — generate_assets.js extended (both copies):**

Two new ES5 functions were added to the canonical source at `vp-viz/scripts/generate_assets.js`, then synced (copied) to `vp-create/scripts/generate_assets.js`:

- `makeGradientRows(w, h, topLeftRgb, bottomRightRgb, accentRgb, accentCx, accentCy, accentR)`: generates a diagonal linear gradient from top-left to bottom-right with a quadratic-falloff radial accent glow at (accentCx, accentCy). Returns rows in the same format as `makeRgbRows`. Pure ES5.

- `generateGradientBg(appDir, dark)`: reads brand colors from the dark theme object, computes gradient parameters (bg as start, panel blended 60% as endpoint, accent for glow at 30%/20% with r=600), calls `makeGradientRows`, encodes with `makePng`, and writes `appserver/static/images/bg_gradient.png`. Creates the `images/` directory with `mkdirSync({recursive:true})` if absent.

The `main()` function now calls `generateGradientBg(appDir, dark)` wrapped in its own try/catch block, consistent with the existing `generateAppIcon` and `generatePreviews` pattern.

**Task 2 — vp-create SKILL.md updated:**

Step 3b now lists `appserver/static/images/bg_gradient.png (1920x1080)` as a generated output. The packaging checklist now includes a gradient background verification item.

## Verification Results

All 12 automated checks passed:
- `makeGradientRows` and `generateGradientBg` present in both copies
- `bg_gradient.png` output path present in header and code
- 1920x1080 dimensions in both js and SKILL.md
- No ES5 violations in actual code (comment text false-positive excluded)
- Both copies identical (`diff` returns 0)
- `node -c` syntax check passes
- SKILL.md 144 lines (well under 500-line limit)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The functions are complete implementations. The `generateGradientBg` fallback (solid color when `dark.panel` is absent) is intentional defensive coding, not a stub.

## Threat Flags

None. Both accepted threats from the plan's threat model (T-12-02 memory, T-12-03 hex fallback) are addressed: 6MB in-memory gradient is well within Node.js heap, and `hexToRgb` already falls back to [128,128,128] for invalid hex values.

## Self-Check

### Files exist:
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js` — FOUND
- `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js` — FOUND
- `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` — FOUND

### Commits exist:
- `58f9e1e` — feat(12-02): add gradient background PNG generation to generate_assets.js — FOUND
- `d2f0213` — feat(12-02): update vp-create SKILL.md packaging checklist for gradient background — FOUND

## Self-Check: PASSED
