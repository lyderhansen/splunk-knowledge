# Animation Recipes

Load this file before writing any `visualization_source.js` that includes animation.
These patterns cover all Phase 9 animation requirements (ANI-01 through ANI-06).

---

### Timer lifecycle — continuous loop

Standard pattern for continuous animations (pulse rings, breathing gauges).
Uses setInterval for simple phase-based loops; prefer rAF for entrance and
one-shot animations. Always clean up in `destroy()`.

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
| `glow_pulse` | `blur * (0.5 + 0.5 * Math.sin(this._animPhase))` on `shadowBlur` |
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

**Rules:** `requestAnimationFrame` over `setInterval` for 60fps. Exit = 75% of entrance.
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
if (prefersReducedMotion()) { this._entranceDone = true; }
var showEntrance = opt('showEntrance', 'true') === 'true';
if (showEntrance && !this._entranceDone) { this._startEntrance(config, ns); }

_startEntrance: function(config, ns) {
    if (this._animating) { return; }
    var speedMult = getSpeedMult(config, ns);
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

_startPulse: function(cadenceMs) {
    if (this._pulsing) { return; }   // single loop guard
    cadenceMs = cadenceMs || 700;
    var startTime = null;
    var self = this;
    this._pulsing = true;
    function pulse(timestamp) {
        if (!self._pulsing) { return; }
        if (!startTime) { startTime = timestamp; }
        var phase = ((timestamp - startTime) % cadenceMs) / cadenceMs;
        self._pulseBlur = 4 + 8 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
        self.invalidateUpdateView();
        requestAnimationFrame(pulse);
    }
    requestAnimationFrame(pulse);
},

_stopPulse: function() { this._pulsing = false; this._pulseBlur = 0; },

// In destroy():
this._pulsing = false;
```

**Apply in _render** — MUST use ctx.save()/ctx.restore() per ECR-05:

```javascript
function drawPulsingIndicator(ctx, x, y, r, color, blurAmount) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blurAmount || 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
```

**In updateView — severity check before starting pulse:**

```javascript
var flashCritical = opt('flashCritical', 'false') === 'true';
var hasCritical = false;
for (var i = 0; i < data.rows.length; i++) {
    var sev = safeStr(data.rows[i][severityIdx]).toLowerCase();
    if (sev === 'critical' || sev === 'error') { hasCritical = true; break; }
}
if (flashCritical && hasCritical && !prefersReducedMotion()) {
    this._startPulse(700);
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

_startHoverTransition: function(config, ns) {
    if (this._hoverAnimating) { return; }
    var showHover = opt('showHoverEffect', 'true') === 'true';
    if (!showHover) { return; }
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
        this._startHoverTransition(this._lastConfig, '{{VIZ_NAMESPACE}}');
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
_startStaggeredEntrance: function(rowCount, config, ns) {
    if (this._animating) { return; }
    var speedMult = getSpeedMult(config, ns);
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
