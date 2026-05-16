---
phase: "06"
plan: "01"
subsystem: "splunk-viz-packs/skills (vp-recipes, vp-viz)"
tags: [recipe-split, canvas-recipes, depth, texture, typography, animation, progressive-disclosure]
dependency_graph:
  requires: []
  provides:
    - "vp-recipes/references/depth-recipes.md"
    - "vp-recipes/references/texture-recipes.md"
    - "vp-recipes/references/typography-recipes.md"
    - "vp-recipes/references/animation-recipes.md"
    - "vp-viz/references/canvas-recipes.md (routing stub)"
  affects:
    - "vp-viz/references/canvas-recipes.md"
tech_stack:
  added: []
  patterns:
    - "Effect-category recipe split (depth/texture/typography/animation)"
    - "Routing stub pattern for oversized reference files"
    - "DO NOT LOAD Phase 9 guard header"
key_files:
  created:
    - "plugins/splunk-viz-packs/skills/vp-recipes/references/depth-recipes.md"
    - "plugins/splunk-viz-packs/skills/vp-recipes/references/texture-recipes.md"
    - "plugins/splunk-viz-packs/skills/vp-recipes/references/typography-recipes.md"
    - "plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md"
  modified:
    - "plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md"
decisions:
  - "Tinted neutrals content copied to texture-recipes.md but left in canvas-recipes.md (extraction = copy, per plan interfaces)"
  - "canvas-recipes.md retains all functional patterns (980 lines) rather than becoming a minimal stub — preserves all-patterns.md pointers"
metrics:
  duration: "8 minutes"
  completed: "2026-05-16"
---

# Phase 6 Plan 01: Recipe File Split Summary

Split canvas-recipes.md (1200 lines) into 4 focused effect-category files and routing stub.

## One-liner

Extracted depth/texture/typography/animation Canvas effects into 4 recipe files (246+167+155+190 lines) with DPR annotations and Phase 9 animation guard.

## Changes Made

### Task 1: depth-recipes.md and texture-recipes.md

Created two new recipe reference files in `vp-recipes/references/`:

**depth-recipes.md (246 lines):**
- drawAmbientLight (DPR-04) with radial gradient pattern
- drawVignette (DPR-05) with edge darkening
- drawGradientMesh (DPR-09) with multi-point radial gradients
- drawAccentLines (DPR-10) with geometric precision lines
- Gradient bar fill (DPR-03) with createLinearGradient example
- Drop shadow / neon glow (drawShadow, drawGlowText, drawScanlines, drawEdgeFade)
- Cross-references to design-principles.md and mood-recipes.md

**texture-recipes.md (167 lines):**
- drawNoiseTexture (DPR-07) with offscreen canvas caching pattern
- drawGlassPanel (DPR-06) with layered frosted glass simulation
- drawCarbonHatch with diagonal hatch micro-texture
- tintNeutral (DPR-02) with brand-tinted neutral function and tint amount table
- Cross-references to design-principles.md and depth-recipes.md

### Task 2: typography-recipes.md, animation-recipes.md, canvas-recipes.md stub

**typography-recipes.md (155 lines):**
- 3-tier typography hierarchy (DPR-01) with hero/body/whisper formula and tier usage table
- theme.getTypoScale (CON-03) shared function pattern
- fitText measureText-before-draw pattern
- drawSpacedText (DPR-08) cinematic letter spacing

**animation-recipes.md (190 lines):**
- DO NOT LOAD Phase 9 header (threat T-06-01 mitigated)
- Timer lifecycle (setInterval continuous loop and one-shot entrance)
- Easing functions (easeOutQuart, easeOutExpo, easeInOutCubic, easeInOutQuad)
- Animation speed modifiers table (pulse, glow_pulse, breathe, spin)
- Motion timing constants (instant/micro/state/entrance tiers)
- requestAnimationFrame pattern with cleanup

**canvas-recipes.md (980 lines, was 1200):**
- Prepended routing stub header with restructuring notice
- 4-file routing table linking to depth/texture/typography/animation recipes
- Removed 3 extracted sections (typographic tension, effects, animation extended)
- All functional patterns preserved unchanged (hover, drilldown, shapes, colors, hit-test, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| All 4 new files exist | PASS |
| depth-recipes.md < 300 lines | PASS (246) |
| texture-recipes.md < 300 lines | PASS (167) |
| typography-recipes.md < 300 lines | PASS (155) |
| animation-recipes.md < 300 lines | PASS (190) |
| canvas-recipes.md has routing table | PASS (4 links) |
| animation-recipes.md has DO NOT LOAD | PASS |
| Zero ES6 (const/let/arrow) in new files | PASS (0 violations) |
| DPR-04/05/09/10/03 in depth-recipes | PASS (11 matches) |
| DPR-06/07/02 in texture-recipes | PASS (7 matches) |
| DPR-01/08 in typography-recipes | PASS (5 matches) |
| canvas-recipes.md preserves Hover tooltip | PASS |
| canvas-recipes.md preserves Drilldown | PASS |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 9fd1233 | feat(06-01): create depth-recipes.md and texture-recipes.md |
| 2 | 5b9f899 | feat(06-01): create typography/animation recipes, restructure canvas-recipes.md |

## Self-Check: PASSED

All created files verified present. Both commits verified in git log.
