# Canvas port — the six fidelity rules

This file is the test44 structural fix at the code level. The test44 finding was:

> *"I default to the obvious geometric implementation of each concept rather than studying what the concept actually looks like and reproducing its visual character."*

These six rules force the agent to translate from the HTML mockup, not reimagine.

## Rule 1: Read `visual_reference_html` BEFORE writing any Canvas code

Open `.cv/<app_id>/DESIGN-LOCK.md`. Find the viz you're porting. Read its `visual_reference_html` block IN FULL. Do not paraphrase. Do not summarize. Re-read it if needed.

Paste the dark-theme block as a comment immediately above `_renderDark` in the source file:

```javascript
    // === VISUAL REFERENCE (dark theme) ===
    // Source: DESIGN-LOCK.md vizs[].visual_reference_html
    //
    // <div class="ers-gauge">
    //   <div class="terminal-top"></div>
    //   <div class="segments">
    //     <div class="seg seg--full" style="background:linear-gradient(180deg,#00D26A,#008844)"></div>
    //     ...
    //   </div>
    //   <div class="terminal-bottom"></div>
    // </div>
    // <style>
    //   .ers-gauge { filter: drop-shadow(0 0 16px rgba(0,210,106,0.3));
    //                animation: ers-breathe 3s ease-in-out infinite; }
    //   @keyframes ers-breathe { ... }
    // </style>
    //
    _renderDark: function(ctx, data, t, w, h, opt) {
        // your Canvas translation goes here
    }
```

This comment block is your contract while you write the Canvas code.

## Rule 2: Translate, don't reimagine

For each CSS property in the reference, find the Canvas equivalent and use the EXACT VALUES from the CSS:

| CSS | Canvas |
|---|---|
| `background: linear-gradient(180deg, #A, #B)` | `var g = ctx.createLinearGradient(x, y, x, y+h); g.addColorStop(0, "#A"); g.addColorStop(1, "#B"); ctx.fillStyle = g;` |
| `filter: drop-shadow(0 0 Npx <rgba>)` | `ctx.shadowBlur = N; ctx.shadowColor = "<rgba>";` (remember to `ctx.shadowBlur = 0` after) |
| `border-radius: Npx` | use a `roundRect(ctx, x, y, w, h, N)` helper |
| `font: <weight> <size>px <family>` | `ctx.font = "<weight> <size>px <family>";` |
| `text-transform: uppercase` | `ctx.fillText(label.toUpperCase(), x, y)` |
| `letter-spacing: Npx` | hand-stroke each character with `measureText` (no native API; document trade-off) |
| `animation: <name> Ns <easing>` | `requestAnimationFrame` loop with N*1000 ms cycle and matching easing function |
| `:hover { background: X }` | hit-test in `_onMouseMove`, then `ctx.fillStyle = X` on the hovered element |

If your code uses a different hex than the CSS, that's a bug. If your code uses `shadowBlur = 8` when the CSS says `drop-shadow(0 0 16px ...)`, that's a bug.

## Rule 3: Document any CSS feature that doesn't translate cleanly

Some CSS effects are expensive or impossible in Canvas. When you encounter one, decide and document:

- `filter: blur(8px)` on a div → either skip (note in comment) or pre-render the blurred element as a PNG asset
- `backdrop-filter: blur(...)` → not available; use a semi-transparent fill of the background color as an approximation
- CSS keyframe animations with multiple properties — implement the most important one(s); document the rest

Example comment:

```javascript
    // NOTE: CSS reference uses `backdrop-filter: blur(20px)` for the glass panel.
    // Canvas has no equivalent; approximating with rgba(11,14,20,0.65) fill +
    // top highlight line. Acceptable trade-off because the panel is small.
```

## Rule 4: Animations declared in the spec MUST be implemented (and MUST NOT crash Splunk)

If `visual_spec.effects.<animation>` exists in DESIGN-LOCK.md, you MUST implement it. Animations are not optional polish.

### CRITICAL — never call `invalidateUpdateView()` inside `requestAnimationFrame`

