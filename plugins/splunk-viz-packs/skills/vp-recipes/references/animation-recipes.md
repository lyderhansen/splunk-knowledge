# Animation Recipes

> **Location note:** This file lives in `vp-recipes/references/` (not `vp-viz/references/`) and is the canonical Phase 40 Animation Helper Scope Rule (AF-01/AF-02) owner. Load via `MUST LOAD` in vp-recipes/SKILL.md or directly from vp-viz/SKILL.md animation step.

Load this file before writing any `visualization_source.js` that includes animation.
These patterns cover all Phase 9 animation requirements (ANI-01 through ANI-06).

---

## Animation Helper Scope Rule

`opt()` is a closure binding created inside `updateView` from the formatter config object. It is NOT a method on the viz instance, so calling `opt()` inside `_startEntrance`, `_startPulse`, or any other helper method fails silently at runtime — `opt` is simply undefined in that scope. The same applies to `config` and `ns`, which are parameters of `updateView` and do not exist on `this`. Pass computed values as named primitive parameters instead: compute `speedMult`, `accentColor`, or any other config-derived value inside `updateView`, then hand the result to the helper.

| Finding | WRONG | RIGHT |
|---------|-------|-------|
| **AF-01** scope rule | `_startEntrance: function() {`<br>`  var speed = opt('animationSpeed', 'normal');`<br>`  // opt is undefined here — silent runtime failure`<br>`}` | In `updateView`: `var speedMult = getSpeedMult(config, ns);`<br>`this._startEntrance(speedMult);`<br><br>Helper: `_startEntrance: function(speedMult) {`<br>`  var duration = 350 * speedMult; ... }` |
| **AF-02** parameter threading | Call site: `this._startEntrance(config, ns);`<br>Signature: `function(config, ns)` | Call site: `this._startEntrance(speedMult);`<br>Signature: `function(speedMult)` |

All boilerplates below follow this rule — copy them verbatim, then substitute the `_drawFrame(progress)` call with your viz-specific render.

> **Combining boilerplates:** If a viz uses both entrance (AB-01 / ANI-01) and pulse (AB-02 / ANI-02), both caller blocks declare `var speedMult = getSpeedMult(config, ns);`. Under ES5 `var` hoisting this is legal but trips linters. Compute `speedMult` once at the top of `updateView` and omit the re-declaration from the second block (or keep it — both are safe).

---

## Generic Entrance Boilerplate (AB-01)

Copy-paste verbatim into any viz. Only substitute the `_drawFrame(progress)` call with your viz-specific render. The default renders via globalAlpha opacity fade-in — works for every viz type with zero modifications.

```javascript
// In initialize():
this._entranceDone = false;
this._animating = false;
this._entranceProgress = 1;
```

```javascript
// In updateView (before render call):
if (prefersReducedMotion()) {
    this._entranceDone = true;
    this._entranceProgress = 1;
}
var showEntrance = opt('showEntrance', 'true') === 'true';
if (!showEntrance) {
    this._entranceDone = true;
    this._entranceProgress = 1;
}
if (showEntrance && !this._entranceDone) {
    var speedMult = getSpeedMult(config, ns);
    this._startEntrance(speedMult);
}

// Apply in render — inside _render(), before drawing anything:
ctx.globalAlpha = easeOutQuart(this._entranceProgress);
// ... draw everything ...
ctx.globalAlpha = 1;
```

```javascript
// Add _startEntrance method to the extend({}) object:
_startEntrance: function(speedMult) {
    if (this._animating) { return; }
    var duration = 350 * speedMult;
    this._animating = true;
    var startTime = null;
    var self = this;
    function step(timestamp) {
        if (!self._animating) { return; }
        if (!startTime) { startTime = timestamp; }
        var progress = Math.min((timestamp - startTime) / duration, 1);
        self._entranceProgress = progress;
        self.invalidateUpdateView();
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            self._entranceDone = true;
            self._animating = false;
        }
    }
    requestAnimationFrame(step);
},
```

```javascript
// In destroy():
this._animating = false;
```

