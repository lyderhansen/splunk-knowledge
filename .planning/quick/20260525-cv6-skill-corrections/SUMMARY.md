---
name: cv6-skill-corrections
status: complete
created: 2026-05-25
completed: 2026-05-25
plugin: splunk-custom-viz
---

# cv6 skill corrections — complete

Source: `tests/test49_v6_in_git/HANDOVER-skill-improvements.md` Findings 1-4 + two new runtime bugs (#5 stack overflow, #5 undefined error, #6 generic previews) surfaced during live test of wwf_field_ops_viz on 2026-05-25.

## What changed

### Plugin source-of-truth (`plugins/splunk-custom-viz/`)

- **NEW** `KNOWN-CORRECTIONS.md` — authoritative override list with 6 corrections, process fix per Finding 4
- **`scripts/boilerplate_emit.js`** — hardened `updateView` data guard (catches empty-object data shape) + added `_resolveTheme(t, opt)` stub + made `_renderDark`/`_renderLight` call `_resolveTheme` first
- **`scripts/generate_assets.js`** — `drawSilhouette()` rewritten with 10 per-viz-type renderers (gauge, bars, line, timeline, grid, kpi, progress, scatter, network, radar) — restores per-viz visual distinctiveness in Splunk's viz picker
- **`scripts/validate.sh`** — 3 new grep checks:
  - **K1** color picker in formatter must be consumed in source (FAIL)
  - **K2** `invalidateUpdateView()` inside `requestAnimationFrame` (FAIL) — with comment-line filtering
  - **K3** bare-string token defaults in dashboard XML (FAIL)
- **`skills/cv-build/references/dashboard-transcription.md`** — token defaults corrected to `{"value":"*"}` object form + CRITICAL note explaining schema requirement
- **`skills/cv-create/references/canvas-port-rules.md`**:
  - **Rule 4 REWRITTEN** — banned `invalidateUpdateView()` inside RAF, taught cached-config + direct re-call pattern
  - **Rule 6 sub-rule** — cursor affordance mandatory for drillable elements
  - **NEW Rule 7** — every formatter color picker MUST be consumed in `_resolveTheme(t, opt)`
  - **NEW Rule 8** — defensive data access (two-layer defense: boilerplate guard + `_layout`/`_render` defaults)
- **`skills/cv-create/references/formatter-emission.md`** — "Color picker contract" section showing emit + consume side-by-side

### Test pack hot-fix (`tests/test49_v6_in_git/wwf_field_ops_viz/`)

- Applied stricter `updateView` data guard to all 6 vizs (fixes "Cannot read properties of undefined")
- Replaced `invalidateUpdateView()` inside RAF with cached-config pattern in 3 vizs (active_collars, patrol_coverage, threat_severity) — fixes "Maximum call stack size exceeded" on Patrol Coverage and dormant equivalent on other animated panels
- Added `// @viz-type: <type>` annotation to 4 vizs whose names didn't auto-detect (active_collars→kpi, mc01_composite→kpi, patrol_coverage→timeline, projects_funding→bars)
- Rebuilt all 6 `visualization.js` via `build_flat.js`
- Regenerated 6 `preview.png` files with per-type silhouettes (4 distinct sizes: kpi 264B, bars 262B, grid 299B, timeline 308B vs. previously 1 size for all)
- Repackaged `wwf_field_ops_viz.tar.gz` (166K)
- Final validate.sh: **0 FAILs, 1 expected WARN** (missing DESIGN-LOCK.md is fine for test pack)

## Acceptance

- [x] Patrol Coverage stack overflow root cause identified + fixed in test pack + banned in skill teaching + enforced by validator
- [x] Active Collars undefined error fixed in test pack + boilerplate hardened to prevent recurrence
- [x] Token defaults corrected in docs + enforced by validator
- [x] Color picker dead-UI pattern documented + enforced by validator
- [x] Cursor affordance documented
- [x] preview.png renders per-viz-type silhouettes (no longer 14 identical letter cards)
- [x] KNOWN-CORRECTIONS.md created as single source of truth

## Follow-ups (not in this bundle)

- **Boilerplate should emit `// @viz-type: <type>` as line 1** with a TODO marker, so the agent always sets it. Currently the agent must remember to add it; if missed, generic detection falls back to `kpi`. Out-of-scope: requires changes to `cv-create`'s emission flow + DESIGN-LOCK.md viz-type field.
- **VIZ_TYPE_KEYWORDS could be expanded** with more domain keywords (patrol→timeline, funding→bars, etc.) but the right structural fix is the `@viz-type` annotation, not endless keyword inflation.
- **cv-create iteration mode could surface KNOWN-CORRECTIONS.md** in its "before you start" section so corrections propagate automatically.

## Files touched (counts)

- 1 new file (KNOWN-CORRECTIONS.md)
- 4 plugin source files edited (boilerplate_emit.js, generate_assets.js, validate.sh, dashboard-transcription.md, canvas-port-rules.md, formatter-emission.md → 6 actually)
- 6 test pack viz sources edited (all 6 vizs in wwf_field_ops_viz)
- 6 test pack `visualization.js` rebuilt
- 6 test pack `preview.png` regenerated
- 1 tarball repackaged
