---
phase: 25-backgrounds-preview-assets
verified: 2026-05-20T21:29:17Z
status: human_needed
score: 12/13 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run validate_viz.sh against a pack generated with the updated generate_assets.js and confirm overall exit code"
    expected: "validate_viz.sh should exit 0; A02 should pass on 116x76 preview.png; A01 currently fires a false-positive FAIL because the threshold is still 500 bytes but 116x76 PNGs are ~276 bytes"
    why_human: "A01 size check in validate_viz.sh was not updated from >500 to >100 bytes when preview dimensions changed. This is not covered by any PLAN must-have (PLAN 25-02 only required A02 to change) but it causes validate_viz.sh to exit 1 on correct output. Needs a human decision: treat as follow-up fix or accept that A01 is intentionally conservative."
---

# Phase 25: Backgrounds & Preview Assets Verification Report

**Phase Goal:** generate_assets.js produces background variant matching visual language backgroundType; preview.png at 116x76 (official spec); branded appIcon symbol
**Verified:** 2026-05-20T21:29:17Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running generate_assets.js for a brand with backgroundType: pattern produces bg_gradient.png with pixel data that differs from a gradient-type brand's bg_gradient.png | VERIFIED | T13 passes: pattern pixel data confirmed to differ from gradient pixel data |
| 2 | Running generate_assets.js for any background type produces bg_gradient_light.png alongside bg_gradient.png | VERIFIED | T12 (gradient), T13 (pattern), T14 (solid) all confirm bg_gradient_light.png written; T15 (photo fallback) also writes it via gradient fallback |
| 3 | generate_assets.js without a VISUAL_LANG.backgroundType field falls back silently to gradient behavior | VERIFIED | T11 passes: exit 0, bg_gradient.png exists; no stderr error |
| 4 | vp-design SKILL.md Visual Language schema block shows backgroundType and backgroundPattern fields with enum values and mood defaults | VERIFIED | Lines 189-190: backgroundType: gradient \| pattern \| solid \| photo with inline mood defaults; backgroundPattern enum present |
| 5 | theme-template.md VISUAL_LANG object exports backgroundType and backgroundPattern placeholders | VERIFIED | Lines 35-36: backgroundType: '{{BG_TYPE}}' and backgroundPattern: '{{BG_PATTERN}}' confirmed |
| 6 | test_generate_assets.js T11-T16 pass on the updated canonical script | VERIFIED | All 34 tests pass (node test_generate_assets.js exits 0) |
| 7 | A generated preview.png is exactly 116x76 pixels | VERIFIED | T8 passes: width=116, height=76 confirmed; generate_assets.js line 1022: var W = 116, H = 76 |
| 8 | A generated preview.png for a bar_chart type has visually distinct pixel fills using at least two colors (dark.s1 and dark.accent) | VERIFIED | drawBarsSilhouette alternates accent (even bars) and s1 secondary color (odd bars); generatePreviews derives s1 from dark.series[0] or dark.s1 with fallback |
| 9 | A generated appIcon.png for an app named cloudflare_soc_viz shows different pixel content than the letter-only icon for an unmatched app | VERIFIED | T17 passes: security keyword match produces full-file diff from letter fallback |
| 10 | validate_viz.sh A02 check passes on 116x76 previews and fails on 300x200 previews | VERIFIED | Line 195: W -ne 116 \|\| H -ne 76 condition confirmed; no residual 300 in non-comment lines |
| 11 | test_generate_assets.js T8 asserts 116x76 and T17 asserts domain symbol differs from letter | VERIFIED | T8 asserts width=116, height=76; T17 uses full file diff (!bufSec.equals(bufNom)) — both pass |
| 12 | generate_assets.js canonical and vp-create copy are byte-identical | VERIFIED | diff exits 0, no differences |
| 13 | validate_viz.sh A01 size check is consistent with 116x76 PNG output | FAILED | A01 threshold is 500 bytes (line 192); 116x76 kpi_tile preview.png is 276 bytes; A01 fires a false-positive FAIL on valid output — validate_viz.sh exits 1 on correct packs |

**Score:** 12/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js` | Background generation dispatcher + 4 generators + light variants | VERIFIED | 1498 lines; generateBackground() at line 1411; 3 references to generateBackground, 11 to bg_gradient_light, DOMAIN_SYMBOLS at line 602 |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js` | Sync copy of canonical script | VERIFIED | 1498 lines, byte-identical to canonical (diff exits 0) |
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js` | T11-T16 tests for background dispatch and light variant | VERIFIED | 425 lines; T11-T17 all present and all pass (34/34) |
| `plugins/splunk-viz-packs/skills/vp-design/SKILL.md` | Visual Language schema with backgroundType field | VERIFIED | 210 lines (under 500); backgroundType appears 2 times with enum + mood defaults |
| `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` | VISUAL_LANG export with backgroundType placeholder | VERIFIED | 234 lines; BG_TYPE and BG_PATTERN placeholders confirmed |
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` | A02 check updated to 116x76 | VERIFIED (PARTIAL) | A02 updated correctly; A01 size threshold not updated (500 bytes, should be 100) |
| `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` | Updated preview dimension reference in checklist | VERIFIED | 207 lines; 116x76 appears 2 times (description line + packaging checklist) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| vp-design SKILL.md Visual Language schema | shared/theme.js VISUAL_LANG.backgroundType | Claude writes field during design step 3b | VERIFIED | Schema block at lines 189-190 defines the field; theme-template.md provides the {{BG_TYPE}} placeholder |
| generate_assets.js main() | generateBackground() | themeModule.VISUAL_LANG.backgroundType dispatch | VERIFIED | Lines 1468/1489: visualLang loaded from VISUAL_LANG, passed to generateBackground() |
| generateBackground() | bg_gradient.png + bg_gradient_light.png | Each sub-generator writes both dark and light variants | VERIFIED | All 4 generators (gradient, solid, pattern, photo) write both files; T12-T16 confirm |
| generatePreviews() W=116, H=76 | validate_viz.sh A02 check W=116 H=76 | Both changed atomically | VERIFIED | generator line 1022 = W=116, H=76; validator line 195 checks W -ne 116 \|\| H -ne 76 |
| generateAppIcon() DOMAIN_SYMBOLS lookup | domain symbol draw functions | baseName keyword match -> symbol name -> drawSymbol dispatch | VERIFIED | matchDomain() at line 632; drawSymbol() at 649; drawSymbol2x() at 776; 15 domains in both functions |

