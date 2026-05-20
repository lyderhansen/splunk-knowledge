---
phase: 25-backgrounds-preview-assets
reviewed: 2026-05-20T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
  - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
  - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js
  - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
  - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
  - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
  - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
findings:
  critical: 2
  warning: 4
  info: 1
  total: 7
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-05-20
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This phase introduced `generate_assets.js` (identical copy in both `vp-viz/scripts/` and `vp-create/scripts/`), a test suite, and updates to `validate_viz.sh`, `vp-create/SKILL.md`, `vp-design/SKILL.md`, and `theme-template.md`. The generator is well-structured ES5 CJS with good error handling for most cases. Two blockers were found: the photo PNG decoder silently produces corrupted output for any real-world photo (PNG filter types 1-4 are ignored, but the fallback never fires because inflate succeeds), and `strava` is misclassified under the `music` domain instead of `sports`. Four warnings cover dead code, a latent divide-by-zero, a LCG seed reuse, and a test threshold divergence.

## Critical Issues

### CR-01: Photo PNG decoder ignores PNG filter bytes — silently corrupts pixel data

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:1322-1336`

**Issue:** `generatePhotoBg()` inflates IDAT chunks and then reads pixel data assuming every scanline uses filter type 0 (None). The code skips exactly one byte per scanline as the "filter byte" and reads the remainder as raw RGB triplets. However, virtually all real-world PNG photos (whether exported from Photoshop, Pillow, libpng, or any image editor) use filter types 1-4 (Sub, Up, Average, Paeth) to improve compression. When a non-None filter is used, the "pixel values" read by the decoder are actually filter deltas, not colors, producing garbage output (wrong colors, banding artifacts, or random noise).

The fallback to `generateGradientBg()` does NOT trigger because `zlib.inflateSync()` succeeds — it correctly decompresses the DEFLATE stream. The error only occurs when interpreting the decompressed bytes. The `try/catch` at line 1339 wraps the inflate call and the scanline reading, but since no exception is thrown for corrupt interpretation, the fallback is bypassed and a corrupted `bg_gradient.png` is written and logged as success.

Test T15 only tests the case where `bg_photo.png` is absent (fallback path). No test provides a real PNG with non-None filter types.

**Fix:** Read the IHDR `colorType` and `bitDepth` fields and validate them before decoding. Then implement proper PNG filter reconstruction for each scanline:

```javascript
// After inflating, reconstruct filtered scanlines:
var bytesPerPixel = 3; // for RGB; 4 for RGBA
var scanlineLen = 1 + photoW * bytesPerPixel;
photoData = [];
var prevRow = new Array(photoW * bytesPerPixel).fill(0);
for (var sy = 0; sy < photoH; sy++) {
    var scanOff = sy * scanlineLen;
    var filterType = inflated[scanOff];
    var rawRow = [];
    for (var bx = 0; bx < photoW * bytesPerPixel; bx++) {
        var raw = inflated[scanOff + 1 + bx] || 0;
        var left = bx >= bytesPerPixel ? rawRow[bx - bytesPerPixel] : 0;
        var up   = prevRow[bx] || 0;
        var upLeft = bx >= bytesPerPixel ? prevRow[bx - bytesPerPixel] : 0;
        var recon;
        if (filterType === 0) { recon = raw; }
        else if (filterType === 1) { recon = (raw + left) & 0xFF; }
        else if (filterType === 2) { recon = (raw + up) & 0xFF; }
        else if (filterType === 3) { recon = (raw + Math.floor((left + up) / 2)) & 0xFF; }
        else if (filterType === 4) {
            // Paeth predictor
            var p = left + up - upLeft;
            var pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
            var paeth = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : upLeft);
            recon = (raw + paeth) & 0xFF;
        } else { throw new Error('unknown filter type ' + filterType); }
        rawRow.push(recon);
    }
    var scanRow = [];
    for (var sx = 0; sx < photoW; sx++) {
        scanRow.push(rawRow[sx * bytesPerPixel], rawRow[sx * bytesPerPixel + 1], rawRow[sx * bytesPerPixel + 2]);
    }
    photoData.push(scanRow);
    prevRow = rawRow;
}
```

Also add a IHDR color type check before decoding: read byte at offset 25 (color type) and reject anything other than 2 (RGB) or 6 (RGBA), falling back to gradient for unsupported types.

---

### CR-02: `strava` misclassified as `music` domain — wrong app icon for Strava viz packs

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:619`

**Issue:** The `DOMAIN_SYMBOLS` table classifies `'strava'` under the `'music'` domain (line 619), causing any app whose basename contains "strava" to receive a music-note icon instead of a sports/fitness icon. Strava is a fitness and sports tracking platform; it has no connection to music. The project memory file `feedback_test38_strava_report.md` confirms Strava was used as a sports/fitness test pack. An identically named `strava` keyword appears in `vp-create/scripts/generate_assets.js` (byte-for-byte duplicate).

```javascript
// WRONG — current code:
'music': ['music', 'audio', 'stream', 'spotify', 'podcast', 'playlist', 'artist', 'album',
          'track', 'strava'],   // <-- strava is a fitness app, not music

// FIX — move strava to sports:
'music':  ['music', 'audio', 'stream', 'spotify', 'podcast', 'playlist', 'artist', 'album',
           'track'],
'sports': ['sports', 'athlete', 'team', 'score', 'league', 'match', 'fitness', 'gym',
           'exercise', 'running', 'marathon', 'strava'],   // <-- correct placement
```

Apply the same fix to `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js` (lines are identical).

---

## Warnings