`SplunkVisualizationBase.invalidateUpdateView()` calls `updateView(this._data, this._config)` **synchronously** in several Splunk versions. The next `updateView` call re-schedules another RAF, which re-enters during certain framework events (drilldown click during pulse, reflow during alert pulse, theme switch during pulse) → **"Maximum call stack size exceeded"**. The Patrol Coverage panel in `wwf_field_ops_viz` (2026-05-25) shipped with exactly this pattern and crashed on every dashboard reload.

DO NOT EMIT THIS PATTERN. Use the safe pattern below.

### Safe animation pattern — cached config + direct re-call

The boilerplate `updateView` caches `data` and `config` on `this._lastGoodData` / `this._lastConfig`. The RAF callback re-invokes `this.updateView(this._lastGoodData, this._lastConfig)` directly — bypassing Splunk's invalidate pipeline so there is no synchronous re-entry.

```javascript
    _renderDark: function(ctx, data, t, w, h, opt) {
        var self = this;

        // ... static rendering ...

        // Continuous animation (breath, pulse, ring expand, etc.)
        if (opt("showBreathe", "true") !== "false") {
            if (!this._animationFrameId) {
                this._animationFrameId = requestAnimationFrame(function() {
                    self._animationFrameId = null;
                    // Re-render with cached args. NEVER use invalidateUpdateView() —
                    // it can re-enter synchronously and blow the stack.
                    if (self._lastGoodData && self._lastConfig) {
                        self.updateView(self._lastGoodData, self._lastConfig);
                    }
                });
            }
        }
    }
```

Compute the animation phase inside `_renderDark` using `Date.now()` or `performance.now()` modulo the cycle length from the spec — no need for a separate `_breathStart` field. Example:

```javascript
        var now = performance.now();
        var phase = (now % 3000) / 3000;            // 0..1 over 3s
        var blur  = 16 + (28 - 16) * (0.5 + Math.sin(phase * Math.PI * 2) * 0.5);
        ctx.shadowBlur = blur;
        // ... draw ...
        ctx.shadowBlur = 0;
```

`destroy()` in the boilerplate already clears `_animationFrameId` and `_pulseIntervalId`. For `flashCritical`-style pulses with a slow cadence (≥ 1s), prefer `setInterval` + the same cached-arg re-call inside the interval callback. Same rule applies: NEVER call `invalidateUpdateView()` from a timer.

### Why this matters

`validate.sh` will FAIL any viz that contains `invalidateUpdateView()` inside a `requestAnimationFrame` or `setInterval` callback. If your animation needs to re-trigger the render pipeline, use the cached-arg pattern above.

## Rule 5: Light theme is NEVER derived from dark

`_renderDark` and `_renderLight` are independent functions. They share no state. They MUST NOT use a single parameterized render with `if (isDark)` branches inside.

Why: the test44 failure mode was treating light theme as "dimmed dark" — applying the same effects with reduced alpha. This produced unreadable ghost-text because the CSS effects that work on dark surfaces (carbon overlay at 0.04 opacity, ambient glow) destroy text on white surfaces.

`_renderLight` reads from `t` (which is `LIGHT` from theme.js) AND from `visual_spec.fills.background_light` (which often says `overlay: none`). When the spec says "no overlay on light", `_renderLight` does NOT draw the overlay.

If you find yourself sharing helper functions between the two render paths, that's fine — extract them as private methods. But the top-level render flow is two separate paths.

### Rule 5 implementation pattern — shared `_render<X>` helper

test52 (ASUS ROG) proved a clean way to share the legitimate common geometry between the two paths without collapsing them into one parameterized render. Keep `_renderDark` and `_renderLight` as the two real entry points, but let each delegate to a shared helper that takes an `isLight` flag — and branch every THEME-DEPENDENT effect with `if (!isLight)`:

```javascript
    _renderDark:  function(ctx, data, t, w, h, opt) { t = this._resolveTheme(t, opt); this._renderShared(ctx, data, t, w, h, opt, false); },
    _renderLight: function(ctx, data, t, w, h, opt) { t = this._resolveTheme(t, opt); this._renderShared(ctx, data, t, w, h, opt, true);  },
    _renderShared: function(ctx, data, t, w, h, opt, isLight) {
        // shared geometry both paths legitimately need
        if (!isLight) { /* dark-only ambient glow / carbon-fiber overlay */ }
    }
```

**This does NOT violate Rule 5.** Rule 5 forbids a single parameterized render that DERIVES light from dark by dimming the same effects — the shared helper here is the legitimate common geometry both paths genuinely need, while every theme-dependent EFFECT (ambient glow, carbon overlay) is properly branched out with `if (!isLight)` so light is never "dimmed dark."

## Rule 6: Compliance work is emitted by the boilerplate script

You do not write `safeStr`, `safeNum`, `hexFromSplunk`, `getOption`, `detectTheme`, `initialize`, `formatData`, `getInitialDataParams`, `reflow`, or `destroy`. Those are emitted by `boilerplate_emit.js` and you must not modify them.

Your output is ONLY:

- The `// VISUAL REFERENCE` comment blocks above `_renderDark` and `_renderLight`
- The body of `_renderDark`
- The body of `_renderLight`
- The body of `_onMouseMove` (hit-test + tooltip per `visual_spec.hover`)
- The body of `_onClick` (drilldown wiring if `interactions.drilldowns` references this viz)

That's it. Six functions, two of which already have skeleton helpers. Full creative attention goes to `_renderDark` and `_renderLight`.

This is the structural separation that fixes the test44 finding *"compliance work dominates, creative gets minimum viable."* The boilerplate is mechanical; the creative is everything.

### Sub-rule 6a: Cursor affordance is mandatory for drillable elements

If your viz wires any drilldown in `_onClick`, `_onMouseMove` MUST manage `this._canvas.style.cursor`:

```javascript
_onMouseMove: function(e) {
    // ... hit-test ...
    if (hitTestMatchedClickableElement) {
        // ... show tooltip ...
        this._canvas.style.cursor = "pointer";   // ← MANDATORY
        return;
    }
    this._tooltip.style.display = "none";
    this._canvas.style.cursor = "default";       // ← MANDATORY when leaving
}
```

Without this, drilldowns are invisible features — users don't know they exist until they accidentally click. The cursor IS the affordance.

## Rule 8: Defensive data access in `_render` and `_layout`

Splunk's framework may call `updateView(data, config)` with `data` shapes that look truthy but lack the fields you expect — most commonly `{}` (empty object, no `rows`, no `colIdx`) during dashboard initialization, theme switches, or token-triggered re-renders. Accessing `data.colIdx[fieldName]` then throws:

```
TypeError: Cannot read properties of undefined (reading 'collars_online')
```

This shipped in `wwf_field_ops_viz/active_collars` (2026-05-25). The intermittent failure was caused by the boilerplate's `if (!data)` guard not catching empty-object data shapes.

### Two layers of defense (both required)

**Layer 1 — boilerplate guard** (handled by `boilerplate_emit.js`):

```javascript
updateView: function(data, config) {
    if (!data || !data.rows || data.rows.length === 0 || !data.colIdx) {
        if (this._lastGoodData) data = this._lastGoodData;
        else return;
    }
    this._lastConfig = config;
    // ...
}
```

**Layer 2 — your `_layout` / `_render` MUST still defend**:

```javascript
_layout: function(data, w, h, opt) {
    var rows = data.rows || [];
    var ci   = data.colIdx || {};
    if (rows.length === 0) {
        return { /* sane empty-state shape */ };
    }
    // ...
}
```

The boilerplate guard catches the obvious case. Layer 2 catches the long tail: a row with a missing column, a `last[oIdx]` where `oIdx` is `undefined`, etc. Always default `rows` and `ci` to empty containers, always check `rows.length > 0` before dereferencing `rows[0]` or `rows[rows.length - 1]`.

## Rule 7: Every formatter color picker MUST be read in `_resolveTheme(t, opt)`

