# Test 42: Red Bull — End-to-End Validation Report

**Brand:** Red Bull
**Date:** 2026-05-22
**Milestone:** v5.7.0
**Phases:** 35 (Classic), 36 (Extension API)

## Summary

| Metric | Classic (.tar.gz) | Extension API (.spl) |
|--------|-------------------|---------------------|
| Vizs | 5 | 3 |
| Package size | 140 KB | 8.6 KB |
| Validation | ALL CHECKS PASSED | E01-E05 ALL PASS |
| Min aesthetic score | 65/100 | N/A (no score_design for Extension) |
| Fix cycles | 1 (opt scope bug) | 0 |
| Build time | ~23 min | ~15 min |

## Classic Path (Phase 35)

### Vizs Built

| Viz | Score | Notes |
|-----|-------|-------|
| kpi_tile | 90/100 | Hero value with delta, gradient background |
| ring_gauge | 90/100 | Arc gauge with threshold zones |
| horizontal_bar | 65/100 | 10-item ranked bars. Lower score due to limited color variety |
| event_timeline | 75/100 | Creative domain viz — GP events with position badges |
| athlete_leaderboard | 95/100 | Ranked list with colored position indicators, deltas |

### Issues Found

| # | Issue | Category | Details |
|---|-------|----------|---------|
| 1 | `opt is not defined` runtime error | **FIXED** | `_startEntrance` and `_startStaggeredEntrance` called `opt()` outside `updateView` scope. All 5 vizs affected. Fixed by reading `animationSpeed` via `opt()` in `updateView` and passing `speedMult` as parameter. |
| 2 | KPI background color is green, not Red Bull brand | KNOWN | The KPI tile uses a green gradient background instead of Red Bull midnight blue/red. This is a brand token issue — the background color from theme.js doesn't match the brand. Not a rendering bug. |
| 3 | `getSpeedMult` function defined but unused after fix | KNOWN | The `getSpeedMult` helper at module scope is no longer called after the opt() scope fix. Dead code — harmless but untidy. |

### Finding #1: opt() Scope Bug (FIXED)

**Root cause:** The animation-recipes.md boilerplate and generated viz code used `opt('animationSpeed', 'normal')` inside `_startEntrance` — a method on the `extend({})` object, NOT inside `updateView`'s closure. The `opt` function is a closure inside `updateView` and is inaccessible from other methods.

**Fix applied:** Read `animationSpeed` via `opt()` inside `updateView` scope, compute `speedMult`, pass as parameter to `_startEntrance(speedMult)` instead of `_startEntrance(config, ns)`.

**Impact:** All 5 Classic vizs were broken — none would render. This is a CRITICAL pattern bug that affects every generated viz pack.

**Recommendation:** Update animation-recipes.md to document that `opt()` is ONLY available inside `updateView`. Animation helper methods must receive computed values as parameters, not config/ns.

## Extension API Path (Phase 36)

### Vizs Built

| Viz | Notes |
|-----|-------|
| kpi_tile | ESM import, listener-based, columnar data, drilldown via triggerDrilldown |
| ring_gauge | Arc gauge with threshold zones, same Canvas rendering as Classic |
| athlete_leaderboard | Ranked list with position indicators, canvas click → triggerDrilldown |

### Issues Found

| # | Issue | Category | Details |
|---|-------|----------|---------|
| - | None | - | Extension API build completed with zero issues. E01-E05 all pass on first run. |

### Extension API Observations

- **config.json is dramatically simpler** than formatter.html. No `{{VIZ_NAMESPACE}}` namespacing, no raw HTML, no `type="custom"` gotchas.
- **Bare option names** (`state.options.themeMode`) eliminate an entire class of namespace bugs.
- **Package size** is much smaller (8.6 KB vs 140 KB) — esbuild tree-shakes unused code.
- **Build is faster** — esbuild is near-instant, no AMD wrapper step needed.
- **`@splunk/dashboard-studio-extension`** is publicly available on npm — no Splunk auth barrier.

## Classic vs Extension API Comparison

| Dimension | Classic | Extension API | Winner |
|-----------|---------|---------------|--------|
| **Config complexity** | formatter.html (raw HTML, VIZ_NAMESPACE) | config.json (declarative JSON) | Extension |
| **Module format** | AMD define([]) + build_flat.js | ESM import + esbuild | Extension |
| **Data access** | rows[row][col] (ROW_MAJOR) | columns[field][row] (columnar, strings) | Classic (simpler types) |
| **Option access** | config[ns + '.key'] (namespace required) | state.options.key (bare) | Extension |
| **Theme detection** | getCurrentTheme() (synchronous) | addThemeListener (reactive) | Extension |
| **Drilldown** | this.drilldown({data:{}}, e) | triggerDrilldown({action, payload}) | Tie |
| **Packaging** | COPYFILE_DISABLE=1 tar czf (manual) | node package.mjs → .spl (scripted) | Extension |
| **Compatibility** | DS + Simple XML | DS only | Classic |
| **Package size** | 140 KB (.tar.gz) | 8.6 KB (.spl) | Extension |
| **Editor types** | 4+ (text, radio, color, select) | 4 confirmed (text, number, color, checkbox) | Classic |
| **Maturity** | 38+ test builds, battle-tested | 2 test builds, new | Classic |

**Verdict:** Extension API is cleaner and simpler for DS-only deployments. Classic remains the safe default for backwards compatibility with Simple XML. The dual-format architecture from v5.6.0 correctly supports both.

## Recommendations for Next Milestone

1. **CRITICAL: Fix animation-recipes.md** — Document that `opt()` is only available inside `updateView`. Animation helper methods must receive values as parameters. Add a WRONG/RIGHT example.
2. **Improve horizontal_bar aesthetic score** — Currently 65/100 (lowest). Missing: gradient fills on bars, more color variety in series.
3. **Extension API score_design.js support** — Currently only scores Classic vizs (looks for `opt()` patterns). Add Extension API pattern recognition.
4. **Extension API editor type discovery** — Only 4 types confirmed (editor.color, text, number, checkbox). Need to discover editor.select/radio for feature parity with formatter.html.
5. **Light mode backgroundColor bug** — Still present from v5.5.0. backgroundColor formatter control ignored in light mode.
