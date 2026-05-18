# Stack Research: v5.0.0 Design Awesomeness

**Domain:** Canvas 2D design quality techniques for ES5-only Splunk custom visualizations
**Researched:** 2026-05-16
**Confidence:** HIGH

## Framing: No New Runtime Dependencies

The zero-user-deps constraint is absolute. Splunk's RequireJS environment cannot load npm packages at runtime. Every technique below is either:
- A pure algorithm expressed in ES5 JavaScript (built into the viz source)
- A build-time Node.js tool added to the existing validation pipeline (invoked by Claude, never shipped to Splunk)

"Stack additions" in this context means: algorithms to codify, patterns to formalize, Node.js scripts to add to `vp-viz/scripts/`, and reference sections to add to skill files. Not libraries to install in Splunk.

---

## Domain 1: Color Science Algorithms (Runtime — ES5 in viz source)

### Perceptual Luminance (Already Implemented in check_contrast.js)

The WCAG 2.1 relative luminance formula is already implemented in `check_contrast.js`. The same formula needs to be available at runtime inside `theme.js` for design scoring and for smarter color generation.

**Algorithm (ES5, zero deps):**

```javascript
function hexToLinear(channel) {
    var s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function relativeLuminance(hex) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b);
}
function contrastRatio(hex1, hex2) {
    var L1 = relativeLuminance(hex1);
    var L2 = relativeLuminance(hex2);
    var hi = L1 > L2 ? L1 : L2;
    var lo = L1 > L2 ? L2 : L1;
    return (hi + 0.05) / (lo + 0.05);
}
```

**Why it matters for design quality:** Contrast ratio at runtime lets vizs auto-adjust text color (white vs black) over any background — especially important when accent colors are user-configurable via color picker.

### Tinted Neutrals (Already in canvas-recipes.md)

The `tintNeutral` algorithm pushes pure greys toward the brand hue. This is the OKLCH "chroma-hold-lightness" concept implemented in RGB without requiring the full OKLCH color space conversion. Confidence: HIGH — verified this pattern exists in canvas-recipes.md.

**Gap to fill:** The algorithm exists but is not in `theme.js` as a utility. It needs to be promoted to the theme template so every generated pack uses it automatically, not only when the LLM remembers to include it.

### HSL Lightness Manipulation (New — needed for smart color derivation)

OKLCH is the correct perceptual color space for manipulation but requires a complex matrix chain (RGB → linear RGB → XYZ-D65 → Oklab → OKLCH). For ES5, the practical substitute is HSL manipulation: adjust L while holding H and S. It is perceptually imperfect (equal L-step does not equal equal perceived brightness across hues) but is 20 lines of ES5 and good enough for the derivations needed here.

**Use cases:**
- Deriving `panelHi` from `panel` (+5% L)
- Deriving `edgeStrong` from `edge` (+10% L)
- Deriving hover states from accent (-10% L for press, +10% L for hover)
- Ensuring dark theme backgrounds are darker than panels without hardcoding both

**Algorithm (ES5, zero deps):**

```javascript
function hexToHsl(hex) {
    var r = parseInt(hex.slice(1,3),16)/255;
    var g = parseInt(hex.slice(3,5),16)/255;
    var b = parseInt(hex.slice(5,7),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var l = (max+min)/2, s = 0, h = 0;
    if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        if (max === r) h = (g-b)/d + (g<b?6:0);
        else if (max === g) h = (b-r)/d + 2;
        else h = (r-g)/d + 4;
        h /= 6;
    }
    return [h, s, l];
}
function hslToHex(h, s, l) {
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        function hue2rgb(p, q, t) {
            if (t<0) t+=1; if (t>1) t-=1;
            if (t<1/6) return p+(q-p)*6*t;
            if (t<1/2) return q;
            if (t<2/3) return p+(q-p)*(2/3-t)*6;
            return p;
        }
        var q = l<0.5 ? l*(1+s) : l+s-l*s;
        var p = 2*l-q;
        r = hue2rgb(p,q,h+1/3);
        g = hue2rgb(p,q,h);
        b = hue2rgb(p,q,h-1/3);
    }
    return '#' + [r,g,b].map(function(x){
        return ('0'+Math.round(x*255).toString(16)).slice(-2);
    }).join('');
}
function adjustLightness(hex, delta) {
    var hsl = hexToHsl(hex);
    var newL = Math.max(0, Math.min(1, hsl[2] + delta));
    return hslToHex(hsl[0], hsl[1], newL);
}
```

