# Domain Pitfalls: v5.1.0 Viz Hardening & Dashboard Wow-Factor

**Domain:** Splunk custom visualizations (Canvas 2D, AMD, ES5) — adding formatter wiring fixes, new controls, animation toggle fixes, blueprint loosening, and unique preview.png generation to an existing system
**Researched:** 2026-05-18
**Confidence:** HIGH — drawn from real bugs in tests 21-28 (HANDOVER.md), 23 B-series rules (broken-rules.md), 12 F-series rules (fatal-rules.md), animation-recipes.md, formatter-patterns.md, edge-cases.md, and v5.1.0 milestone goal analysis

---

## Critical Pitfalls

Mistakes that cause rewrites, silent renders, or complete feature failure.

---

### CP-01: opt() misses short-key delivery path — new formatter controls silently ignored

**What goes wrong:** A newly wired formatter control (`showZoneColor`, `pagination`, `flashCritical`) works when changed in the Format panel but has zero effect when set in dashboard JSON `"options"`, or vice versa.

**Why it happens:** Splunk delivers config values via two distinct paths:
- Dashboard JSON `"options"` block: full-namespaced keys — `"myapp.myviz.showZoneColor": "true"`
- Format panel user changes: short keys — `"showZoneColor": "true"` (no namespace prefix)

The `opt()` shorthand in the SKILL.md viz template only checks `config[ns + key]`. New controls wired using this shorthand miss the short-key path. The bug is invisible if you only test one path.

**Root cause confirmed:** broken-rules.md B3: "Formatter settings ignored after first load — Config reads miss short-key path."

**Prevention:** Every new formatter control read MUST use the two-path `getOption` pattern from formatter-patterns.md:
```javascript
function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}
```
The inline `opt()` in vp-viz SKILL.md template is a convenience shorthand — it does NOT check both paths. For v5.1.0 wiring fixes, use `getOption` or verify the template `opt()` has been updated to check both paths.

**Detection:** Test each new control (a) in dashboard JSON `"options"` and (b) in the Format panel — both paths must produce the expected visual change. If it works in one but not the other, the two-path pattern is missing.

**Phase:** Formatter wiring fixes phase — applies to every control being fixed or added.

---

### CP-02: Animation entrance off-path leaves `_entranceProgress` at 0 — gauge stuck at zero

**What goes wrong:** Setting `showEntrance=false` in formatter makes the gauge render at 0 (or blank) instead of the actual data value. Disabling the animation appears to break the viz.

**Why it happens:** The animation system sets `this._entranceProgress = 0` in `initialize()`. The rAF loop drives it from 0 to 1 during the entrance. The draw code multiplies arc angles (or bar heights) by `_entranceProgress`. When `showEntrance=false`, the rAF never starts — so `_entranceProgress` stays at 0 forever. The viz renders a gauge arc of 0 degrees.

**This is the specific bug named in the v5.1.0 milestone goal: "Fix entrance-animation-off breaks gauge rendering (stuck at 0)."**

The animation-recipes.md `rAF entrance pattern` shows the `if (showEntrance && !_entranceDone)` start path but does NOT show the else branch. The else branch must be made explicit.

**Prevention:** When `showEntrance=false`, immediately set `this._entranceDone = true` AND `this._entranceProgress = 1` in `updateView` BEFORE any drawing:
```javascript
if (prefersReducedMotion()) { this._entranceDone = true; }
var showEntrance = opt('showEntrance', 'true') === 'true';
if (!showEntrance) {
    this._entranceDone = true;
    this._entranceProgress = 1;  // REQUIRED: render final state, not zero state
}
// Only start entrance if not yet done AND enabled
if (showEntrance && !this._entranceDone) { this._startEntrance(config, ns); }
```

**Detection:** Set `showEntrance=false` in formatter, reload panel. Viz MUST show actual data immediately. Grep for every use of `_entranceProgress` as a draw multiplier — each must be reachable with value 1 on the off-path.

**Phase:** Animation toggle fixes phase — every viz with entrance animation needs this audit.

---

### CP-03: Color picker reads missing hexFromSplunk — zone/hover colors ignored or wrong

**What goes wrong:** New zone color controls (`detractorColor`, `passiveColor`, `promoterColor`) or hover color controls are wired in the formatter but produce wrong colors in the viz. The color picker shows the right swatch but the viz uses a garbled color or the theme default.

**Why it happens:** Splunk delivers `<splunk-color-picker>` values as integers, not hex strings. The value `#0077B6` is delivered as `30646` (decimal). Reading it with `config[ns + 'detractorColor']` returns `"30646"`. Using this directly as `ctx.fillStyle` renders black (invalid color string). The fix — `hexFromSplunk(val, fallback)` — converts Splunk integer format to hex.