The formatter and Canvas form **one contract**, not two independent halves. If `formatter.html` emits a `splunk-color-picker` and the Canvas code uses `t.<theme_default>` without consulting `opt(...)`, the picker is dead UI — the user clicks, the value persists in dashboard config, the viz doesn't change a single pixel.

This bug has shipped in multiple test packs (Cisco viz, then WWF Field Ops 2026-05-25). It is silent — no validation FAIL, no console error.

### The required wiring

For every `<splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>" value="<hex>">` in `formatter.html`, add one line to `_resolveTheme(t, opt)`:

```javascript
_resolveTheme: function(t, opt) {
    var c = {};
    for (var k in t) if (t.hasOwnProperty(k)) c[k] = t[k];
    // For each color picker key in formatter.html:
    c.accent     = hexFromSplunk(opt("accentColor",       t.accent),   t.accent);
    c.brand_hi   = hexFromSplunk(opt("activeTopColor",    t.brand_hi), t.brand_hi);
    c.brand      = hexFromSplunk(opt("activeBottomColor", t.brand),    t.brand);
    c.muted      = hexFromSplunk(opt("offDutyColor",      t.muted),    t.muted);
    // Recompute derived alphas after override:
    c.accent_dim = theme.withAlpha(c.accent, 0.30);
    return c;
},
```

Then at the top of `_renderDark` and `_renderLight`:

```javascript
_renderDark: function(ctx, data, t, w, h, opt) {
    t = this._resolveTheme(t, opt);   // ← MUST be first line
    // ... rest of render uses t.* (now picker-aware)
},
```

### Naming convention

If the formatter key maps directly to a theme token (e.g. `accentColor` → `t.accent`), shadow the token. If the formatter key is viz-specific (e.g. `heroValueColor`), add a `_underscore` alias on `c`:

```javascript
c._heroValue = hexFromSplunk(opt("heroValueColor", t.text), t.text);
// then in render:
ctx.fillStyle = t._heroValue;
```

### Validator enforcement

`validate.sh` greps every `splunk-color-picker` name attribute out of `formatter.html` and confirms a matching `opt("<key>"...)` call exists in `visualization_source.js`. Unread pickers are a FAIL, not a WARN — they are user-facing lies.

## Rule 9: Compute multi-row layouts bottom-up, not top-down

When a viz stacks multiple rows of content (e.g. a gauge above a hero value above a caption above a legend), anchor the layout at the BOTTOM edge and walk UPWARD, subtracting each row's height as you go. The bottom row is the most height-sensitive — pin it to `h` and let the rows above flex.

The test51 (CUCM) working snippet — a legend → caption → value → gauge stack, computed bottom-up:

```javascript
var legendH      = 50;
var legendTopY   = h - legendH - 8;
var captionY     = legendTopY - 16;
var valueY       = captionY - 12;
var gaugeBottomY = valueY - 56;
var gaugeMaxR    = Math.min(w * 0.32, (gaugeBottomY - 60) * 1.0);
```

**Symptom:** elements collide at small panel heights — invisible during dev at one test height, breaks in production at a different panel size.

**Anti-pattern (top-down):** pinning the bottom row first and then walking DOWNWARD by fixed offsets —

```javascript
var gaugeBottomY = h - 76;
var valueY       = gaugeBottomY + 38;
// ... each row added below the previous by a fixed offset
```

This pins the bottom row, then adds fixed offsets going down, so when `h` shrinks the rows run off the bottom or overlap. Always derive each row's `Y` by SUBTRACTING from the row below it, starting at `h`.

## Self-check before moving to the next viz

Before considering a viz done:

1. Did I read `visual_reference_html` start to finish before writing code?
2. Does every `createLinearGradient` use the exact hex values from the CSS?
3. Is every animation from `visual_spec.effects` implemented?
4. Are `_renderDark` and `_renderLight` separate code paths?
5. Did I re-read `global.commitments.anti_references` for this viz?
6. Does the rendered Canvas (visually) match the HTML mockup section for this viz?

If any answer is no, fix it before moving on.
