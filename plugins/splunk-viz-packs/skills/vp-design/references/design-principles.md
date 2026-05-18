# Design Principles

**Load:** MUST-LOAD for every viz generation — read before writing `_render()`.
**Scope:** Universal rules — every viz in every pack, all moods.
**Checkable or cut:** every rule maps to a Canvas API call and a Phase 8 FAIL code.

---

### DPR-01: 3-tier typography hierarchy

**Before:** `ctx.font = '24px Arial'; ctx.fillText(value, x, y);`
**After:** Hero/body/whisper 3-tier sizing with dynamic responsive scaling.

**Canvas API:** `ctx.measureText`, `ctx.font`

**Rule:** Every viz uses exactly three font sizes: hero (dominant value, 4-6x body), body (supporting text), whisper (uppercase labels, 25-35% opacity).

**Applies to:** All viz types — no exceptions.

**Phase 8 check:** `DQG-03` FAIL if no `Math.min`/`Math.max` responsive font sizing pattern.

**Minimum implementation:**
```javascript
var heroSize = Math.max(36, Math.min(72, Math.min(w, h) * 0.35));
var bodySize = Math.max(14, Math.min(24, Math.min(w, h) * 0.14));
var whisperSize = Math.max(8, Math.min(11, Math.min(w, h) * 0.07));
```

---

### DPR-02: Tinted neutral backgrounds

**Before:** `ctx.fillStyle = '#1A1A2E';` (generic dark grey)
**After:** Panel backgrounds tinted toward brand accent — same grey, brand-inflected.

**Canvas API:** `tintNeutral()` helper (color math using `parseInt`, hex manipulation)

**Rule:** Panel background fills derive from brand palette; never use generic grey.

**Applies to:** All panel fills, all viz types — no exceptions.

**Phase 8 check:** `DQG-04` WARN if theme.js has no tinted neutrals.

**Minimum implementation:**
```javascript
function tintNeutral(grey, brandHex, amount) {
    if (!amount) amount = 0.04;
    var r1 = parseInt(grey.slice(1,3),16), g1 = parseInt(grey.slice(3,5),16), b1 = parseInt(grey.slice(5,7),16);
    var r2 = parseInt(brandHex.slice(1,3),16), g2 = parseInt(brandHex.slice(3,5),16), b2 = parseInt(brandHex.slice(5,7),16);
    var r = Math.round(r1+(r2-r1)*amount), g = Math.round(g1+(g2-g1)*amount), b = Math.round(b1+(b2-b1)*amount);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
```

Full implementation: [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) (DPR-02 section)

---

### DPR-03: Gradient fills on all data elements (see DPR-03b for accent/series separation)

**Before:** `ctx.fillStyle = t.accent; ctx.fill();`
**After:** Linear gradient fill using series color creates depth without misusing accent.

**Canvas API:** `ctx.createLinearGradient`, `ctx.createRadialGradient`

**Rule:** Never use a flat solid fill for data-carrying elements (bars, arc segments, filled areas, panel backgrounds). Solid fills read as unfinished.

**Applies to:** Bars, arc segments, filled areas, panel backgrounds.
**Exception:** Stroke-only elements (gridlines, borders, tick marks) are exempt.

**Phase 8 check:** `DQG-01` WARN if no `createLinearGradient`/`createRadialGradient` in viz source.

**Minimum implementation:**
```javascript
// Data element gradient — use series color, NOT t.accent (see DPR-03b)
var seriesColor = theme.getSeriesColor(seriesIndex, t);
var grad = ctx.createLinearGradient(x, y, x, y + barH);
grad.addColorStop(0, seriesColor);
grad.addColorStop(1, theme.withAlpha(seriesColor, 0.5));
ctx.fillStyle = grad;
ctx.fill();

// Accent reserved for highlights:
// ctx.fillStyle = theme.withAlpha(t.accent, gi * 0.15); // hover overlay
// ctx.shadowColor = theme.withAlpha(t.accent, gi);       // glow halo
```

---

### DPR-03b: Accent vs series color separation

**Rule:** `t.accent` is the HIGHLIGHT color — used for the single element that must pop on each frame. Data series fills use `t.series[i]` (brand-derived palette), NEVER `t.accent`.

**Accent IS appropriate for (10% of visual weight):**
- Hover highlight overlay (semi-transparent fill behind hovered row/bar)
- Selection ring or selected-state border
- Glow halo (shadowColor in flashCritical LED pulse)
- Focus indicator on interactive elements
- Threshold breach indicator (value exceeds danger zone)
- Single-value vizs where ONE data element is the entire story (KPI hero, single gauge arc)

**Accent is NOT appropriate for:**
- Multi-series bar fills, arc segments, line strokes, area fills
- Default fill when no threshold context applies
- Background fills or decorative gradients (use t.bg, t.panel instead)

**The 60/30/10 rule (already in vp-design SKILL.md, enforced here):**
- 60% = background/panel neutrals (t.bg, t.panel)
- 30% = data series fills (t.series[0] through t.series[4])
- 10% = accent highlights only (hover, glow, threshold, focus)

Accent at full saturation on more than one element per frame = visual noise. Position is explicit: choose which element gets accent. Do not default to "first series = accent, rest = dimmed accent."

**Phase 8 check:** No automated check — semantic usage rule. Design-time guidance only.

---

