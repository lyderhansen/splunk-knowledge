# Phase 24: Animation Boilerplate — Context

## Domain Boundary

Provide generic copy-paste ES5 blocks for entrance animation and LED pulse that work for ANY viz type. Update viz-blueprints.md to reference specific boilerplate per viz type.

## Requirements

- AB-01: Generic 15-line ES5 entrance boilerplate
- AB-02: Generic LED pulse boilerplate (setInterval 30fps)
- AB-03: viz-blueprints.md per-viz references to specific boilerplate

## Decisions

### D-01: Generic entrance = opacity fade-in (AB-01)

The generic entrance boilerplate uses `ctx.globalAlpha = easeOutQuart(progress)` — the entire viz fades from transparent to opaque over 350ms * speedMult. Works for ANY viz type without a custom `_drawFrame` method.

Claude can OPTIONALLY override with a custom `_drawFrame(progress)` for specific vizs that benefit from partial rendering (arc fill for gauges, bar growth for charts) — but the default is opacity fade-in.

The boilerplate includes:
- `this._entranceDone` guard (prevent re-animation on refresh)
- `this._animating` guard (prevent stacked rAF loops)
- `prefersReducedMotion()` skip
- `showEntrance` opt() check — off = immediate render at full opacity
- `animationSpeed` opt() → speedMult applied to 350ms base duration
- `destroy()` cleanup: `this._animating = false`

### D-02: LED pulse = setInterval shadowBlur oscillation (AB-02)

The generic LED pulse boilerplate uses `setInterval` at 30fps (~33ms) with `shadowBlur = base + amp * Math.sin(phase)`. Oscillates between `base` (4px) and `base + amp` (12px) at 700ms cadence.

The boilerplate includes:
- `flashCritical` opt() check — off = no interval started
- `this._pulseInterval` stored for cleanup
- `destroy()` cleanup: `clearInterval(this._pulseInterval)`
- The pulse only applies to elements with critical/alert status

### D-03: Per-viz blueprint references (AB-03)

viz-blueprints.md animation settings section currently says "entrance animation style varies by viz type." Replace with:
- "Default: use Generic Entrance Boilerplate (opacity fade-in) from animation-recipes.md"
- Per-viz overrides listed ONLY for types that benefit from custom entrance: gauges (arc fill), bars (growth), tables (row stagger)
- All other viz types: "Use generic entrance boilerplate"

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-recipes/references/animation-recipes.md` — existing recipes to distill
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — animation settings section
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — pre-code checklist

## Deferred Ideas

None.