> Override point: for vizs that benefit from partial-render entrance (arc fill for gauges, bar growth for bars, row stagger for tables), replace `ctx.globalAlpha = easeOutQuart(this._entranceProgress)` with a custom draw path using `this._entranceProgress` as the fill fraction. See 'rAF entrance pattern per viz type' section below for per-type examples.

---

## Generic LED Pulse Boilerplate (AB-02)

Copy-paste verbatim into any viz that has status values. Only substitute the `_drawPulseTarget()` call with the element you want to highlight (a cell, a dot, a badge). Requires `flashCritical` formatter control to be present.

```javascript
// In initialize():
this._pulseInterval = null;
this._pulseBlur = 0;
```

```javascript
// In updateView (severity check before render):
// Required above this block: var t = theme.getTheme(detectTheme()); var ns = getNS(this);
var flashCritical = opt('flashCritical', 'false') === 'true';
if (prefersReducedMotion()) { this._stopPulse(); }
var hasCritical = false;
for (var i = 0; i < data.rows.length; i++) {
    var sev = safeStr(data.rows[i][statusIdx]).toLowerCase(); // replace statusIdx with your severity column index
    if (sev === 'critical' || sev === 'error') { hasCritical = true; break; }
}
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    var speedMult = getSpeedMult(config, ns);  // already declared by AB-01 if both boilerplates are present — safe under ES5 hoisting; lift to top of updateView to avoid linter warnings
    var accentColor = opt('accentColor', t.accent);
    this._startPulse(speedMult, accentColor);
} else {
    this._stopPulse();
}
```

```javascript
// Add _startPulse and _stopPulse methods to the extend({}) object:
_startPulse: function(speedMult, accentColor) {
    if (this._pulseInterval) { return; }
    this._pulseColor = accentColor;
    var base = 4;
    var amp = 8;
    var cadenceMs = 700 * speedMult;
    var startTime = Date.now();
    var self = this;
    this._pulseInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var phase = (elapsed % cadenceMs) / cadenceMs;
        self._pulseBlur = base + amp * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
        self.invalidateUpdateView();
    }, 33);
},

_stopPulse: function() {
    if (this._pulseInterval) { clearInterval(this._pulseInterval); this._pulseInterval = null; }
    this._pulseBlur = 0;
    this._pulseColor = null;
},
```

```javascript
// In destroy():
if (this._pulseInterval) { clearInterval(this._pulseInterval); this._pulseInterval = null; }
```

> Apply in _render: use `ctx.shadowBlur = this._pulseBlur;` and `ctx.shadowColor = this._pulseColor;` before drawing the target element. The `_pulseColor` field is stashed by `_startPulse` so `_render` can reach it (the `accentColor` parameter is only in scope inside the helper itself). Always wrap in ctx.save()/ctx.restore() to prevent shadow bleed. See drawPulsingIndicator() helper in 'LED pulse pattern' section below for a reusable draw utility.

---

### Timer lifecycle — continuous loop

Uses setInterval at ~30fps for continuous animations (pulse, breathe).
ACC-05: rAF at 60fps is too CPU-intensive for dashboards with 5+ animated vizs running simultaneously. Use rAF only for one-shot entrance animations. Always clean up in `destroy()`.

```javascript
// In initialize():
this._animTimer = null;
this._animPhase = 0;

// In updateView:
if (animType !== 'none' && !this._animTimer) {
    var self = this;
    this._animTimer = setInterval(function() {
        self._animPhase = (self._animPhase || 0) + 0.05;
        self._render(self._lastData, self._lastConfig);
    }, 33); // ~30fps
} else if (animType === 'none' && this._animTimer) {
    clearInterval(this._animTimer);
    this._animTimer = null;
}

// In destroy():
if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
```

---

### Easing functions

ES5-compatible. All take progress t (0–1) and return eased value (0–1).

```javascript
function easeOutQuart(t)    { return 1 - Math.pow(1 - t, 4); }
function easeOutExpo(t)     { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeInOutCubic(t)  { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function easeInOutQuad(t)   { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }
```

