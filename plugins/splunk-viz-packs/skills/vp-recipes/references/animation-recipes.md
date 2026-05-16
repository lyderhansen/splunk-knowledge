# Animation Recipes

> **DO NOT LOAD — Phase 9 only.** This file is created in v5.0.0 Phase 6 but is not
> wired into any MUST-LOAD or mood-conditional block. Load only when Phase 9 animation
> formatter toggles (ANI-05, ANI-06) are active.

---

### Timer lifecycle — continuous loop

The standard pattern for vizs that animate continuously (pulse rings,
breathing gauges, rotating elements). Uses setInterval for consistent
frame timing; clean up in destroy() to prevent memory leaks.

```javascript
// In initialize():
this._animTimer = null;
this._animPhase = 0;

// In updateView:
var animType = getOption(config, ns, 'animation', 'none');
if (animType !== 'none' && !this._animTimer) {
    var self = this;
    this._animTimer = setInterval(function() {
        self._animPhase = (self._animPhase || 0) + 0.05;
        self._render(self._lastData, self._lastConfig);
    }, 33); // ~30fps
} else if (animType === 'none' && this._animTimer) {
    clearInterval(this._animTimer);
    this._animTimer = null;
    this._animPhase = 0;
}

// In destroy:
if (this._animTimer) {
    clearInterval(this._animTimer);
    this._animTimer = null;
}
```

**Entrance animation pattern (one-shot):**

```javascript
// In initialize():
this._animTimer = null;
this._animProgress = 0;

// Start animation (call from updateView when data changes):
_startAnim: function() {
    if (this._animTimer) clearInterval(this._animTimer);
    this._animProgress = 0;
    var self = this;
    this._animTimer = setInterval(function() {
        self._animProgress += 0.025;
        if (self._animProgress >= 1) {
            self._animProgress = 1;
            clearInterval(self._animTimer);
            self._animTimer = null;
        }
        self.invalidateUpdateView();
    }, 16);
},

// Easing (use in _render):
var easedProgress = easeInOutQuad(this._animProgress);

// CRITICAL: clean up in destroy():
destroy: function() {
    if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

---

### Easing functions

Standard easing set for Canvas animations. All are ES5 compatible,
take a progress value t (0-1), return eased value (0-1).

```javascript
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
```

**When to use each:**

| Easing | Character | Best for |
|---|---|---|
| easeOutQuart | Smooth deceleration | Gauge fills, bar growth |
| easeOutExpo | Aggressive deceleration | Number counters, snappy reveals |
| easeInOutCubic | Symmetric acceleration/deceleration | Panel transitions, page loads |
| easeInOutQuad | Gentle symmetric | Subtle hover transitions |

---

### Animation speed modifiers

Animation types that modify the render loop. Apply in `_render()` using
the current `this._animPhase` value.

| Type | Apply in _render |
|---|---|
| `pulse` | `ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this._animPhase)` |
| `glow_pulse` | Modulate `shadowBlur` multiplier: `blur * (0.5 + 0.5 * Math.sin(this._animPhase))` |
| `breathe` | `var s = 1 + 0.03 * Math.sin(this._animPhase); ctx.scale(s, s)` around center |
| `spin` | Add `this._animPhase * 2` to rotation angle |

---

### Motion timing constants

**Duration tiers:**

| Tier | Duration | When to use | Example |
|---|---|---|---|
| Instant | 50-100ms | Hover highlight, cursor change | Cell highlight on mouseover |
| Micro | 150-200ms | Value update, color transition | KPI number change |
| State | 250-350ms | Panel reveal, gauge fill | Gauge arc animation on load |
| Entrance | 400-600ms | First render, page transition | All vizs fade in on load |

**Rules:**
- Exit animations = 75% of entrance duration (feels snappier)
- Never animate more than 2 elements simultaneously (Christmas tree effect)
- `requestAnimationFrame` over `setInterval` for smooth 60fps
- Clean up in `destroy()` — cancel pending frames with a flag
- Respect `prefers-reduced-motion`: skip entrance animations,
  keep functional transitions (hover highlight still works)

---

### requestAnimationFrame pattern

For smooth 60fps animations, prefer rAF over setInterval. The rAF
pattern provides timestamp-based progress calculation.

```javascript
// Animate gauge from 0 to target value over 350ms
var startTime = null;
var targetPct = 0.73;
var self = this;
this._animating = true;

function animateGauge(timestamp) {
    if (!self._animating) return;
    if (!startTime) startTime = timestamp;
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / 350, 1);
    var eased = easeOutQuart(progress);
    var currentPct = targetPct * eased;

    ctx.clearRect(0, 0, w, h);
    drawGaugeArc(ctx, currentPct);

    if (progress < 1) {
        requestAnimationFrame(animateGauge);
    }
}
requestAnimationFrame(animateGauge);

// In destroy():
this._animating = false;
```

**What NOT to animate:**
- Do not animate on every data update — only on first render or
  significant value changes (>10% delta)
- Do not use bounce or elastic easing — feels dated and cheap
- Do not animate text content (numbers counting up) unless it is
  the HERO metric — it is distracting on supporting vizs

---

### Cross-references

These patterns are activated by Phase 9 via formatter toggles ANI-05/ANI-06.
Until Phase 9, this file is informational only — do not wire into any
MUST-LOAD block or mood-conditional loading.

- Animation lifecycle (basic) remains in [canvas-recipes.md](../../vp-viz/references/canvas-recipes.md)
- Accent intensity multiplier in [mood-recipes.md](mood-recipes.md) controls animation strength
