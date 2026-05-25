---
created: 2026-05-25T15:30:00Z
title: Three live-render bugs in test48 polestar (post-install screenshot)
area: testing
files:
  - tests/test48_v510/polestar_fleet_ops/appserver/static/visualizations/polestar_regen_gauge/src/visualization_source.js
  - tests/test48_v510/polestar_fleet_ops/appserver/static/visualizations/polestar_motor_telemetry/src/visualization_source.js
  - tests/test48_v510/polestar_fleet_ops/appserver/static/visualizations/polestar_regen_gauge/formatter.html (title width)
---

## Problem

When test48_v510 polestar_fleet_ops was installed in live Splunk and the dashboard opened (screenshot reviewed 2026-05-25), three rendering issues were visible alongside the otherwise-successful build. All three are bugs in the generated viz code, not in the v5.10.x skills themselves — though they suggest skill-level patterns to harden.

### Bug 1: Regen gauge — dial doesn't render

- **Viz:** `polestar_regen_gauge`
- **Symptom:** The 270° radial dial described in HANDOVER.md is not visible in the rendered panel. Only the center stack ("REGEN 18.4 kWh THIS TRIP") renders. No arc, no tick marks, no animated sweep.
- **Hypothesis:**
  - Width allocation (460×344) may be too narrow for the chosen radius at 270° arc
  - Entrance animation `_entranceProgress` may never reach a paint-triggering value (stuck at 0)
  - z-order issue — dial rendered behind background fill
- **Where to look:** `polestar_regen_gauge/src/visualization_source.js`, the dial geometry math vs actual `clientWidth/clientHeight` after HiDPI scaling. Verify the animation completion handler actually triggers a render.

### Bug 2: Motor telemetry — x-axis labels all read "00:33:44"

- **Viz:** `polestar_motor_telemetry`
- **Symptom:** All 8 x-axis tick labels render as the same timestamp `00:33:44`. Should be sequential time values across the time range (e.g. 00:00, 00:30, 01:00, ...).
- **Hypothesis:** Time-axis label loop is sampling `data.rows[i]._time` directly instead of computing tick labels from the (t_min, t_max) bounds. With all rows having timestamps close to the same minute (or one row's value being reused), every label collapses.
- **Where to look:** `polestar_motor_telemetry/src/visualization_source.js`, find the x-axis label rendering loop. Convert to compute labels from time-range bounds: `t_min + i * step`, formatted via Date.

### Bug 3: "REGENERATIVE P..." title truncated

- **Viz:** `polestar_regen_gauge`
- **Symptom:** Title overflows the 460px panel width and clips mid-word.
- **Fix options:** (a) shorten the title text in formatter / app.conf to "REGEN POWER" or just "REGEN", (b) widen the panel in the dashboard JSON layout, (c) add text-truncation-with-ellipsis logic to the title render.

## Solution

Two strategies depending on whether test48 is worth fixing or leaving as a historical record:

**Option A — Fix test48 inline.** Patch the 3 bugs, rebuild the tarball, re-install. Useful if test48 is a portfolio piece. ~30 min of focused editing.

**Option B — Leave test48 as-is, ensure the bugs don't recur in NEW builds (test49 WWF or any future build).**
The harder-to-recur strategy is to encode lessons into the v5 skills:
1. Add a B-code check to `validate_viz.sh` for animation completion handlers (verify any `_entrance*Progress` variable is actually written and triggers `_render`)
2. Add to `visualization-js-template.md` a x-axis labeling pattern that derives labels from time-range bounds, not row timestamps
3. Add to `formatter-patterns.md` or `pre-code-checklist.md` a "title text width" rule that warns when title strings exceed panel-relative width thresholds

**Option C — Defer entirely.** test48 stays as a "v5.10.1 ships with these known live-render gaps" artifact. Skill-level hardening waits until after the cv6 A/B test informs the v5/v6 strategy.

Per CONTEXT D-05 #4 / Phase 42 D-04, test packs are throwaway artifacts — Option C is the default unless test48 is needed for something specific (demo, portfolio, training data).

## Recommended sequence

1. **Run test49 WWF through v5.10.1 first** — see whether the B21 fix prevents the load-flash on a NEW build. If yes, v5.10.1 is solid.
2. **Run test49 WWF through cv6** — A/B against v5 on identical brief.
3. **Decide based on those results:**
   - If v5.10.1 + WWF is clean and cv6 is comparable, mark cv6 evaluation todo as "coexist" (option c) and pick up test48 polish per Option A above (the bugs are real and worth fixing if v5 is the going-forward plugin)
   - If cv6 clearly wins, archive v5 entirely and let test48 die with the legacy plugin (Option C)
   - If v5.10.1 fails the WWF test, treat these test48 bugs as evidence that v5 needs more skill-level hardening before any further polish

## Resume signal

Open this todo via `/gsd:capture --list` or just re-read. Linked to the cv6 evaluation todo — the strategic decision flows through that first.