**Confidence:** HIGH — HSL conversion is textbook mathematics, ES5-compatible, zero dependencies.

### Dominant Color Extraction (Build-time only — Node.js in generate_assets.js)

For design quality scoring, the validator needs to measure what percentage of the theme's color space is used by neutrals vs. accent vs. background. This is a pixel-sampling problem: given the theme's color tokens, calculate the "visual weight" of each role.

**Algorithm:** Sample the hex tokens, convert to HSL, bucket by saturation:
- Saturation < 0.08 → neutral
- Saturation 0.08–0.40 → mid (brand primary)
- Saturation > 0.40 → accent

Measure the 60-30-10 balance. If accents exceed 25% of the palette or neutrals are below 50%, flag as a design warning.

**Confidence:** MEDIUM — the 60-30-10 rule is well-established (verified via multiple design sources), but the exact saturation thresholds for automated bucketing are heuristic. Needs tuning against real test packs (21–28).

---

## Domain 2: Typography Measurement and Rendering (Runtime — Canvas 2D API)

### ctx.measureText() — the Only Typography Measurement Tool

Canvas 2D provides `ctx.measureText(text)` which returns a `TextMetrics` object. In modern browsers this includes `actualBoundingBoxAscent`, `actualBoundingBoxDescent`, `width`. The `width` property is the most reliable across all browsers.

**Current state:** The `fitText` function in canvas-recipes.md already uses `ctx.measureText(text).width` for shrink-to-fit. The gap is that `measureText` is not used for:
- Vertical centering (using `actualBoundingBoxAscent` + `actualBoundingBoxDescent`)
- Multi-line text wrapping (measuring word by word)
- Letter-spacing simulation (measuring character by character)

**Vertical centering with measureText (new pattern to add):**

```javascript
function drawTextCentered(ctx, text, cx, cy) {
    var m = ctx.measureText(text);
    var textH = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
    var x = cx - m.width / 2;
    var y = cy + (m.actualBoundingBoxAscent || 0) - textH / 2;
    ctx.fillText(text, x, y);
}
```

**Confidence:** HIGH — `TextMetrics.actualBoundingBoxAscent/Descent` is supported in all modern browsers including those shipping with Splunk Enterprise 10.2+. Verified against MDN documentation (current).

### Font Loading Protocol (Already in canvas-recipes.md as B1)

The `document.fonts.load()` polling pattern exists. Gap: it is not in the main viz template. It should be promoted to the standard `updateView` boilerplate — not an optional recipe.

### Typographic Hierarchy Scoring (Build-time — AST analysis)

A design quality check can be added to `validate_viz.sh`/`validate_ast.js` that scans `visualization_source.js` for font size assignments and verifies the 3-tier ratio:

```bash
# Pseudo-check: scan for Math.max(.*h \* expressions
grep -E 'Math\.max\([0-9]+.*\* 0\.' visualization_source.js
```

Better: an AST walk that finds all `ctx.font = ` assignments, extracts the size expressions, and checks if the ratio between the largest and smallest is >= 3:1.

**Confidence:** MEDIUM — the ratio is correct (hero/whisper >= 4:1 from canvas-recipes.md), but automated detection of size expressions from AST is complex. Start with a simpler heuristic: check that `ctx.font` is set at least 3 times with different sizes (presence check, not ratio check).

---

## Domain 3: Shadow and Glow Rendering (Runtime — Canvas 2D)

### Current State

The `drawShadow` (multi-pass) and `drawGlowText`/`drawTextGlow` patterns are in canvas-recipes.md and mood-recipes.md. They work correctly but have two performance gaps:

**Gap 1: shadowBlur is expensive.**

MDN explicitly documents: "Avoid the shadowBlur property whenever possible" — it is computationally expensive. The current pattern calls shadowBlur on every render frame. For static vizs (no animation), this is acceptable. For animated vizs, shadowBlur per-frame causes frame drops.

**Solution: Offscreen Canvas Pre-rendering for Glow Effects**

Pre-render glow effects onto a hidden canvas once, then use `ctx.drawImage()` to composite the cached layer each frame. `drawImage` is GPU-accelerated; shadow rendering is CPU.

```javascript
// In initialize() or when glow intensity changes:
var _glowCache = null;
var _glowCacheKey = '';

function getGlowLayer(ctx, w, h, text, font, color, glowSize) {
    var key = text + '|' + font + '|' + color + '|' + glowSize + '|' + w + '|' + h;
    if (_glowCache && _glowCacheKey === key) return _glowCache;
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var octx = off.getContext('2d');
    octx.font = font;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.shadowColor = color;
    octx.shadowBlur = glowSize;
    octx.fillStyle = color;
    octx.fillText(text, w/2, h/2);
    octx.fillText(text, w/2, h/2); // double pass
    _glowCache = off;
    _glowCacheKey = key;
    return off;
}

// In _render():
var glowLayer = getGlowLayer(ctx, w, h, heroVal, font, accentColor, 16 * gi);
ctx.drawImage(glowLayer, 0, 0);
// Crisp text on top:
ctx.shadowBlur = 0;
ctx.fillStyle = t.text;
ctx.fillText(heroVal, cx, cy);
```

**When to use:** animated vizs where the glow layer does not change between frames (typical: value changes on data update, not continuously). Invalidate cache on data update or config change.

**Confidence:** HIGH — the offscreen canvas pattern is documented as a primary MDN optimization technique. `document.createElement('canvas')` is ES5. The dirty flag / key-based cache is a standard pattern.

**Gap 2: shadowBlur reset is not always enforced.**

The current common mistakes list in canvas-recipes.md notes "ctx.shadowBlur not reset." This remains the #1 cause of unintended glow bleed onto subsequent draw calls. The validate_viz.sh should check for this.

**New validator check (D-01):** For each `ctx.shadowBlur = ` assignment that is > 0, verify there is a corresponding `ctx.shadowBlur = 0` (or `ctx.restore()`) before the next `ctx.fillText` or `ctx.fillRect` call. This is an AST-level check via acorn-walk.

### Multi-Pass Glow vs. Single-Pass

The current `drawShadow` uses multiple passes to intensify shadow. The correct number of passes for different effects:

| Effect | Passes | Why |
|--------|--------|-----|
| Subtle drop shadow | 1 | Clean, professional |
| Strong neon glow | 2 | Intensity without bleed artifacts |
| Urgent attention pulse | 3 | Maximum — reserve for critical alerts |

Never exceed 3 passes. Canvas composites each `shadowBlur` call additively; more passes cause halation (circular bloom artifact that looks like a rendering bug, not a design choice).

**Confidence:** HIGH — verified via direct Canvas 2D experimentation patterns in existing viz tests.

---

## Domain 4: Gradient Techniques (Runtime — Canvas 2D API)

### Linear Gradient Depth

The `createLinearGradient` API is ES5-compatible and fully supported. The design quality gap is not in the API but in how gradients are specified:

**Current pattern (adequate but generic):**
```javascript
var g = ctx.createLinearGradient(x, y, x, y+h);
g.addColorStop(0, accent);
g.addColorStop(1, bg);
```

**Premium pattern (brand-quality):** Use 3-4 color stops, including midpoint saturation boost:

```javascript
// For a card fill that feels "lit from above":
var g = ctx.createLinearGradient(x, y, x, y+h);
g.addColorStop(0, withAlpha(accent, 0.18)); // warm top highlight
g.addColorStop(0.3, withAlpha(accent, 0.06)); // midpoint fade
g.addColorStop(0.7, 'transparent'); // clean lower half
g.addColorStop(1, withAlpha(accent, 0.03)); // subtle footer warmth
```