**Root cause confirmed:** broken-rules.md B22: "Color picker value ignored (reads as integer)."

**Prevention:** Every `<splunk-color-picker>` control read MUST use `hexFromSplunk`:
```javascript
var zoneColor = hexFromSplunk(opt('detractorColor', ''), t.error);
```
Never use `opt('detractorColor', '#FF0000')` directly as a color value. The B22 rule is the most commonly missed for any NEW color control added to an existing viz.

**Detection:** In ad-hoc search mode, open Format panel, change a color picker value, observe the viz. If the color does not change to the selected value, `hexFromSplunk` is missing. The symptom can be subtle — Splunk integers that happen to produce valid (but wrong) hex colors.

**Phase:** Formatter wiring fixes phase. Any phase adding color controls. Also applies when adding zone color controls to Ring Gauge per viz-blueprints.md.

---

### CP-04: flashCritical LED pulse never stops when severity clears

**What goes wrong:** Data updates and removes all critical rows, but the LED pulse animation continues indefinitely. The formatter `flashCritical` toggle cannot stop a pulse that started from real data.

**Why it happens:** The `_startPulse()` / `_stopPulse()` pattern from animation-recipes.md requires the severity check to run unconditionally on EVERY `updateView` call. If the check is inside a conditional block (e.g., `if (!this._entranceDone)`, or `if (data !== this._lastData)`), `_stopPulse()` is never called when severity drops.

**Prevention:** The severity check and the start/stop decision MUST be unconditional in `updateView`:
```javascript
// REQUIRED: runs on EVERY updateView, not inside any conditional
var flashCritical = opt('flashCritical', 'false') === 'true';
var hasCritical = false;
for (var i = 0; i < data.rows.length; i++) {
    var sev = safeStr(data.rows[i][severityIdx]).toLowerCase();
    if (sev === 'critical' || sev === 'error') { hasCritical = true; break; }
}
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    this._startPulse(700);
} else {
    this._stopPulse();  // explicitly stops when condition no longer met
}
```
`_startPulse` has `if (this._pulsing) { return; }` to prevent double-loop. The issue is that `_stopPulse` is never reached, not that `_startPulse` runs twice.

**Detection:** Feed data with critical rows, observe pulse starts. Then update data to remove critical rows. Pulse must stop on the next `updateView`. If pulse continues, the stop path is inside a conditional.

**Phase:** Animation toggle fixes phase. Also applies to any new "critical indicator" feature in v5.1.0.

---

### CP-05: Blueprint loosening produces formatter controls with no visual effect — passes D08 but does nothing

**What goes wrong:** When viz-blueprints.md is made less prescriptive (KPI creative freedom), Claude generates novel formatter controls (e.g. `showMetricRing`, `labelPosition`) that pass D08 bidirectional wiring check but have zero visual effect. The `opt()` read exists; the variable is never passed to a draw call.

**Why it happens:** D08 (check_design.js) validates that formatter key strings appear somewhere in viz source — it cannot verify the variable is used on an active code path. When Claude invents a new control during blueprint loosening, it sometimes writes the `opt()` read but forgets to use the variable in the render code. The LLM treats "I read the setting" as equivalent to "I implemented the setting."

**Prevention:**
- Every `opt()` read for a new control must appear within visual proximity of the draw code it controls. A comment stating what the control affects is mandatory:
  ```javascript
  // labelPosition: 'top'/'center'/'bottom' — sets textY offset in _drawValue
  var labelPosition = opt('labelPosition', 'center');
  ```
- After writing any new control, trace the variable: `opt() → variable → if/switch → affects ctx.*` — the chain must be complete. If the variable appears only in the `opt()` read, the wiring is incomplete.

**Detection:** Open Format panel, change the new control, observe render. If nothing changes, the opt() read is a dead variable. This cannot be caught by automated tools.

**Phase:** Any phase that modifies viz-blueprints.md or loosens KPI/gauge creative constraints.

---

## Moderate Pitfalls

---

### MP-01: Identical preview.png across vizs in a pack — picker becomes useless

**What goes wrong:** All vizs in a generated pack have preview.png files that look identical — same color block, same stripe pattern, no shape distinction. The Splunk custom viz picker cannot be used to identify which viz is which.

**Why it happens:** The v4.1.0 `generate_assets.js` generates brand-colored 300x200 rectangles with accent stripes for variety. Stripes are not shape-distinct. A gauge preview and a table preview look the same if both are "dark rectangle with orange diagonal stripe."

