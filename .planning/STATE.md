---
gsd_state_version: 1.0
milestone: v5.8.0
milestone_name: Quality & Template Corrections
status: executing
stopped_at: Phase 38 context gathered
last_updated: "2026-05-23T13:34:38.752Z"
last_activity: 2026-05-23 -- Phase 38 execution started
progress:
  total_phases: 38
  completed_phases: 27
  total_plans: 59
  completed_plans: 65
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Zero-fix first builds AND wow-factor dashboards — reliable + beautiful every time
**Current focus:** Phase 38 — jsonata-reference

## Current Position

Phase: 38 (jsonata-reference) — EXECUTING
Plan: 1 of 2
Status: Executing Phase 38
Last activity: 2026-05-23 -- Phase 38 execution started

## Performance Metrics

**v4.1.0 Velocity (reference):**

- Total plans completed: 42
- Total phases completed: 5

**v5.0.0 Velocity:**

- Total plans completed: 13
- Total phases completed: 4
- Average duration: ~5 min/plan

**v5.1.0 Velocity:**

- Total plans completed: 6
- Total phases completed: 3
- Average duration: ~5 min/plan

**v5.2.0 Velocity:**

- Total plans completed: 6
- Total phases completed: 3
- Average duration: ~5 min/plan

**v5.3.0 Velocity:**

- Total plans completed: 7
- Total phases completed: 3
- Average duration: ~5 min/plan

**v5.4.0 Velocity:**

- Total plans completed: 5
- Total phases completed: 3
- Average duration: ~5 min/plan

**v5.5.0 Velocity (in progress):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 22 | 2 | - | - |
| 23 | 2 | - | - |
| 24 | 2 | - | - |
| 25 | 2 | - | - |
| 26 | 2/2 | ~12min | ~6min |
| 27 | 1/2 | ~12min | ~12min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Phase 22 first — VI-01/VI-02 add viz name to check_design.js D01/D08 output and add post-build validate+loop to vp-viz; fixes the feedback loop before new patterns land in Phases 23-26
- [Roadmap]: Phase 23 (CP-01/CP-02/CP-03) depends on Phase 22 — brand swatch population and accentColor restoration are formatter-generation changes; accurate validator output from Phase 22 is needed to verify they produce no new violations
- [Roadmap]: Phase 24 (AB-01/AB-02/AB-03) depends on Phase 22 only — animation boilerplate is pure reference/documentation work in animation-recipes.md and viz-blueprints.md; does not depend on color model changes in Phase 23
- [Roadmap]: Phase 25 (BG-01/BG-02/BG-03/PA-01/PA-02) depends on Phase 23 — generate_assets.js background variant work needs the backgroundType visual language field; preview asset improvements need the brand palette plumbing from Phase 23
- [Roadmap]: Phase 26 (MC-01/MC-02) depends on Phase 24 — multi-channel archetype is pure blueprint/reference work; grouping after animation boilerplate allows Phase 24 reference patterns to inform channel animation notes in Phase 26
- [Architecture]: VI-01 changes land in check_design.js D01 and D08 check functions — pass viz name as parameter to finding constructor; update test assertions to verify name presence
- [Architecture]: VI-02 changes land in vp-viz SKILL.md pipeline instructions — add Step N "post-build validate loop" describing validate_viz.sh invocation, XFILE/D08 failure handling, fix instructions, rebuild, re-validate cycle (max 2 iterations)
- [Architecture]: CP-01 changes land in formatter-patterns.md brand swatch template and vp-design SKILL.md palette extraction step — 6-8 <splunk-color> elements per picker
- [Architecture]: CP-02 changes land in theme-template.md LIGHT object textFaint value — update to #6B7080 or darker
- [Architecture]: CP-03 changes land in formatter-patterns.md accentColor section — restore picker, add usage contract comment enforcing withAlpha()-only pattern
- [Architecture]: AB-01/AB-02 changes land in animation-recipes.md — two new generic boilerplate sections replacing vague "varies by viz type" guidance
- [Architecture]: AB-03 changes land in viz-blueprints.md — per-viz animation notes updated to reference specific boilerplate section names
- [Architecture]: BG-01 changes land in visual language schema (vp-design/references/ or SKILL.md) — add backgroundType field with enum values
- [Architecture]: BG-02 changes land in generate_assets.js — branch on backgroundType value for background generation logic
- [Architecture]: BG-03 changes land in generate_assets.js — add light background variant output path (bg_gradient_light.png or Dashboard Studio backgroundColor)
- [Architecture]: PA-01 changes land in generate_assets.js preview generation — replace flat fill with gradient fill using 2 brand palette colors; add 2x output at 600x400
- [Architecture]: PA-02 changes land in generate_assets.js appIcon generation — domain symbol lookup table from @viz-type or brand keywords
- [Architecture]: MC-01 changes land in viz-blueprints.md — new "Multi-Channel Composite" archetype entry
- [Architecture]: MC-02 changes land in domain-templates.md — add archetype references to F1/motorsport, healthcare monitoring, network ops entries
- [AC-01]: Drilldown payload shape corrected to {data:{field:val}} with browserEvent as second arg — official Splunk custom viz API
- [AC-02]: Series pickers use type=splunkCategorical; brand/accent pickers keep type=custom
- [AC-03]: Threshold 3-band RAG template added with direction-swap logic and per-element toggles
- [AC-04]: escapeHtml/makeSafeUrl documented as mandatory for DOM-context viz rendering; Canvas fillText explicitly exempted
- [ET-01]: config-json-template.md created with 4 confirmed editor types; editor.text used as fallback for unconfirmed editor.radio/editor.select; bare option names (no VIZ_NAMESPACE) documented as Extension API improvement
- [FC-01]: vp-init Q1 added as "Target format" (Classic vs Extension); Classic is default; previous Q1-Q7 renumbered to Q2-Q8
- [FC-02]: Format field added as first entry in vp-design hand-off context block; propagates to all downstream skills
- [FC-03]: vp-viz SKILL.md format-conditional workflow block added — Extension routes to config-json-template.md and visualization-js-template.md; Classic workflow unchanged
- [FC-04]: pre-code-checklist.md Extension API Checklist section (12 items) added — ESM, columnar data, addThemeListener, addDrilldownListener, config.json, bare option names, yarn build