| Easing | Best for |
|---|---|
| easeOutQuart | Gauge fills, bar growth |
| easeOutExpo | Number counters, snappy reveals |
| easeInOutCubic | Panel transitions |
| easeInOutQuad | Subtle hover transitions |

---

### Animation speed modifiers

Apply in `_render()` using `this._animPhase`.

| Type | Apply in _render |
|---|---|
| `pulse` | `ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this._animPhase)` |
| `glow_pulse` (formatter: `flashCritical`) | `blur * (0.5 + 0.5 * Math.sin(this._animPhase))` on `shadowBlur` |
| `breathe` | `var s = 1 + 0.03 * Math.sin(this._animPhase); ctx.scale(s, s)` |
| `spin` | Add `this._animPhase * 2` to rotation angle |

**Three-tier speed multiplier (ANI-06):** slow=1.5x, normal=1.0x, fast=0.6x.
Apply `speedMult` to ALL duration constants in entrance and transition patterns.

```javascript
function getSpeedMult(config, ns) {
    var speed = (config && config[ns + '.animationSpeed']) || 'normal';
    if (speed === 'slow') { return 1.5; }
    if (speed === 'fast') { return 0.6; }
    return 1.0;
}
```

---

### Motion timing constants

| Tier | Duration | Example |
|---|---|---|
| Instant | 50–100ms | Cell highlight on mouseover |
| Micro | 150–200ms | KPI number change |
| State | 250–350ms | Gauge arc fill on load |
| Entrance | 400–600ms | All vizs fade in |

**Rules:** requestAnimationFrame for one-shot entrance animations. setInterval at 30fps (~33ms) for continuous loops (LED pulse, breathing gauge) — reduces CPU when multiple vizs animate simultaneously. Exit = 75% of entrance.
Never animate >2 elements simultaneously. Clean up in `destroy()` with a boolean flag.

---

### requestAnimationFrame pattern

Timestamp-based progress — canonical rAF pattern for all one-shot animations.

```javascript
var startTime = null;
var self = this;
this._animating = true;

function animateGauge(timestamp) {
    if (!self._animating) { return; }
    if (!startTime) { startTime = timestamp; }
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / 350, 1);
    self._entranceProgress = easeOutQuart(progress);
    self.invalidateUpdateView();
    if (progress < 1) { requestAnimationFrame(animateGauge); }
    else { self._animating = false; }
}
requestAnimationFrame(animateGauge);

// In destroy():
this._animating = false;
```

**Do not animate:** every data update (only first render or >10% delta change),
bounce/elastic easings, supporting-viz number counts (hero only).

---

### rAF entrance pattern per viz type (ANI-01)

One-shot entrance. Guards: `this._entranceDone` (prevent re-animation on refresh),
`this._animating` (prevent stacked rAF loops).

```javascript
// In initialize():
this._entranceDone = false;
this._animating = false;

// In updateView:
if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
var showEntrance = opt('showEntrance', 'true') === 'true';
if (!showEntrance) {
    this._entranceDone = true;
    this._entranceProgress = 1;  // CRITICAL: render final state, not zero
}
if (showEntrance && !this._entranceDone) {
    var speedMult = getSpeedMult(config, ns);
    this._startEntrance(speedMult);
}

_startEntrance: function(speedMult) {
    if (this._animating) { return; }
    var duration = 350 * speedMult;  // 350ms base
    var startTime = null;
    var self = this;
    this._animating = true;
    function step(timestamp) {
        if (!self._animating) { return; }
        if (!startTime) { startTime = timestamp; }
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        self._entranceProgress = progress;
        self.invalidateUpdateView();
        if (progress < 1) { requestAnimationFrame(step); }
        else { self._entranceDone = true; self._animating = false; }
    }
    requestAnimationFrame(step);
},

// In destroy():
this._animating = false;
```

**Per-viz entrance style** (apply eased `_entranceProgress` in `_render`):

| Viz type | Entrance style | Easing |
|---|---|---|
| Gauge | Arc fill from 0 to target angle | easeOutQuart |
| Bar / column | Height grows from bottom | easeOutQuart |
| KPI / number | Count up from 0 | easeOutExpo |
| Table / leaderboard | Staggered row fade-in | easeOutQuad |
| Area / line | Path draws left to right | easeOutQuart |