**This is a named v5.1.0 milestone goal: "Generate unique preview.png per viz (no duplicates)."**

**Prevention:** Each preview.png must render a Canvas 2D silhouette recognizable as the viz type:
- Gauge: arc shape in accent color
- Bar chart: 3-5 vertical columns of varying height
- Table: horizontal lines suggesting rows and header
- KPI: large centered text block
- Status grid: dot matrix arrangement

The silhouette does not need real data. Use brand accent color on dark background. Minimum: two vizs in the same pack must not look like the same image.

**Detection:** Load all generated preview.png files side by side. Any two that are visually indistinguishable (same composition, only hue shifted) fail this requirement.

**Phase:** Preview.png phase. Also check generate_assets.js does not share a single template for all viz types.

---

### MP-02: Dashboard absolute positioning breaks at non-1920 screen widths

**What goes wrong:** Generated dashboard JSON uses absolute `x`, `y`, `w`, `h` values designed for 1920x1080. At 1280px browser width, right-side panels fall off-canvas. At 4K, panels cluster in a small corner.

**Why it happens:** Dashboard Studio v2 JSON uses absolute pixel coordinates. The 1920x1080 canvas minimum is enforced by the SKILL.md pre-code checklist, which prevents undersized canvases — but does not prevent panels placed at coordinates outside the visible region at other resolutions.

**Consequences:** Dashboard composition work ("story, depth, background, professional layout") looks broken on screens that are not exactly 1920px wide. The most common test machine — a MacBook at 1440px — will show obvious layout failures for panels near the right edge.

**Prevention:**
- Keep all data panels within `x: 0-1820` (100px margin), `y: 0-980` (100px margin).
- Background decorative elements (gradients, hero imagery, structural shapes) CAN bleed to full 1920x1080.
- Treat 1820x980 as the safe zone for interactive panels.

**Phase:** Dashboard composition phase. Applies to any new layout generated for v5.1.0.

---

### MP-03: showHoverEffect=false — mousemove handler still calls invalidateUpdateView

**What goes wrong:** When `showHoverEffect=false` is set in formatter, the hover highlight disappears from the render. But the `mousemove` handler still fires on every pixel movement and calls `invalidateUpdateView()`, causing 60fps redraws while the mouse moves. CPU spikes on vizs with hover disabled.

**Why it happens:** The hover transition pattern in animation-recipes.md checks `showHoverEffect` inside `_startHoverTransition`. If `showHoverEffect=false`, the transition is skipped — but `_onMouseMove` still calls `_startHoverTransition`, and some implementations call `invalidateUpdateView()` before checking the flag.

**Prevention:** Store the hover flag as an instance property in `updateView`, early-exit in `_onMouseMove`:
```javascript
// In updateView:
this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

// In _onMouseMove:
_onMouseMove: function(e) {
    if (!this._showHoverEffect) return;  // early exit, no invalidate
    // ... hit test, update hover state, invalidate ...
}
```

**Phase:** Animation toggle fixes phase. Any viz with hover logic.

---

### MP-04: accentIntensity /100 vs /50 inconsistency in new code sections

**What goes wrong:** After adding new rendering code, glow effects in the new sections are twice as strong as existing effects in the same viz. The viz looks inconsistent.

**Why it happens:** v5.0.0 standardized on `/100` scaling (D-05), superseding the older `/50` pattern from mood-recipes.md. The supersession note exists in the SKILL.md template comment but is easy to miss when copying patterns from older files. Result: `gi = value / 50` (range 0-2) in old code, `gi = value / 100` (range 0-1) in new code.

**Prevention:** The SKILL.md template has the canonical note:
```
// NOTE: mood-recipes.md shows /50 (gi range 0-2) — that pattern is SUPERSEDED by D-05.
// Always use /100 in generated code.
```
Before committing any new rendering code that reads `accentIntensity`, grep the new code for `/50`. If found, change to `/100`.

**Phase:** Any phase adding new rendering code alongside existing code.

---

### MP-05: New formatter section with wrong section-label casing — entire section invisible

**What goes wrong:** A new formatter section is added for pagination controls or sparkline controls. The section is syntactically valid but completely invisible in the Format panel.

**Why it happens:** Splunk's formatter engine is case-sensitive on `section-label` values. The approved values are: `"Data configurations"`, `"Data display"`, `"Color and style"`, `"Effects"`, `"Animation"`. Any deviation — `"Data Display"` (capital D), `"Visual effects"`, `"Sparkline"` — causes silent section drop.

**Root cause confirmed:** formatter-patterns.md wrong/right casing table documents exactly this pitfall.