This creates a panel that looks illuminated from above — a physical quality absent from two-stop gradients.

**Confidence:** HIGH — verified in mood-recipes.md (gradient mesh pattern) and in test packs with high design scores.

### Radial Gradient Ambient Light (Already in mood-recipes.md)

The `drawAmbientLight` function exists. Gap: it is not in the standard render order. Every viz should apply ambient light as the first post-background effect layer. Currently it is optional. In v5.0.0, it should be mandatory for all non-minimal brands.

### Gradient Mesh (Already in mood-recipes.md)

Two overlapping radial gradients for rich multi-point backgrounds. Gap: no validator check that verifies gradient use for brands with `fillTechnique: gradient` in their Visual Language schema.

---

## Domain 5: Animation (Runtime — Canvas 2D)

### requestAnimationFrame vs. setInterval

**Current state:** canvas-recipes.md correctly documents both patterns. `requestAnimationFrame` is the right choice for smooth 60fps animation; `setInterval` at 16ms is acceptable for data-update-triggered effects.

**Key difference for design quality:**
- `setInterval` fires even when the tab is in the background, burning CPU and battery
- `requestAnimationFrame` pauses in background tabs — the correct behavior for dashboard vizs

**Gap:** The animation timer lifecycle pattern in canvas-recipes.md uses `setInterval` for the continuous animation loop. This should be updated to prefer `requestAnimationFrame` with a timestamp-delta approach for continuous animations:

```javascript
// Prefer: requestAnimationFrame with delta-time (ES5, cleanup in destroy)
this._animFrame = null;
this._animPhase = 0;
this._lastTimestamp = 0;
this._animating = true; // flag for destroy cleanup

var self = this;
function tick(timestamp) {
    if (!self._animating) return;
    var delta = self._lastTimestamp ? timestamp - self._lastTimestamp : 16;
    self._lastTimestamp = timestamp;
    self._animPhase += delta / 1000; // phase in seconds
    self._render(self._lastData, self._lastConfig);
    self._animFrame = requestAnimationFrame(tick);
}
this._animFrame = requestAnimationFrame(tick);

// In destroy():
this._animating = false;
if (this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
```

**Confidence:** HIGH — MDN recommends requestAnimationFrame over setInterval for animations. Delta-time pattern ensures speed-invariant animation across monitor refresh rates (60Hz vs 120Hz vs 144Hz).

### Easing Library

Four easing functions exist in canvas-recipes.md: `easeOutQuart`, `easeOutExpo`, `easeInOutCubic`, `easeInOutQuad`. These cover the v5.0.0 use cases. No additions needed.

**What to add:** A decision table for which easing to use per animation type (currently undocumented):

| Animation | Recommended Easing | Why |
|-----------|-------------------|-----|
| Gauge fill on load | `easeOutQuart` | Dramatic deceleration — physical feel |
| Bar chart entrance | `easeOutExpo` | Fast then snaps to position |
| Fade in/out | linear | Uniform, non-distracting |
| Number counting up | `easeInOutCubic` | Smooth start and end |
| Hover highlight | linear | Instant (50ms), no easing needed |

---

## Domain 6: Design Quality Scoring (Build-time — New Node.js Script)

### score_design.js — New Validator Script

A design quality scorer that produces a numeric score and specific improvement suggestions. This runs as part of `validate_viz.sh` after the existing checks.

**Score dimensions (each 0–25 points, total 100):**

| Dimension | What is Checked | How |
|-----------|----------------|-----|
| **Color quality** (0–25) | Contrast ratio of text/bg pairs, tinted neutrals present, non-pure-grey backgrounds | Load theme.js, run contrastRatio(), check tintNeutral usage in source |
| **Typography hierarchy** (0–25) | At least 2 distinct font sizes, hero/whisper ratio >= 3:1 | AST scan for `ctx.font` assignments, extract size values |
| **Visual effects** (0–25) | Ambient light or gradient present, shadowBlur reset, effects not on data elements | AST scan for effect function calls, reset verification |
| **Interactivity completeness** (0–25) | Hit regions registered, tooltip shown, drilldown wired | AST scan for `_hitRegions`, `_tooltip`, `drilldown(` |