### DPR-04: Ambient light on dark theme

**Before:** `ctx.fillStyle = t.bg; ctx.fillRect(0, 0, w, h);` (flat background)
**After:** Radial gradient from top-left corner creates physical depth.

**Canvas API:** `ctx.createRadialGradient`

**Rule:** Dark theme vizs have an ambient light source at top-left — the panel feels lit, not flat.

**Applies to:** Dark theme vizs — Futuristic, Luxury, Power mood especially.

**Phase 8 check:** WARN if absent on dark mood vizs.

**Minimum implementation:** See `drawAmbientLight` in [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) (DPR-04 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-05: Vignette edge darkening

**Before:** Flat background only.
**After:** Radial gradient from center fades to dark edges — draws eye to data.

**Canvas API:** `ctx.createRadialGradient`

**Rule:** Dark theme vizs have vignette darkening at edges.

**Applies to:** Dark theme vizs — draw after all background layers, before data elements.

**Phase 8 check:** WARN if absent on dark mood vizs.

**Minimum implementation:** See `drawVignette` in [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) (DPR-05 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-06: Glass panel

**Before:** Opaque filled rectangle.
**After:** Semi-transparent fill + highlight edge strip + subtle border.

**Canvas API:** `ctx.clip`, `ctx.createLinearGradient`, `roundRect`

**Rule:** Luxury and Futuristic mood vizs use glass panel simulation for panels containing data.

**Applies to:** Luxury / Futuristic mood — not applied to all moods.

**Phase 8 check:** WARN if Luxury/Futuristic viz has no semi-transparent panel fill.

**Minimum implementation:** See `drawGlassPanel` in [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) (DPR-06 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-07: Noise grain micro-texture

**Before:** Solid background.
**After:** Subtle pixel noise layer — makes flat digital surfaces feel physical.

**Canvas API:** `ctx.getImageData`, `ctx.putImageData`

**Rule:** Organic and Luxury mood vizs include noise grain for tactile depth. ALWAYS cache to offscreen canvas — do not regenerate every frame.

**Applies to:** Organic / Luxury mood.

**Phase 8 check:** WARN if Organic/Luxury viz has no `getImageData`/`putImageData` or cached noise.

**Minimum implementation:** See `drawNoiseTexture` in [texture-recipes.md](../../vp-recipes/references/texture-recipes.md) (DPR-07 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-08: Cinematic letter spacing

**Before:** `ctx.fillText('LABEL', x, y);` (default spacing)
**After:** Character-by-character `drawSpacedText` with 4px inter-character gap.

**Canvas API:** `ctx.measureText` (per character), `ctx.fillText` (per character)

**Rule:** Whisper-tier uppercase labels use cinematic letter spacing via drawSpacedText.

**Applies to:** Whisper-tier labels only — not hero values, not body text.

**Phase 8 check:** No automated check — visual quality rule.

**Minimum implementation:** See `drawSpacedText` in [typography-recipes.md](../../vp-recipes/references/typography-recipes.md) (DPR-08 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-09: Gradient mesh backgrounds

**Before:** Single-color background.
**After:** Two overlapping radial gradients at opposite corners create rich depth.

**Canvas API:** `ctx.createRadialGradient` (two instances)

**Rule:** Futuristic and Luxury mood vizs use gradient mesh backgrounds.

**Applies to:** Futuristic / Luxury mood.

**Phase 8 check:** WARN if Futuristic/Luxury viz has single-color background.

**Minimum implementation:** See `drawGradientMesh` in [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) (DPR-09 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

### DPR-10: Geometric accent lines

**Before:** No background geometry.
**After:** Dashed crosshairs and corner brackets give technical/precision context.

**Canvas API:** `ctx.setLineDash`, `ctx.beginPath`, `ctx.stroke`

**Rule:** Precision and Power mood vizs have geometric accent lines behind data.

**Applies to:** Precision / Power mood.

**Phase 8 check:** No automated check — visual quality rule.

**Minimum implementation:** See `drawAccentLines` in [depth-recipes.md](../../vp-recipes/references/depth-recipes.md) (DPR-10 section). Also in [mood-recipes.md](../../vp-recipes/references/mood-recipes.md).

---

## Quick reference

| DPR | Rule name | Recipe file | Phase 8 check |
|-----|-----------|-------------|---------------|
| DPR-01 | 3-tier typography hierarchy | (inline above) | DQG-03 FAIL |
| DPR-02 | Tinted neutral backgrounds | texture-recipes.md | DQG-04 WARN |
| DPR-03 | Gradient fills on data elements — see DPR-03b for accent/series separation | (inline above) | DQG-01 WARN |
| DPR-03b | Accent vs series color separation | (inline above) | (design-time) |
| DPR-04 | Ambient light on dark theme | depth-recipes.md | DQG-04 WARN |
| DPR-05 | Vignette edge darkening | depth-recipes.md | DQG-05 WARN |
| DPR-06 | Glass panel | texture-recipes.md | DQG-06 WARN |
| DPR-07 | Noise grain micro-texture | texture-recipes.md | DQG-07 WARN |
| DPR-08 | Cinematic letter spacing | typography-recipes.md | (visual) |
| DPR-09 | Gradient mesh backgrounds | depth-recipes.md | DQG-09 WARN |
| DPR-10 | Geometric accent lines | depth-recipes.md | (visual) |
