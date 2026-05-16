# Consistency Grid

**Load:** MUST-LOAD for every viz generation.
**Scope:** Cross-viz consistency contract — ensures all vizs in a pack share spacing, hover, typography, corners, and color tokens.
**CON-CHECK items** map to Phase 8 `check_design.js` compliance validation.

---

### CON-01: Spacing grid

**Formula:** `Math.max(4, Math.round(w * 0.025)) * spacingMultiplier`

**spacingMultiplier values (from Visual Language spacing category):**

| Visual Language spacing | multiplier |
|-------------------------|------------|
| tight                   | 0.7        |
| balanced                | 1.0        |
| airy                    | 1.4        |

**Implementation (from theme.js):**

`getSpacing` is defined in theme-template.md (Phase 6 addition, Plan 03). The spacingMultiplier is applied by the viz after calling getSpacing.

```javascript
// theme.getSpacing returns the base unit; multiply by spacingMultiplier
var sp = theme.getSpacing(w);
var gap = sp;       // gap between elements
var pad = sp * 2;   // edge padding

// With Visual Language multiplier (e.g., airy = 1.4):
var spacingMultiplier = 1.0; // from Visual Language output
var gap = sp * spacingMultiplier;
var pad = sp * 2 * spacingMultiplier;
```

**CON-CHECK-01:** Every viz in a pack calls `theme.getSpacing(w)` for all padding and gap values — no hardcoded pixel constants for layout spacing.

---

### CON-02: Hover behavior

**Formula:** `withAlpha(t.accent, theme.getHoverAlpha())` for hover fill; cursor style `'pointer'`.

**Implementation:**

`getHoverAlpha` returns `0.12` — defined in theme-template.md (Phase 6 addition, Plan 03).

```javascript
var hoverFill = withAlpha(t.accent, theme.getHoverAlpha());

// In _onMouseMove or hover detection:
if (hoveredIndex >= 0) {
    ctx.fillStyle = hoverFill;
    ctx.fill();
    this.el.style.cursor = 'pointer';
} else {
    this.el.style.cursor = 'default';
}
```

**CON-CHECK-02:** Every viz with hover interaction uses `theme.getHoverAlpha()` — no hardcoded `0.12` or other alpha values for hover highlight.

---

### CON-03: Typography scale

**Formula:** `theme.getTypoScale(w, h)` returns `{hero, body, whisper}` where:
- hero = `Math.max(36, Math.min(72, dim * 0.35))`
- body = `Math.max(14, Math.min(24, dim * 0.14))`
- whisper = `Math.max(8, Math.min(11, dim * 0.07))`

(where `dim = Math.min(w, h)`)

`getTypoScale` is defined in theme-template.md (Phase 6 addition, Plan 03).

**Implementation:**

```javascript
var typo = theme.getTypoScale(w, h);

// Hero value — bold, full opacity
ctx.font = 'bold ' + typo.hero + 'px ' + theme.FONTS.data;
ctx.fillStyle = t.text;

// Body text — regular, dimmed
ctx.font = typo.body + 'px ' + theme.FONTS.data;
ctx.fillStyle = t.textDim;

// Whisper labels — uppercase, faint
ctx.font = typo.whisper + 'px ' + theme.FONTS.ui;
ctx.fillStyle = t.textFaint;
ctx.fillText(label.toUpperCase(), x, y);
```

**Font family constraint:** Always use `theme.FONTS.data` for data values, `theme.FONTS.ui` for labels, `theme.FONTS.mono` for numeric codes.

**CON-CHECK-03:** Every viz uses `theme.getTypoScale(w, h)` for all font size calculations — no hardcoded px values for hero/body/whisper text.

---

### CON-04: Corner radius

**Formula:** Corner radius values derive from Visual Language `cornerRadius` category.

**Mapping table:**

| Visual Language cornerRadius | value |
|------------------------------|-------|
| sharp                        | 0     |
| soft                         | 4     |
| rounded                      | 8     |
| pill                         | `Math.min(w, h) / 2` |

**Implementation:**

```javascript
// cornerRadius from Visual Language — use consistently across all vizs
var cr = 4; // from brand's Visual Language cornerRadius (e.g., "soft")

// Apply to all roundRect calls in the pack
roundRect(ctx, x, y, w, h, cr);
ctx.fill();

// For pill-shaped elements (status badges, chips):
var pillR = Math.min(badgeW, badgeH) / 2;
roundRect(ctx, bx, by, badgeW, badgeH, pillR);
```

**CON-CHECK-04:** All `roundRect()` calls in a viz pack use the same `cornerRadius` value — consistent with Visual Language `cornerRadius` category.

---

### CON-05: Color token usage

**Rule:** All vizs reference `shared/theme.js` for all color values — no inline hex codes in `visualization_source.js`.

**Implementation:**

```javascript
// CORRECT — all colors from theme
var t = theme.getTheme(isDark);
ctx.fillStyle = t.accent;     // brand primary
ctx.fillStyle = t.bg;         // background
ctx.fillStyle = t.text;       // primary text
ctx.fillStyle = t.textDim;    // secondary text (60-80%)
ctx.fillStyle = t.textFaint;  // whisper text (25-35%)
ctx.fillStyle = t.panel;      // panel backgrounds
ctx.fillStyle = t.border;     // borders and separators

// WRONG — inline hex codes
ctx.fillStyle = '#1A1A2E';    // NEVER do this
ctx.fillStyle = '#E94560';    // NEVER do this
```

**grep check:** `grep -v '^[[:space:]]*//' visualization_source.js | grep -c "#[0-9A-Fa-f]\{6\}"` should return `0`.

**CON-CHECK-05:** Running `grep -v '^[[:space:]]*//' visualization_source.js | grep -c "#[0-9A-Fa-f]\{6\}"` returns 0 — no inline hex codes outside comments.

---

## Compliance summary

| Rule | Function | Phase 8 check | grep command |
|------|----------|---------------|--------------|
| CON-01 | `theme.getSpacing(w)` | DQG-03 (spacing) | `grep "getSpacing" visualization_source.js` |
| CON-02 | `theme.getHoverAlpha()` | DQG-04 (hover) | `grep "getHoverAlpha" visualization_source.js` |
| CON-03 | `theme.getTypoScale(w, h)` | DQG-03 (typo) | `grep "getTypoScale" visualization_source.js` |
| CON-04 | `roundRect(ctx, ..., cr)` | DQG-05 (radius) | `grep "roundRect" visualization_source.js` |
| CON-05 | `theme.getTheme(isDark)` | DQG-06 (tokens) | `grep -v '^\s*//' viz.js \| grep -c "#[0-9A-Fa-f]\{6\}"` |