### Data-Flow Trace (Level 4)

Not applicable — generate_assets.js is a build-time script, not a data-rendering component. It reads theme.js and writes PNG files. No dynamic runtime data flows.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 34 tests pass | node plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js | 34 passed, 0 failed | PASS |
| Both generate_assets.js copies byte-identical | diff vp-viz/scripts/generate_assets.js vp-create/scripts/generate_assets.js | No differences | PASS |
| A02 validator check is 116x76 | grep "116" validate_viz.sh | Line 195 confirmed | PASS |
| A01 validator consistent with 116x76 PNG size | grep "500" validate_viz.sh A01 | A01 still requires >500 bytes; 116x76 PNG = 276 bytes | FAIL |

### Probe Execution

No probes declared. test_generate_assets.js serves as the canonical probe and was run directly.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BG-01 | 25-01 | Dashboard background supports multiple types: gradient, geometric pattern, brand photo overlay, solid with texture — selected by backgroundType field | SATISFIED | 4-type dispatcher in generate_assets.js; vp-design schema and theme-template both export backgroundType |
| BG-02 | 25-01 | generate_assets.js produces background type matching the visual language — not always the same dark radial gradient | SATISFIED | generateBackground() dispatcher routes gradient/pattern/solid/photo; T13 confirms pattern differs from gradient |
| BG-03 | 25-01 | Light mode background variant generated alongside dark mode — bg_gradient_light.png | SATISFIED | All 4 generators write bg_gradient_light.png; T12-T16 confirm; 1920x1080 confirmed by T16 |
| PA-01 | 25-02 | generate_assets.js preview.png uses 116x76 pixels (official Splunk spec), brand gradient fills, recognizable viz silhouette shapes | SATISFIED | W=116, H=76 at line 1022; 10 silhouette types; 2-color fills with accent+s1; T8 passes |
| PA-02 | 25-02 | generate_assets.js appIcon.png uses brand primary color with a recognizable symbol — not a generic colored circle | SATISFIED | DOMAIN_SYMBOLS table; matchDomain(); drawSymbol() with 15 domain pixel-art icons; 3-tier cascade; T17 passes |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh | 192 | A01 size check threshold `500` not updated when preview dimensions changed from 300x200 to 116x76 | Warning | validate_viz.sh exits 1 on correctly generated 116x76 packs (276 bytes < 500 threshold); false-positive A01 FAIL |

No TBD/FIXME/XXX markers found in any modified file.

### Human Verification Required

#### 1. validate_viz.sh A01 false-positive on 116x76 preview.png

**Test:** Run validate_viz.sh against a freshly generated pack (one that used the updated generate_assets.js) and check the A01 finding and overall exit code.

**Expected (if fixed):** A01 should not fire on a 116x76 preview.png with real silhouette data (~276 bytes). validate_viz.sh should exit 0.

**Current behavior:** A01 fires: "FAIL A01: kpi_tile preview.png solid-color placeholder (276 bytes, need >500)". validate_viz.sh exits 1.

**Why human:** The PLAN 25-02 must-haves only specified updating the A02 check. A01 was not in scope. The gap is real but requires a human decision: (a) accept that A01 needs a follow-up fix to lower the threshold to 100 bytes, or (b) override this finding as out-of-scope for phase 25 since the PLAN's must-haves don't mention A01.

**Suggested fix (if accepted):** Change line 192 of validate_viz.sh from `[ "$SIZE" -lt 500 ]` to `[ "$SIZE" -lt 100 ]` to match T9's threshold (100 bytes) — consistent with the 116x76 PNG size of ~276 bytes.

### Gaps Summary

One functional gap found that is not covered by any PLAN must-have:

`validate_viz.sh A01` size threshold was not updated from `>500` to `>100` bytes when preview dimensions changed to 116x76. A correctly generated 116x76 preview.png (~276 bytes) is below the 500-byte threshold, causing A01 to fire a false-positive FAIL and making validate_viz.sh exit 1 on valid output. The ROADMAP SC5 says "validate_viz.sh A02 passes on the generated file" — A02 does pass. A01 was never mentioned in the PLAN must-haves. This is a WARNING-level gap that will cause user-visible friction but does not block the phase's declared goals.

All 5 requirement IDs (BG-01, BG-02, BG-03, PA-01, PA-02) are satisfied. All 34 tests pass. Both generate_assets.js copies are byte-identical. All commits verified.

---

_Verified: 2026-05-20T21:29:17Z_
_Verifier: Claude (gsd-verifier)_