### WR-01: Unused variable `angle` in `hex_grid` pattern — dead code indicates incomplete implementation

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:1192`

**Issue:** Inside `applyPattern()` for `pat === 'hex_grid'`, the variable `angle` is computed via `Math.atan2(dy, dx)` but never used in the conditional or the blend call. The comment above it says "Hex boundary: use angular distance" but the implementation falls back to plain Euclidean distance (`dist = Math.sqrt(dx*dx + dy*dy)`). The result is a circular boundary approximation rather than true hexagonal boundary detection, meaning the pattern draws circles instead of hexagons. The dead `angle` variable is evidence the hexagonal math was planned but not completed.

```javascript
// WRONG — current code (line 1192-1196):
var angle = Math.atan2(dy, dx);   // computed but never used
var dist = Math.sqrt(dx * dx + dy * dy);
var borderDist = hexR - dist;
if (borderDist >= 0 && borderDist < 2) { ... }

// FIX option A — remove dead variable and use true hex boundary:
// Hex boundary in flat-top orientation: |x| <= r AND |x| + |y|*sqrt(3)/3 <= r*4/3
var absX = Math.abs(dx), absY = Math.abs(dy);
var hexBound = absX + absY * 0.577;  // approximation of max(|x|, |x|+|y|/sqrt(3))
var borderDist = hexR - hexBound;
if (borderDist >= 0 && borderDist < 2) { ... }

// FIX option B — simplest: just delete the angle line if circular approximation is acceptable:
// var angle = Math.atan2(dy, dx);  // DELETE this line
```

The same bug exists in `vp-create/scripts/generate_assets.js` at the same line.

---

### WR-02: `makeGradientRows` divides by zero when `w=1` or `h=1`

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:158-160`

**Issue:** `makeGradientRows` computes `ty = y / (h - 1)` and `tx = x / (w - 1)`. When `h=1` or `w=1`, the denominator is zero, producing `NaN` for all interpolation variables. Every pixel then gets `NaN` color components. In a JavaScript `Buffer`, `NaN` coerced to a byte becomes `0`, producing a solid black image with no error. All current callers use `W=1920, H=1080`, so this is a latent bug, but the function lacks a guard and would silently produce wrong output if ever called with a 1-pixel dimension.

```javascript
// FIX — add guards at the top of makeGradientRows:
function makeGradientRows(w, h, topLeftRgb, bottomRightRgb, accentRgb, accentCx, accentCy, accentR) {
    if (w <= 1 || h <= 1) {
        // For 1-pixel dimensions, return solid fill with topLeft color
        return makeRgbRows(w, h, topLeftRgb[0], topLeftRgb[1], topLeftRgb[2]);
    }
    var rows = [];
    for (var y = 0; y < h; y++) {
        var ty = y / (h - 1);
        // ...
```

---

### WR-03: `generateSolidBg` reuses same LCG seed for dark and light variants — identical noise positions

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js:1104`

**Issue:** `makeSolidRows` (a closure inside `generateSolidBg`) initializes `var lcg = 12345` every time it is called. When generating the dark variant, the noise starts at seed 12345. When generating the light variant, the seed resets to 12345 again. Both dark and light `bg_gradient.png` / `bg_gradient_light.png` therefore have noise pixels at exactly the same pixel positions, just with different base colors. This creates a subtle visual artifact: switching between light and dark themes reveals that all "noise" pixels move identically, which could look unnatural on close inspection.

```javascript
// FIX — use different starting seeds for the two calls:
// dark variant
var dRows = makeSolidRows(hexToRgb(dark.bg), 12345);
// light variant  
var lRows = makeSolidRows(hexToRgb(lightTheme.bg || '#F0F2F5'), 98765);

// And update the closure signature:
function makeSolidRows(baseRgb, seed) {
    var rows = makeRgbRows(W, H, baseRgb[0], baseRgb[1], baseRgb[2]);
    var lcg = seed;
    // ...
```

---

### WR-04: Test T9 preview size threshold (>100 bytes) diverges from validator A01 threshold (>500 bytes)

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_generate_assets.js:219-220`

**Issue:** T9 checks that `preview.png` exceeds 100 bytes. `validate_viz.sh` FAIL A01 (line 192) rejects any `preview.png` under 500 bytes as a "solid-color placeholder." A preview PNG that is between 100 and 499 bytes would pass T9 but fail the production validator — a test that passes without catching a real failure scenario. In practice, a 116x76 silhouette with level-6 compression will produce thousands of bytes, so no real regression is masked today, but the thresholds should be consistent to preserve the test's signal value.

```javascript
// FIX — align T9 threshold with validate_viz.sh:
// Change line 220 from:
assertGt('T9 preview.png size > 100 bytes', previewSize, 100);
// To:
assertGt('T9 preview.png size > 500 bytes', previewSize, 500);
```

---

## Info

### IN-01: Duplicate `generate_assets.js` — undocumented copy relationship creates drift risk

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js`

**Issue:** `vp-create/scripts/generate_assets.js` is a byte-for-byte copy of `vp-viz/scripts/generate_assets.js` (confirmed by `diff` producing no output). The project documents this pattern for `build_flat.js` in `CLAUDE.md` ("Canonical source at `vp-viz/scripts/build_flat.js`, copied to `vp-create/scripts/build_flat.js`"), but there is no equivalent documentation for `generate_assets.js`. Every bug fix — including CR-01 and CR-02 above — must be applied to both copies. If a future contributor fixes only one file, the copies silently diverge.

**Fix:** Add a comment at the top of `vp-create/scripts/generate_assets.js` (after line 3):
```javascript
 * CANONICAL SOURCE: plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
 * This file is a copy. Apply all changes to the canonical source first, then sync here.
```
And add an entry in `CLAUDE.md` under the `build_flat.js` note: "Same copy relationship applies to `generate_assets.js`."

---

_Reviewed: 2026-05-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