**reanimateOnRefresh:** Default OFF. Do not reset `_entranceDone` unless
formatter option `reanimateOnRefresh === 'true'`.

---

### LED pulse pattern — continuous rAF (ANI-02)

sin() oscillation on `shadowBlur`. Triggered only on critical/error severity.
Default OFF (`flashCritical: false`) per D-06. cadence = 700ms per D-05.

```javascript
// In initialize():
this._pulsing = false;
this._pulseTimer = null;

_startPulse: function(speedMult, accentColor) {
    if (this._pulseTimer) { return; }   // single loop guard
    this._pulseColor = accentColor;
    var cadenceMs = 700 * speedMult;
    var startTime = Date.now();
    var self = this;
    this._pulsing = true;
    this._pulseTimer = setInterval(function() {
        if (!self._pulsing) { clearInterval(self._pulseTimer); self._pulseTimer = null; return; }
        var elapsed = Date.now() - startTime;
        var phase = (elapsed % cadenceMs) / cadenceMs;
        self._pulseBlur = 8 + 16 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
        self.invalidateUpdateView();
    }, 33); // ~30fps — ACC-05: setInterval for continuous loops, not rAF
},

_stopPulse: function() {
    this._pulsing = false;
    this._pulseBlur = 0;
    this._pulseColor = null;
    if (this._pulseTimer) { clearInterval(this._pulseTimer); this._pulseTimer = null; }
},

// In destroy():
this._pulsing = false;
if (this._pulseTimer) { clearInterval(this._pulseTimer); this._pulseTimer = null; }
```

**Apply in _render** — MUST use ctx.save()/ctx.restore() per ECR-05:

```javascript
function drawPulsingIndicator(ctx, x, y, r, color, blurAmount, innerAlpha) {
    ctx.save();
    // Solid inner fill — visible at any panel size and on light theme (D-06)
    if (innerAlpha > 0) {
        ctx.fillStyle = theme.withAlpha(color, innerAlpha);
        ctx.beginPath();
        ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
    // Shadow glow pulse
    ctx.shadowColor = color;
    ctx.shadowBlur = blurAmount || 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
```

**Usage in _render — innerAlpha calculation:**

```javascript
var innerAlpha = 0.15 + 0.15 * Math.sin(phase * Math.PI * 2);
drawPulsingIndicator(ctx, x, y, r, this._pulseColor, this._pulseBlur, innerAlpha);
```

> `this._pulseColor` is stashed by `_startPulse` so `_render` can reach it — the `accentColor` parameter is only in scope inside the helper itself.

**In updateView — severity check before starting pulse:**

```javascript
var flashCritical = opt('flashCritical', 'false') === 'true';
var hasCritical = false;
for (var i = 0; i < data.rows.length; i++) {
    var sev = safeStr(data.rows[i][severityIdx]).toLowerCase();
    if (sev === 'critical' || sev === 'error') { hasCritical = true; break; }
}
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    var speedMult = getSpeedMult(config, ns);  // already declared by ANI-01 if both boilerplates are present — safe under ES5 hoisting; lift to top of updateView to avoid linter warnings
    this._startPulse(speedMult, accentColor);
} else {
    this._stopPulse();
}
```

---

### Eased hover transition (ANI-03)

Lerps hover alpha 0 → 0.12 on enter, 0.12 → 0 on leave. 150ms easeInOutQuad.
Default ON (`showHoverEffect: true`) per D-10.