### Pending Todos

- [x] Execute 27-02-PLAN.md (remaining plan in phase 27) — COMPLETE
- [x] Execute 33-01-PLAN.md — COMPLETE (2026-05-22)
- [x] Execute 34-01-PLAN.md — COMPLETE (2026-05-22)
- [x] Execute 35-01-PLAN.md — COMPLETE (2026-05-22): Red Bull Classic path build, 5 vizs, ALL CHECKS PASSED, 133KB tarball
- [x] Execute 36-01-PLAN.md — COMPLETE (2026-05-22): Extension API Red Bull pack, 3 vizs, E01-E05 ALL PASS, 8.6KB .spl

### Decisions

- [EXT-01]: Extension API format confirmed working end-to-end: config.json + ESM visualization.js, esbuild with @splunk/dashboard-studio-extension as external, package.mjs generates full .spl — ALL E01-E05 pass
- [EXT-02]: canvas.addEventListener('click') + VisualizationAPI.triggerDrilldown (Approach 2) works for drilldown without addDrilldownListener
- [EXT-03]: preview.png at 116x76 generated by package.mjs with brand palette per-viz — passes A01/A02 size threshold
- [TB-01]: @splunk/dashboard-studio-extension is publicly available on npm — no Splunk auth required for Extension API test builds
- [TB-02]: Manual scaffold (no @splunk/create CLI) produces identical Extension API project structure per plan D-02 fallback
- [TB-03]: preview.png generated with raw Buffer + Node.js zlib (no external PNG lib) — 116x76, brand palette, >100 bytes passes A01/A02
- [SU-01]: linkToDashboard.tokens must be array+value (not object map, not key) — live-tested error table added to ds-int-drilldowns
- [SU-02]: Dashboard Studio eval uses JSONata not SPL eval — & for concat, ? : ternary, $now() for dates; documented in ds-int-tokens
- [SU-03]: Three-handler chain is the only working cross-dashboard time range pattern — $eval:name$ direct in linkToDashboard does not recompute before navigation

### Blockers/Concerns

None. v5.6.0 milestone complete.

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v6.0 scope | validate_dash.js automated dashboard JSON schema checker | deferred | 2026-05-18 |
| v6.0 scope | Aviation and Fintech domain-specific viz types | deferred | 2026-05-18 |
| v6.0 scope | Real Splunk data integration patterns (production SPL templates) | deferred | 2026-05-18 |
| v5.5.0 future | Token-based drilldown configuration in formatter | deferred | 2026-05-20 |
| v5.5.0 future | Aviation and Fintech domain-specific viz types | deferred | 2026-05-20 |
| v5.5.0 future | score_design.js automated aesthetic scoring | deferred | 2026-05-20 |
| v5.5.0 future | Auto-palette HSL derivation for series colors | deferred | 2026-05-20 |
| v5.5.0 future | Behavioral D08 check (verify opt() value used in conditional) | deferred | 2026-05-20 |
| v2 scope | Dashboard drilldown end-to-end | deferred | 2026-05-15 |
| v2 scope | Dashboard JSON "title" field | deferred | 2026-05-15 |

## Session Continuity

Last session: 2026-05-23T10:09:39.655Z
Stopped at: Phase 38 context gathered
Resume: None — phase 34 plan 01 complete

## Operator Next Steps

- v5.6.0 milestone complete — all phases done
- Consider v6.0 planning (validate_dash.js, Aviation/Fintech domain types, production SPL templates)