**Prevention:** Only use approved section labels. For new controls that do not fit existing sections, place them in `"Data display"` (behavioral toggles) or `"Effects"` (visual toggles). The B5 repair loop fixes `type="custom"` and `section-label` class attribute — it does NOT fix wrong label values.

**Detection:** Only detectable by opening the Format panel in Splunk. Automated checks cannot validate label correctness.

**Phase:** Any phase adding formatter controls.

---

### MP-06: ctx.clearRect not called after canvas resize — ghost artifacts on re-render

**What goes wrong:** When a new rendering path or animation branch is added, ghost artifacts from the previous render remain visible on panel resize or specific Splunk refresh cycles.

**Why it happens:** `ctx.clearRect(0, 0, w, h)` must be called after canvas dimension setup and after `ctx.scale(dpr, dpr)` but before any draw calls. When new rendering code paths are added (especially for animation states), it is easy to enter a branch that skips back to a `_render()` sub-call, bypassing the clearRect at the top of `updateView`.

**Root cause confirmed:** The SKILL.md template explicitly places `ctx.clearRect(0, 0, w, h)` after `ctx.scale(dpr, dpr)` — this position is load-bearing.

**Prevention:** All rendering must flow from the single `updateView` entry point through one clearRect call. No sub-method should call clearRect independently. If adding a conditional render path, verify the path does not skip the canonical `updateView` setup block.

**Phase:** Any phase modifying render paths.

---

## Minor Pitfalls

---

### MIN-01: Preview PNG background transparent instead of dark — looks wrong in Splunk dark UI

**What goes wrong:** Generated preview.png files look correct in an image viewer but appear with a white background when displayed in Splunk's custom viz picker (which is dark-themed).

**Why it happens:** The pure-JS PNG encoder in `generate_assets.js` defaults to RGB without alpha. Splunk's viz picker does not fill transparent areas with a matching dark color.

**Prevention:** Always paint an explicit dark background (brand dark background color) as the bottom layer in the preview canvas. Do not rely on alpha compositing with the Splunk UI.

**Phase:** Preview.png phase.

---

### MIN-02: Sparkline height formatter control interpreted as pixels — overflows small panels

**What goes wrong:** New `sparklineHeight` control is set to 30. Sparkline renders correctly at 300px panel height but overflows at 150px.

**Why it happens:** The control value is treated as raw pixels instead of percentage of panel height. All sizing must follow `Math.max(floor, h * ratio)` pattern (pre-code checklist item, and B8 rule).

**Prevention:** Interpret sparkline size controls as percentage of panel height (0-100), not pixels:
```javascript
var sparkH = Math.max(20, h * (safeNum(opt('sparklineHeight', '25'), 25) / 100));
```

**Phase:** New controls phase.

---

### MIN-03: Text placement controls — y offset not clamped — text exits panel bounds

**What goes wrong:** New `textPlacement` formatter option (top/center/bottom) on a KPI viz. Choosing "top" at a very small panel size causes the value text to render above the panel top edge.

**Why it happens:** Text placement logic adjusts `y` coordinates without verifying the result stays within panel bounds. `measureText()` prevents text overflow at the draw position but does not prevent out-of-bounds placement when offsets are applied.

**Prevention:** Clamp all placement-derived y coordinates:
```javascript
var textY = placement === 'top' ? pad + heroSize
          : placement === 'bottom' ? h - pad - heroSize
          : h / 2;
textY = Math.max(heroSize + pad, Math.min(h - pad, textY));
```

**Phase:** New controls phase.

---

### MIN-04: Flexible status values — case-sensitive match misses user-configured variants

**What goes wrong:** User configures `criticalLabel=CRITICAL` (uppercase). Data contains `critical` (lowercase). Match fails, no LED pulse, no color coding.

**Why it happens:** The animation-recipes.md LED pulse pattern normalizes severity with `.toLowerCase()` for built-in values (`'critical'`, `'error'`). New configurable label matching skips normalization, breaking case-insensitive user input.

**Prevention:** Always normalize both the configured label and the data value to lowercase before matching:
```javascript
var criticalLabel = opt('criticalLabel', 'critical').toLowerCase();
var sev = safeStr(row[severityIdx]).toLowerCase();
if (sev === criticalLabel) { hasCritical = true; }
```

**Phase:** New controls phase (flexible status values feature).

---

### MIN-05: Animation timer cleanup missing from destroy() — memory leak as panels accumulate

**What goes wrong:** CPU usage increases as more animated panels are opened in a dashboard session. Console errors appear after navigating away.