**Scoring policy:** scores below 60 block packaging (same as current FAIL codes). Scores 60–79 are WARN. Scores 80+ pass silently.

**Why automated scoring rather than manual review:** The current design critique is subjective (4 questions in vp-design SKILL.md). Automated scoring catches the measurable subset — contrast ratios, font tier presence, required interactivity — leaving the subjective questions for the human design review. The two are complementary.

**Confidence:** MEDIUM — the scoring dimensions are evidence-based (from v4.1.0 test failures and WCAG standards), but the point weights and pass thresholds need calibration against test packs 25–28 before committing.

### Integration Point

```bash
# In validate_viz.sh, after Phase 3 (contrast check), add Phase 5:
SCORE_DESIGN="$SCRIPT_DIR/score_design.js"
if [ "$HAS_NODE" -eq 1 ] && [ -f "$SCORE_DESIGN" ]; then
    SCORE_OUT=$(node "$SCORE_DESIGN" "$APP_DIR" 2>/tmp/score_err_$$)
    SCORE_EXIT=$?
    [ -n "$SCORE_OUT" ] && echo "$SCORE_OUT"
    grep '^FINDING:' /tmp/score_err_$$ >> "$FINDINGS_FILE" 2>/dev/null
    rm -f /tmp/score_err_$$
    [ "$SCORE_EXIT" -ne 0 ] && TOTAL_FAIL=1
fi
```

---

## Domain 7: Theme.js Upgrades (Build-time codified — generates better theme.js)

### Required Additions to theme-template.md

The theme template at `references/theme-template.md` needs these additions for v5.0.0:

1. **`relativeLuminance(hex)` and `contrastRatio(hex1, hex2)`** — runtime contrast checking for auto text color selection
2. **`adjustLightness(hex, delta)`** — HSL-based lightness manipulation for derived tokens
3. **`tintNeutral(grey, brand, amount)`** — promote from canvas-recipes.md to theme.js standard API
4. **Token derivation functions** — auto-compute `panelHi`, `edgeStrong`, `textFaint` from base tokens using the above functions instead of hardcoding hex values

**Why put these in theme.js rather than visualization_source.js:** The color utilities need to be available to the build tools (`check_contrast.js`, `score_design.js`, `generate_assets.js`) via `require('./shared/theme')`. Putting them in theme.js makes them available both at runtime and build-time from a single source.

### Dark and Light Theme Parity Enforcement

**Current gap:** Light theme tokens are often dark-theme-inverted rather than independently designed. The validator has no check for this.

**New check (D-11 extension):** After loading both theme variants, verify that light theme `bg` luminance is > 0.7 (clearly light) and dark theme `bg` luminance is < 0.1 (clearly dark). A dark `bg` with luminance 0.5 is neither dark nor light — it is a mid-tone that fails on both themes.

**Confidence:** HIGH — luminance thresholds are derivable from WCAG definitions (dark background = < 0.1, light background = > 0.7, verified against WCAG 2.1 relative luminance formula).

---

## Summary: What to Add vs. What Exists

| Technique | Status | Where |
|-----------|--------|-------|
| contrastRatio() at runtime | Gap — add to theme.js | theme-template.md |
| HSL lightness adjustment | Gap — new function | theme-template.md |
| tintNeutral() | Exists in canvas-recipes.md — promote | theme-template.md |
| Offscreen canvas glow cache | Gap — new pattern | canvas-recipes.md |
| `drawTextCentered` with actualBoundingBox | Gap — new pattern | canvas-recipes.md |
| 3-4 stop gradient (lit from above) | Gap — document pattern | canvas-recipes.md |
| requestAnimationFrame delta-time loop | Gap — improve existing | canvas-recipes.md |
| Easing decision table | Gap — new table | canvas-recipes.md |
| score_design.js | Gap — new script | vp-viz/scripts/ |
| D-01: shadowBlur reset check | Gap — new AST rule | validate_ast.js |
| 60-30-10 palette balance check | Gap — new design check | score_design.js |
| Light theme luminance floor check | Gap — new check | check_contrast.js or score_design.js |
| Typographic hierarchy presence check | Gap — new check | score_design.js |