```javascript
// In initialize():
this._hoverAlpha = 0;  this._hoverTarget = 0;
this._hoverAnimating = false;  this._hoveredIndex = -1;
this._showHoverEffect = true;  // default ON; overwritten in updateView

// In updateView (compute once, cache on instance — opt() is not available in event handlers):
this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

_startHoverTransition: function() {
    if (this._hoverAnimating || !this._showHoverEffect) { return; }
    var startAlpha = this._hoverAlpha;
    var target = this._hoverTarget;  // 0.12 on enter, 0 on leave
    var duration = 150;              // 150ms per D-09
    var startTime = null;
    var self = this;
    this._hoverAnimating = true;
    function step(timestamp) {
        if (!self._hoverAnimating) { return; }
        if (!startTime) { startTime = timestamp; }
        var progress = Math.min((timestamp - startTime) / duration, 1);
        self._hoverAlpha = startAlpha + (target - startAlpha) * easeInOutQuad(progress);
        self.invalidateUpdateView();
        if (progress < 1) { requestAnimationFrame(step); }
        else { self._hoverAlpha = target; self._hoverAnimating = false; }
    }
    requestAnimationFrame(step);
},

// Trigger in _onMouseMove:
_onMouseMove: function(e) {
    var newIndex = this._getHitIndex(e);
    if (newIndex !== this._hoveredIndex) {
        this._hoveredIndex = newIndex;
        this._hoverTarget = (newIndex >= 0) ? 0.12 : 0;
        this._startHoverTransition();  // reads this._showHoverEffect (set in updateView)
    }
},

// Render highlight — ECR-05 ctx.save()/ctx.restore():
// if (this._hoverAlpha > 0 && this._hoveredIndex >= 0) {
//     ctx.save(); ctx.globalAlpha = this._hoverAlpha;
//     ctx.fillStyle = t.accent; ctx.fillRect(rx, ry, rw, rh); ctx.restore();
// }
```

| Viz type | Hover behavior |
|---|---|
| Bar / gauge / area / grid / heatmap | Highlight + show hovered value label (per D-08) |
| Table / leaderboard | Highlight row only, no tooltip (per D-07) |

---

### Staggered row entrance (ANI-04)

Per-row delay offset. Total stagger capped at 500ms regardless of row count.

```javascript
_startStaggeredEntrance: function(rowCount, speedMult) {
    if (this._animating) { return; }
    var perRowDelay = Math.min(500 / Math.max(rowCount, 1), 80); // cap 500ms
    var rowDuration = 200 * speedMult;
    var startTime = null;
    var self = this;
    this._animating = true;
    this._staggerProgress = [];
    for (var i = 0; i < rowCount; i++) { self._staggerProgress[i] = 0; }

    function step(timestamp) {
        if (!self._animating) { return; }
        if (!startTime) { startTime = timestamp; }
        var elapsed = timestamp - startTime;
        var allDone = true;
        for (var r = 0; r < rowCount; r++) {
            var rowElapsed = Math.max(0, elapsed - r * perRowDelay);
            var progress = Math.min(rowElapsed / rowDuration, 1);
            self._staggerProgress[r] = easeOutQuart(progress);
            if (progress < 1) { allDone = false; }
        }
        self.invalidateUpdateView();
        if (!allDone) { requestAnimationFrame(step); }
        else { self._entranceDone = true; self._animating = false; }
    }
    requestAnimationFrame(step);
},
```

In `_render`: use `this._staggerProgress[i]` as `globalAlpha` for each row.

---

### prefers-reduced-motion (D-03)

```javascript
function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
}
```

| Feature | When reduced-motion ON |
|---|---|
| Entrance (ANI-01) | `_entranceDone = true` — skip, render final state |
| LED pulse (ANI-02) | `_stopPulse()` — no looping animation |
| Hover highlight (ANI-03) | Allowed — functional interaction, not decorative |
| Stagger entrance (ANI-04) | `_entranceDone = true` — all rows at full alpha |

```javascript
// In updateView — before any _start calls:
if (prefersReducedMotion()) {
    this._entranceDone = true;
    this._entranceProgress = 1;
    this._stopPulse();
}
```

---

### Cross-references

These patterns are activated via the MUST-LOAD entry in vp-viz SKILL.md.
Load before writing any visualization_source.js that includes animation.

- Animation lifecycle (basic): [canvas-recipes.md](../../vp-viz/references/canvas-recipes.md)
- Accent intensity multiplier: [mood-recipes.md](mood-recipes.md) controls animation strength
- ctx.save()/ctx.restore() discipline: [edge-cases.md ECR-05](../../vp-viz/references/edge-cases.md)