**Why it happens:** `requestAnimationFrame` requires a flag pattern to cancel, not a direct ID (unlike `clearInterval`). When adding new animation loops, the corresponding `destroy()` cleanup is easy to omit. The animation-recipes.md rAF pattern shows the cancel flag but relies on the developer remembering to set it in `destroy()`.

**Root cause confirmed:** broken-rules.md does not list this directly, but animation-recipes.md explicitly requires `this._animating = false` in `destroy()`.

**Prevention:** Every new animation loop (`_startPulse`, `_startEntrance`, `_startHoverTransition`) must have a corresponding cancel line in `destroy()`. Make this a checklist item when adding any animation: "Did I add `this._[flag] = false` to destroy()?"

**Phase:** Animation toggle fixes phase. Any phase adding new animation patterns.

---

## Phase-Specific Warning Table

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Formatter wiring bug fixes (zone color, hover toggle, accentIntensity) | CP-01 (two-path opt), CP-03 (hexFromSplunk missing for color pickers) | Use getOption pattern; audit every color picker read for hexFromSplunk |
| Animation toggle-off fixes (entrance animation, flashCritical) | CP-02 (entrance progress=1 when off), CP-04 (stop pulse unconditionally) | Explicit `_entranceProgress = 1` on off-path; unconditional stopPulse |
| flashCritical LED pulse visual prominence | CP-04 | Severity check must be unconditional in updateView, not inside guards |
| hover toggle wiring | MP-03 | Early-exit in _onMouseMove when _showHoverEffect is false |
| New controls: pagination, text placement, sparkline | CP-05 (dead formatter key), MIN-02, MIN-03 | Trace opt() read to ctx.* call; percentage not pixels for sizing |
| Flexible status values | MIN-04 | Lowercase normalization on both sides of comparison |
| Loosening KPI blueprint | CP-05 | Mandatory comment above every new opt() read stating what it controls visually |
| Unique preview.png generation | MP-01, MIN-01 | Shape silhouette per viz type; explicit dark background fill |
| Dashboard composition / layout | MP-02 | Keep interactive panels within 1820x980 safe zone |
| Any new code reading accentIntensity | MP-04 | Always /100; grep new code for /50 before committing |
| Any new rendering paths (glow, shadow, effects) | MP-06, existing ECR-05 | Verify clearRect still runs; ctx.save/restore around every shadow block |
| New formatter sections | MP-05 | Only use approved section-label values from formatter-patterns.md |
| New animation loops | MIN-05 | Add cancel flag to destroy() for every new loop |

---

## "Looks Done But Isn't" Checklist (v5.1.0 specific)

- [ ] **Entrance animation off:** `showEntrance=false` in formatter → viz shows actual data (not zero/blank). `_entranceProgress` is 1 on off-path.
- [ ] **Color picker wiring:** New zone color control changed in Format panel → viz uses that color. `hexFromSplunk` wraps every color picker read.
- [ ] **Two-path opt:** New formatter control set in dashboard JSON `"options"` → viz responds. Also works from Format panel change.
- [ ] **Pulse stops:** Critical data load → pulse starts. Remove critical data → pulse stops on next updateView.
- [ ] **Hover toggle:** `showHoverEffect=false` → no CPU spike when moving mouse over viz. `_onMouseMove` early-exits.
- [ ] **Preview distinctness:** All preview.png files in pack look different (different shapes, not just colors). No two are visually identical.
- [ ] **accentIntensity scale:** New rendering code uses `/100` not `/50` for gi calculation.
- [ ] **New section label:** Any new formatter section uses only approved `section-label` values.
- [ ] **New animation loop:** `destroy()` has a cancel flag set for every animation started in the fix.

---

## Sources

- `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` — B3, B6, B22 root causes
- `plugins/splunk-viz-packs/skills/vp-debug/references/fatal-rules.md` — F-series fatal patterns
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — two-path opt, section-label casing table, hexFromSplunk
- `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md` — ECR-01 through ECR-05 (save/restore, pagination, null guards)
- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` — LED pulse start/stop, rAF entrance flag pattern
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — pre-code checklist, D-05 accentIntensity /100 note, clearRect placement
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — Ring Gauge zone colors, animation settings per type
- `tests/test28_drilldown_tabs/HANDOVER.md` — real bugs: hardcoded field names in event handlers, 1x1 preview PNGs
- `.planning/PROJECT.md` — v5.1.0 milestone goal list (named bugs)
- `.planning/REQUIREMENTS.md` — ANI-01 through ANI-06 animation requirements

---

*v5.1.0 pitfalls research*
*Researched: 2026-05-18*
