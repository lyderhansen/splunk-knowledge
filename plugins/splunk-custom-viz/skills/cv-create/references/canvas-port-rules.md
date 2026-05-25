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

## Rule 4: Animations declared in the spec MUST be implemented

If `visual_spec.effects.<animation>` exists in DESIGN-LOCK.md, you MUST implement it. Animations are not optional polish.

Implementation pattern for a `requestAnimationFrame` loop:

```javascript
    _renderDark: function(ctx, data, t, w, h, opt) {
        var self = this;

        // ... static rendering ...

        if (!this._breathAnimating) {
            this._breathAnimating = true;
            this._breathStart = performance.now();
            (function loop(now) {
                var elapsed = (now - self._breathStart) % 3000;  // 3000ms cycle from spec
                var phase = Math.sin((elapsed / 3000) * Math.PI * 2);
                var blur = 16 + (28 - 16) * (0.5 + phase * 0.5);
                self._currentBlur = blur;
                self.invalidateUpdateView();
                self._animationFrameId = requestAnimationFrame(loop);
            })(performance.now());
        }
    }
```

`destroy()` in the boilerplate already clears `_animationFrameId` and `_pulseIntervalId`.

For `flashCritical`-style pulses, use `setInterval` with the cadence from the spec.

## Rule 5: Light theme is NEVER derived from dark

`_renderDark` and `_renderLight` are independent functions. They share no state. They MUST NOT use a single parameterized render with `if (isDark)` branches inside.

Why: the test44 failure mode was treating light theme as "dimmed dark" — applying the same effects with reduced alpha. This produced unreadable ghost-text because the CSS effects that work on dark surfaces (carbon overlay at 0.04 opacity, ambient glow) destroy text on white surfaces.

`_renderLight` reads from `t` (which is `LIGHT` from theme.js) AND from `visual_spec.fills.background_light` (which often says `overlay: none`). When the spec says "no overlay on light", `_renderLight` does NOT draw the overlay.

If you find yourself sharing helper functions between the two render paths, that's fine — extract them as private methods. But the top-level render flow is two separate paths.

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

## Self-check before moving to the next viz

Before considering a viz done:

1. Did I read `visual_reference_html` start to finish before writing code?
2. Does every `createLinearGradient` use the exact hex values from the CSS?
3. Is every animation from `visual_spec.effects` implemented?
4. Are `_renderDark` and `_renderLight` separate code paths?
5. Did I re-read `global.commitments.anti_references` for this viz?
6. Does the rendered Canvas (visually) match the HTML mockup section for this viz?

If any answer is no, fix it before moving on.