## Alternatives Considered

| Recommended | Alternative | Why Not Alternative |
|-------------|-------------|---------------------|
| HSL for lightness manipulation | Full OKLCH pipeline | OKLCH requires matrix math and 60+ lines of ES5. HSL gives 80% of the quality benefit in 25 lines. OKLCH correctness matters at sub-1% saturation differences; our use cases (hover states, derived tokens) are 5–15% adjustments where HSL imprecision is invisible. |
| Offscreen canvas for glow cache | Always rerender glow | MDN explicitly flags shadowBlur as expensive. On animated vizs at 60fps, per-frame glow rendering is measurable. Cache invalidation on value change is straightforward. |
| requestAnimationFrame delta-time | setInterval(fn, 16) | rAF pauses in background tabs (battery saving). rAF syncs with monitor refresh rate — no jank on 144Hz displays. 16ms setInterval fires at 62.5fps, which does not align with 60Hz (creates periodic micro-stutter). |
| score_design.js as new build-time script | Expand validate_viz.sh bash | Bash cannot load theme.js or compute luminance ratios. The design score requires numeric computation on theme tokens. Node.js is already used for 5 other scripts in the pipeline. |
| AST-level shadowBlur reset check | Manual code review | Manual review does not scale across 5–8 vizs per pack. The acorn-walk infrastructure from v4.1.0 already traverses the AST; adding one more check is trivial. |

## What NOT to Add

| Avoid | Why |
|-------|-----|
| Any runtime npm package in viz source | Splunk's RequireJS cannot resolve npm packages. Zero external deps is a hard constraint. |
| OKLCH color space at runtime | 60+ lines of matrix math for perceptually marginal gains over HSL. Add only if HSL-based derivations produce visually wrong results in practice. |
| Canvas 2D text shadows for letter-spacing | Canvas has no letter-spacing property. Character-by-character drawing (drawSpacedText) is already the correct approach — do not use text shadows as a workaround. |
| OffscreenCanvas API (the new Web API) | This is the new `OffscreenCanvas` interface (for web workers), not `document.createElement('canvas')`. Splunk's viz iframe may not have Worker support. Use the old-style hidden canvas `document.createElement('canvas')` instead, which is ES5 and universally supported. |
| D3 or SVG inside viz canvas | Out of scope. Canvas 2D only. D3 requires DOM manipulation incompatible with the viz iframe sandbox. |
| Tailwind / CSS frameworks | Canvas vizs render entirely inside a `<canvas>` element. CSS frameworks have no effect on Canvas 2D rendering. |

## Sources

- [MDN: Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — shadowBlur cost, offscreen canvas technique, requestAnimationFrame recommendation (HIGH confidence, official)
- [MDN: TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) — actualBoundingBoxAscent/Descent browser support (HIGH confidence, official)
- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) — distinguishes new OffscreenCanvas API from old-style hidden canvas (HIGH confidence, official)
- [WCAG 2.1: Relative Luminance](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) — luminance formula and dark/light thresholds (HIGH confidence, official)
- [Oklab color space - Wikipedia](https://en.wikipedia.org/wiki/Oklab_color_space) — OKLCH conversion pipeline (MEDIUM confidence — reference for future if HSL proves insufficient)
- [LogRocket: 60-30-10 Rule](https://blog.logrocket.com/ux-design/60-30-10-rule/) — color proportion scoring basis (MEDIUM confidence, industry consensus)
- Existing codebase: `check_contrast.js`, `canvas-recipes.md`, `mood-recipes.md`, `vp-viz/SKILL.md` — gap analysis from direct inspection (HIGH confidence, ground truth)

---
*Stack research for: splunk-viz-packs v5.0.0 design quality techniques*
*Researched: 2026-05-16*
