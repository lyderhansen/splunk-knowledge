---
phase: 25-backgrounds-preview-assets
plan: "01"
subsystem: generate_assets / vp-design schema
tags: [background-generation, visual-language, generate_assets, vp-design, light-theme]
dependency_graph:
  requires: []
  provides:
    - generateBackground() dispatcher in generate_assets.js
    - 4 background sub-generators (gradient, solid, pattern, photo)
    - bg_gradient_light.png output for every background type
    - backgroundType / backgroundPattern fields in Visual Language schema
    - BG_TYPE / BG_PATTERN placeholders in theme-template.md
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
tech_stack:
  added: []
  patterns:
    - LCG noise for solid background texture (seed=12345, noise fraction=15%)
    - fillRectBlend() for pattern overlay at configurable alpha
    - try/catch zlib.inflateSync fallback per T-25-02 threat mitigation
    - VISUAL_LANG dispatcher pattern for background type routing
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
decisions:
  - "generateGradientBg signature changed from (appDir, dark) to (appDir, dark, light) — backward compatible via default light fallback"
  - "generateBackground() dispatcher falls back to 'gradient' for any unknown backgroundType value — ensures forward compatibility with new types added later"
  - "T-25-02 mitigation: zlib.inflateSync wrapped in try/catch inside generatePhotoBg(); any PNG decode failure silently falls back to gradient"
  - "Pattern pixel-grid pixel-by-pixel loop (hex_grid, topo) is correct but slow for 1920x1080; acceptable for build-time script, not runtime viz code"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-20T21:03:02Z"
  tasks_completed: 2
  files_modified: 5
---

# Phase 25 Plan 01: Background Dispatcher and Light Variant Summary

Background generation now driven by VISUAL_LANG.backgroundType (gradient/pattern/solid/photo) with automatic paired light variant (bg_gradient_light.png) for every run, wired through the vp-design Visual Language schema so Claude populates the fields during design step 3b.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add backgroundType/backgroundPattern to Visual Language schema and theme-template | c023bcd | vp-design/SKILL.md, theme-template.md |
| 2 | Implement generateBackground() dispatcher, 4 sub-generators, light variants | ee2f529 | generate_assets.js (x2), test_generate_assets.js |

## What Was Built

### Task 1 — Visual Language schema extension
- `vp-design/SKILL.md`: added `backgroundType` row (enum + mood-based defaults inline) and `backgroundPattern` row to the Visual Language schema block
- `theme-template.md`: added `backgroundType: '{{BG_TYPE}}'` and `backgroundPattern: '{{BG_PATTERN}}'` fields to the `VISUAL_LANG` object literal

### Task 2 — generate_assets.js background dispatcher
- `generateGradientBg(appDir, dark, light)`: extended signature to write both `bg_gradient.png` (dark, 60% panel blend) and `bg_gradient_light.png` (light, 40% panel blend, accentR=400)
- `generateSolidBg(appDir, dark, light)`: solid fill with LCG noise (seed=12345, 15% pixels perturbed by delta in -7..+8 range), dark and light variants
- `fillRectBlend()`: helper for in-place alpha blend of accent color into existing pixel rows
- `generatePatternBg(appDir, dark, light, bgPattern)`: gradient base + geometric pattern overlay at 12% (dark) / 8% (light) blend; supports `circuit`, `dot_matrix`, `hex_grid`, `topo`
- `generatePhotoBg(appDir, dark, light)`: reads `shared/bg_photo.png`, validates PNG signature, decodes IDAT+inflate, composites at 55% (dark) / 15% (light); T-25-02 try/catch fallback to gradient on any decode error
- `generateBackground(appDir, dark, light, visualLang)`: dispatcher routing on `visualLang.backgroundType`
- `main()`: now loads light theme (with safe fallback object) and `VISUAL_LANG`, calls `generateBackground()` replacing the old `generateGradientBg()` call
- `test_generate_assets.js`: T11-T16 added (backward compat, gradient both variants, pattern pixel-data differs, solid both variants, photo fallback, light dims 1920x1080)
- `vp-create/scripts/generate_assets.js`: byte-identical copy of canonical

## Test Results

All 33 tests pass (17 original T1-T10 + 16 new assertions across T11-T16):

```
=== Results: 33 passed, 0 failed ===
```

## Deviations from Plan

None — plan executed exactly as written. T-25-02 threat mitigation (zlib.inflateSync try/catch) was explicitly in the plan's threat register and implemented as specified.

## Known Stubs

None — all generators produce real pixel data. The `{{BG_TYPE}}` and `{{BG_PATTERN}}` placeholders in theme-template.md are intentional — Claude fills them during vp-design step 3b.

## Threat Flags

No new security surface introduced beyond what the plan's threat model covers. generatePhotoBg() path traversal risk is mitigated by the fixed relative path (`shared/bg_photo.png`).

## Self-Check: PASSED

All key files exist:
- FOUND: generate_assets.js (vp-viz/scripts)
- FOUND: generate_assets.js (vp-create/scripts, byte-identical copy)
- FOUND: test_generate_assets.js
- FOUND: vp-design/SKILL.md
- FOUND: theme-template.md
- FOUND: 25-01-SUMMARY.md

Commits verified:
- c023bcd: feat(25-01): add backgroundType/backgroundPattern to Visual Language schema
- ee2f529: feat(25-01): implement generateBackground() dispatcher with 4 sub-generators and light variants
