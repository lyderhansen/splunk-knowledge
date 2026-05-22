# Roadmap: splunk-knowledge — Plugin Marketplace

## Milestones

- ✅ **v4.1.0 splunk-viz-packs Hardening** — Phases 1-5 (shipped 2026-05-15)
- ✅ **v5.0.0 Design Awesomeness** — Phases 6-9 (shipped 2026-05-16)
- ✅ **v5.1.0 Viz Hardening & Dashboard Wow-Factor** — Phases 10-12 (shipped 2026-05-18)
- ✅ **v5.2.0 Smart Vizs & Domain Identity** — Phases 13-15 (shipped 2026-05-18)
- ✅ **v5.3.0 Production Polish & Interactive Dashboards** — Phases 16-18 (shipped 2026-05-19)
- ✅ **v5.4.0 Runtime Robustness & Visual Polish** — Phases 19-21 (shipped 2026-05-19)
- ✅ **v5.5.0 Visual Wow-Factor & First-Build Perfection** — Phases 22-27 (shipped 2026-05-21)
- **v5.6.0 DS Extension API & Dual-Format Architecture** — Phases 28-33 (active)

## Phases

<details>
<summary>✅ v4.1.0 splunk-viz-packs Hardening (Phases 1-5) — SHIPPED 2026-05-15</summary>

- [x] Phase 1: Baseline & Core Validators (3/3 plans) — completed 2026-05-14
- [x] Phase 2: Schema & Cross-file Validation (3/3 plans) — completed 2026-05-15
- [x] Phase 3: Repair Loop & Light Theme Safety (3/3 plans) — completed 2026-05-15
- [x] Phase 4: Visual Identity & Assets (3/3 plans) — completed 2026-05-15
- [x] Phase 5: Rule Consolidation (3/3 plans) — completed 2026-05-15

Full details: `.planning/milestones/v4.1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v5.0.0 Design Awesomeness (Phases 6-9) — SHIPPED 2026-05-16</summary>

- [x] Phase 6: Design Principles & Skill Layer (3/3 plans) — completed 2026-05-16
- [x] Phase 7: Generation Quality & Theme Parity (4/4 plans) — completed 2026-05-16
- [x] Phase 8: Design Quality Gate & Edge Case Resilience (3/3 plans) — completed 2026-05-16
- [x] Phase 9: Animation & Motion (3/3 plans) — completed 2026-05-16

</details>

<details>
<summary>✅ v5.1.0 Viz Hardening & Dashboard Wow-Factor (Phases 10-12) — SHIPPED 2026-05-18</summary>

- [x] Phase 10: Foundation Fixes (2/2 plans) — completed 2026-05-18
- [x] Phase 11: Blueprint Expansion & Creative Freedom (2/2 plans) — completed 2026-05-18
- [x] Phase 12: Dashboard Composition (2/2 plans) — completed 2026-05-18

</details>

<details>
<summary>✅ v5.2.0 Smart Vizs & Domain Identity (Phases 13-15) — SHIPPED 2026-05-18</summary>

- [x] Phase 13: Accent Architecture Foundation (3/3 plans) — completed 2026-05-18
- [x] Phase 14: Smart Fields & Domain Ideation (2/2 plans) — completed 2026-05-18
- [x] Phase 15: Mandatory Dashboard Packaging (1/1 plans) — completed 2026-05-18

Full details: `.planning/milestones/v5.2.0-ROADMAP.md`

</details>

<details>
<summary>✅ v5.3.0 Production Polish & Interactive Dashboards (Phases 16-18) — SHIPPED 2026-05-19</summary>

- [x] Phase 16: Code Quality & Reference Cleanup (2/2 plans) — completed 2026-05-18
- [x] Phase 17: Dashboard Schema & Composition (2/2 plans) — completed 2026-05-18
- [x] Phase 18: Interactive Dashboard Features (3/3 plans) — completed 2026-05-19

Full details: `.planning/milestones/v5.3.0-ROADMAP.md`

</details>

<details>
<summary>✅ v5.4.0 Runtime Robustness & Visual Polish (Phases 19-21) — SHIPPED 2026-05-19</summary>

- [x] **Phase 19: Validator Fixes** - Fix three false-positive/false-negative bugs in validate_dash.js and check_design.js (completed 2026-05-19)
- [x] **Phase 20: Data Binding & Drilldown** - Auto-field discovery enforced in generated vizs; drilldown wired on all clickable panels (completed 2026-05-19)
- [x] **Phase 21: Animation & Visual Polish** - Animation controls implemented correctly; gradient fills and light theme contrast verified (completed 2026-05-19)

</details>

<details>
<summary>✅ v5.5.0 Visual Wow-Factor & First-Build Perfection (Phases 22-27) — SHIPPED 2026-05-21</summary>

- [x] Phase 22: Validator Feedback Loop (2/2 plans) — completed 2026-05-20
- [x] Phase 23: Color Palette & Accent Foundation (2/2 plans) — completed 2026-05-20
- [x] Phase 24: Animation Boilerplate (2/2 plans) — completed 2026-05-20
- [x] Phase 25: Backgrounds & Preview Assets (2/2 plans) — completed 2026-05-20
- [x] Phase 26: Multi-Channel Archetype (2/2 plans) — completed 2026-05-21
- [x] Phase 27: API Correctness (2/2 plans) — completed 2026-05-21

Full details: `.planning/milestones/v5.5.0-ROADMAP.md`

</details>

**v5.6.0 DS Extension API & Dual-Format Architecture (Phases 28-33)**

- [x] **Phase 28: Extension API Templates** - Write config.json, visualization.js, package.json, and app.conf generation templates for the DS Extension API path (completed 2026-05-22)
- [x] **Phase 29: Skill Format Conditioning** - vp-init format choice (Classic vs Extension); vp-viz and vp-create format-conditional generation sections (completed 2026-05-22)
- [ ] **Phase 30: Data & Drilldown Adapter** - Columnar data access patterns in viz-blueprints.md; Extension API edge cases; drilldown variant with triggerDrilldown
- [ ] **Phase 31: Build & Validation** - validate_viz.sh Extension API mode (config.json, ESM, columnar); .spl build verification via yarn package
- [ ] **Phase 32: Aesthetic Scoring** - score_design.js automated aesthetic scorer with per-dimension breakdown; optional Phase 5 in validate_viz.sh
- [ ] **Phase 33: Test Build** - End-to-end Extension API test build with 3+ vizs producing an installable .spl file

## Phase Details

### Phase 6: Design Principles & Skill Layer
**Goal**: Claude has codified design rules it applies by default — premium canvas recipes, a cross-viz consistency contract, and annotated viz-blueprints.md options are all in reference files
**Depends on**: Phase 5 (v4.1.0 rule consolidation complete)
**Requirements**: DPR-01, DPR-02, DPR-03, DPR-04, DPR-05, DPR-06, DPR-07, DPR-08, DPR-09, DPR-10, CON-01, CON-02, CON-03, CON-04, CON-05
**Success Criteria** (what must be TRUE):
  1. User sees 3-tier typography hierarchy (hero/body/whisper with dynamic measureText scaling) in every new viz generated after this phase
  2. User sees gradient fills on all data elements — no flat solid fills appear in any generated bar, arc, or panel
  3. User sees depth effects (ambient light, vignette, glass panels, noise grain) appear correctly on Luxury/Futuristic/Organic mood vizs
  4. All vizs in a pack share the same spacing formula, corner radius, font family, and hover alpha — verifiable by comparing two vizs side-by-side
  5. design-principles.md and consistency-grid.md exist in vp-design/references/ and are cross-referenced from vp-viz SKILL.md
**Plans**: 3 plans
Plans:
- [x] 06-01-PLAN.md — Split canvas-recipes.md into 4 recipe files (depth, texture, typography, animation)
- [x] 06-02-PLAN.md — Create design-principles.md and consistency-grid.md in vp-design/references/
- [x] 06-03-PLAN.md — Wire all files: update theme-template.md, vp-viz SKILL.md, viz-blueprints.md, mood-recipes.md, all-patterns.md
**UI hint**: yes

### Phase 7: Generation Quality & Theme Parity
**Goal**: Every generated viz has 10-14 context-aware formatter options, and the light theme looks deliberately designed — not a color inversion of dark
**Depends on**: Phase 6
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06, CFG-07, CFG-08, THM-01, THM-02, THM-03, THM-04, THM-05
**Success Criteria** (what must be TRUE):
  1. A generated KPI viz has at minimum: valueField, label, unit, decimals, showDelta, showGlow, accentColor, accentIntensity, themeMode — visible in its formatter.html
  2. A generated gauge viz has zoneLow/zoneHigh/colors/thresholds as formatter controls — user can change zone boundaries without editing JS
  3. User switching themeMode to "light" sees a white panel background with full-opacity hero text, not a ghostly near-invisible value
  4. accentIntensity (0-100) is present on every generated viz and measurably scales glow radius and shadow blur proportionally
  5. Claude derives formatter options from viz type — a leaderboard gets maxRows/showGlow/scoreDigits, not the same 7 generic options as a KPI
**Plans**: 4 plans
Plans:
- [x] 07-01-PLAN.md — Expand viz-blueprints.md Settings: lists to 10-14 options per type; add Line Chart blueprint entry
- [x] 07-02-PLAN.md — Update formatter-patterns.md to 4-section structure; add accentIntensity template and Effects section
- [x] 07-03-PLAN.md — Fill theme-template.md LIGHT object with canonical values; add D-08/THM-03/THM-04 enforcement comments
- [x] 07-04-PLAN.md — Wire all Phase 7 changes into vp-viz SKILL.md: pre-code checklist, step 5 JS patterns, step 7 formatter derivation
**UI hint**: yes

### Phase 8: Design Quality Gate & Edge Case Resilience
**Goal**: check_design.js catches design regressions at build time, and generated code never produces a blank panel, a NaN value, or a layout overflow from bad data
**Depends on**: Phase 6
**Requirements**: DQG-01, DQG-02, DQG-03, DQG-04, DQG-05, DQG-06, DQG-07, DQG-08, ECR-01, ECR-02, ECR-03, ECR-04, ECR-05
**Success Criteria** (what must be TRUE):
  1. Running validate_viz.sh on a viz with no gradient calls produces a WARN D01 finding — the check runs automatically in Phase 4 of validation
  2. Running validate_viz.sh on a viz with a formatter control not read in JS produces a FAIL D08 bidirectional wiring finding
  3. A generated viz fed zero SPL results displays "No data available" in brand typography — no blank canvas, no JS error
  4. A generated table viz fed 1000 rows renders the first page without lag — pagination is active, not iterating all 1000 rows on every draw
  5. A generated viz with null field values displays fallback text, not "null" or "undefined" — safeStr/safeNum guards are present on all data access
**Plans**: 3 plans
Plans:
- [x] 08-01-PLAN.md — Create check_design.js with all seven design checks (D01-D06, D08)
- [x] 08-02-PLAN.md — Create edge-cases.md with ECR-01 through ECR-05 canonical patterns
- [x] 08-03-PLAN.md — Wire pipeline: test_check_design.js + validate_viz.sh Phase 4 hook + SKILL.md pointer

### Phase 9: Animation & Motion
**Goal**: Entrance animations, LED pulse, eased hover transitions, and staggered row cascades are available as canvas-recipes.md patterns with formatter toggles — all off by default, all individually controllable
**Depends on**: Phase 7
**Requirements**: ANI-01, ANI-02, ANI-03, ANI-04, ANI-05, ANI-06
**Success Criteria** (what must be TRUE):
  1. A generated gauge viz animates its arc filling on first render — easeOutQuart over ~350ms, visible to human eye without reading source
  2. A generated status table with flashCritical=true shows LED pulse on critical cells — shadowBlur oscillating at 500-800ms cadence
  3. User toggling showEntrance=false in the formatter immediately stops entrance animation without any other visual change
  4. A generated leaderboard with staggered entrance shows rows cascading in at 30ms delay intervals — not all appearing simultaneously
  5. animationSpeed and accentIntensity formatter controls produce measurably different output — "slow" takes longer than "fast", intensity 10 glows less than intensity 90
**Plans**: 3 plans
Plans:
- [x] 09-01-PLAN.md — Expand animation-recipes.md: remove DO NOT LOAD gate, add rAF entrance, LED pulse, hover easing, stagger patterns
- [x] 09-02-PLAN.md — Add Animation formatter section to formatter-patterns.md; add animation settings to all viz types in viz-blueprints.md
- [x] 09-03-PLAN.md — Wire SKILL.md MUST-LOAD, update canvas-recipes.md stagger/lifecycle, verify D08 compatibility
**UI hint**: yes

### Phase 10: Foundation Fixes
**Goal**: Every formatter control responds from both config delivery paths, gauge renders correctly when entrance animation is off, flashCritical LED pulse is visually prominent, and zone color / hover toggle wiring bugs are resolved
**Depends on**: Phase 9
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05
**Success Criteria** (what must be TRUE):
  1. User changes any formatter setting (in Format panel or dashboard JSON options) and sees the change reflected in the viz — opt() is replaced with two-path getOption() in the SKILL.md source template
  2. User sets showEntrance=false and the gauge renders immediately at its correct final value — _entranceProgress=1 and _entranceDone=true are set on the off-path
  3. User sees flashCritical LED pulse clearly on critical cells at any panel size — shadowBlur oscillates 8-24px and a solid inner fill provides a secondary visual cue
  4. User changes zone colors on ring gauge and the arc segment colors update — hexFromSplunk wraps all color picker opt() reads
  5. User toggles showHoverEffect=false on leaderboard or status matrix and hover highlight disappears completely
**Plans**: 2 plans
Plans:
- [x] 10-01-PLAN.md — Replace opt() with two-path getOption() in SKILL.md template; update D08 regex
- [x] 10-02-PLAN.md — Fix entrance-off path, widen flashCritical pulse, add hexFromSplunk and hover-toggle ECR patterns

### Phase 11: Blueprint Expansion & Creative Freedom
**Goal**: Claude generates visually distinct KPI tiles per brand, all viz blueprints invite creative decisions instead of mandating templates, missing settings (pagination, text placement, sparkline controls, flexible status values, cell label and header toggles) are documented and wired, and drilldown field help text is clear
**Depends on**: Phase 10
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, CRE-01, CRE-02, CRE-03
**Success Criteria** (what must be TRUE):
  1. User configures status matrix with custom status strings (e.g., "degraded", "maintenance") and the viz renders correct colors — status values read from formatter-defined comma-separated lists, not hardcoded ok/warn/crit
  2. User sees pagination controls (next/prev page) on a leaderboard when rows exceed maxRows — clicking navigates without page reload
  3. User moves KPI text placement (center/top/left/right) via the formatter and sees the label and value reposition accordingly
  4. Two KPI tiles generated for different brands look visually distinct — different label position, trend indicator shape, or background treatment per brand personality
  5. User reads the Drilldown Field formatter control and immediately understands what clicking a viz row will pass downstream — help text is unambiguous
**Plans**: 2 plans
Plans:
- [x] 11-01-PLAN.md — Expand viz-blueprints.md settings and creative freedom language
- [x] 11-02-PLAN.md — Add drilldown field template and comma-separated input pattern to formatter-patterns.md
**UI hint**: yes

### Phase 12: Dashboard Composition
**Goal**: Generated dashboards have a branded background, clear visual hierarchy, depth through card grouping, and panel arrangement that follows a data narrative — never a flat equal-weight grid
**Depends on**: Phase 10
**Requirements**: DSH-01, DSH-02, DSH-03, DSH-04
**Success Criteria** (what must be TRUE):
  1. A generated dashboard has a background treatment other than plain Splunk grey — gradient wash, radial accent glow, or pattern; applied via splunk.rectangle or dashboard backgroundColor property
  2. A generated dashboard has an identifiable hero zone — at least one KPI or primary viz occupies 40-60% of canvas width at the top, visually larger than secondary panels
  3. A generated dashboard shows card-group depth — background rectangles establish section separators between hero, primary, and detail zones
  4. A user reading a generated dashboard can identify the story from layout alone — the arrangement follows data narrative order (summary to detail, alert to root-cause, or KPI to trend)
**Plans**: 2 plans
Plans:
- [x] 12-01-PLAN.md — Create dashboard-composition.md reference and wire into vp-design SKILL.md
- [x] 12-02-PLAN.md — Extend generate_assets.js with gradient background PNG generation
**UI hint**: yes

### Phase 13: Accent Architecture Foundation
**Goal**: The color model is correct by default — data element fills use series colors, accent is reserved for glow/highlight/focus only, accentIntensity is uncapped for extreme effects, preview.png silhouettes are shape-distinct per viz type, and continuous animations use setInterval at 30fps
**Depends on**: Phase 12
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04, ACC-05
**Success Criteria** (what must be TRUE):
  1. A generated bar chart uses t.series[0], t.series[1], etc. for bar fills — t.accent does not appear as a fill color for any data element
  2. User sets accentIntensity above 100 and sees glow radius and shadowBlur scale beyond their previous maximum — no capping at 100 occurs in the generated JS
  3. Two preview.png thumbnails from the same pack are visually distinguishable by silhouette shape alone — a gauge preview shows an arc, a bar chart shows columns, a table shows rows
  4. t.accent appears only in hover highlight, selection ring, glow halo, or focus indicator code — no ctx.fillStyle = t.accent calls are present outside those contexts
  5. LED pulse and continuous animations use setInterval at 30fps, not requestAnimationFrame at 60fps
**Plans**: 3 plans
Plans:
- [ ] 13-01-PLAN.md — Establish color model: DPR-03b in design-principles.md, series[] in theme-template.md, uncap accentIntensity in formatter-patterns.md
- [ ] 13-02-PLAN.md — Update vp-viz SKILL.md checklist for accent/series roles, uncap gi, switch LED pulse to setInterval in animation-recipes.md
- [ ] 13-03-PLAN.md — Expand generate_assets.js: 10 silhouette types, domain keywords, contrast guard

### Phase 14: Smart Fields & Domain Ideation
**Goal**: Generated vizs read field names from data.fields at runtime instead of relying on hardcoded formatter inputs, and every pack includes at least two viz types that are domain-specific with Canvas complexity guardrails for overambitious types
**Depends on**: Phase 13
**Requirements**: SFD-01, SFD-02, SFD-03, SFD-04, DOM-01, DOM-02, DOM-03, DOM-04
**Success Criteria** (what must be TRUE):
  1. A generated multi-series viz (line, area, bar) fed a search result with 4 numeric columns plots all 4 as distinct series — no hardcoded field name input required from the user
  2. A generated table viz auto-renders all columns present in data.fields — no xField/yField formatter controls are pre-required for the viz to show data
  3. Fields prefixed with _ (e.g., _time, _raw, _indextime) never appear as auto-discovered series or columns in any generated viz
  4. User adds an xField formatter control and its value overrides the auto-discovered field for that role — auto-discovery is the default, manual override takes precedence
  5. A generated viz pack for a specific domain (e.g., SOC, Energy, Healthcare) contains at least 2 viz types that could not exist outside that domain, drawn from domain-templates.md entries annotated "no generic equivalent"
  6. When a domain-specific viz type exceeds Canvas 2D complexity budget, the generated code uses the documented proxy pattern — not a blank panel or a JS error
**Plans**: 2 plans
Plans:
- [ ] 14-01-PLAN.md — Domain visual language step in vp-design + domain-unique viz entries in domain-templates.md
- [ ] 14-02-PLAN.md — Auto-field discovery patterns reference + vp-viz SKILL.md template update

### Phase 15: Mandatory Dashboard Packaging
**Goal**: Every generated viz pack ships with a Dashboard Studio view containing all vizs — the dashboard is generated automatically as the final packaging step and is blocked if any viz fails validation
**Depends on**: Phase 14
**Requirements**: DSB-01, DSB-02, DSB-03
**Success Criteria** (what must be TRUE):
  1. User runs vp-create and a Dashboard Studio JSON file is produced without any additional prompting — dashboard generation is Step 3c, not an optional extra
  2. The generated dashboard contains one panel per viz in the pack — a pack with 5 vizs produces a dashboard with exactly 5 panels
  3. vp-create refuses to generate the dashboard and reports an error if validate_viz.sh exits non-zero for any viz — the dashboard is never produced from broken vizs
**Plans**: 1 plan
Plans:
- [ ] 15-01-PLAN.md — Add Step 3c mandatory dashboard generation to vp-create with validation gate and panel count verification

### Phase 16: Code Quality & Reference Cleanup
**Goal**: The canvas-recipes.md reference file is under 500 lines, and generated viz code never produces a capped accentIntensity, a missing hover early-exit, a KPI without sparkline, or a duplicate preview silhouette
**Depends on**: Phase 15
**Requirements**: CQ-01, CQ-02, CQ-03, CQ-04, CQ-05
**Success Criteria** (what must be TRUE):
  1. canvas-recipes.md is under 500 lines — duplicate sections are removed and remaining content cross-references split files; verified by wc -l
  2. A generated viz's accentIntensity calculation passes grep for Math.min capping and produces no match — the cap is absent from all generated JS
  3. Every generated viz's _onMouseMove function begins with a showHoverEffect guard that returns immediately when the toggle is false — no exceptions across any viz type
  4. A generated KPI viz's formatter.html contains sparkPlacement and sparkHeight controls, and the corresponding JS renders a sparkline by default
  5. Two preview.png thumbnails in the same generated pack have distinct shapes — grepping the generate_assets.js silhouette map confirms each @viz-type annotation maps to a unique drawing routine
**Plans**: 2 plans
Plans:
- [x] 16-01-PLAN.md — Trim canvas-recipes.md from 998 to under 500 lines (remove duplicates, condense verbose sections)
- [x] 16-02-PLAN.md — Add D09/D10/D11 design quality rules, update pre-code-checklist.md and viz-blueprints.md

### Phase 17: Dashboard Schema & Composition
**Goal**: Generated tabbed dashboards use the correct JSON schema, the dashboard background is visually dramatic, every dashboard has a branded title panel, and ds-int-tabs is loaded automatically when tabs are needed
**Depends on**: Phase 16
**Requirements**: DQ-01, DQ-02, DQ-03, DQ-04
**Success Criteria** (what must be TRUE):
  1. A generated tabbed dashboard opens in Splunk without "Layout undefined" errors — tabs.items are objects with layoutId and label fields, and barPosition is used (not tabBarPosition)
  2. A generated dashboard background is visually distinct from default Splunk grey — it uses depth layers (at minimum a gradient wash plus a radial accent glow or branded pattern element)
  3. Every generated dashboard contains a splunk.markdown panel at the top with the brand name or project title visible — the panel is present even if no explicit title was requested
  4. When a user requests a dashboard with 7 or more vizs or explicitly requests tabs, ds-int-tabs is loaded before any dashboard JSON is written — no manual reminder required
**Plans**: 2 plans
Plans:
- [x] 17-01-PLAN.md — Add DS2/DS3/DS4 checks to validate_dash.js + tests (tab schema, background, title panel)
- [x] 17-02-PLAN.md — Update dashboard-json-template.md with mandatory title section + vp-create SKILL.md ds-int-tabs conditional load
**UI hint**: yes

### Phase 18: Interactive Dashboard Features
**Goal**: Generated dashboards work interactively out of the box — clicking a viz panel filters downstream panels, input dropdowns let users change time range and category, and default token values ensure the dashboard renders meaningfully before any interaction
**Depends on**: Phase 17
**Requirements**: INT-01, INT-02, INT-03
**Success Criteria** (what must be TRUE):
  1. User clicks a panel in a generated dashboard and a downstream panel's search updates to show filtered data — the drilldown token is set, referenced in a downstream search, and the panel refreshes
  2. A generated dashboard contains at least one input control (time range picker or dropdown) that filters one or more panels — the input's token is referenced in a search query
  3. Every drilldown token in a generated dashboard has a default value defined in defaults.tokens — the dashboard displays meaningful data before any click, not an empty or broken panel
**Plans**: 3 plans
Plans:
- [x] 18-01-PLAN.md — Create dashboard-interactivity.md reference + wire MUST LOAD gate into vp-create SKILL.md
- [x] 18-02-PLAN.md — Add DS5 check (setToken without token default) to validate_dash.js + tests
- [x] 18-03-PLAN.md — Series color formatter overhaul, conf flags, SKILL.md cleanup, viz-blueprints _onClick template
**UI hint**: yes

### Phase 19: Validator Fixes
**Goal**: The three known false-positive and false-negative bugs in validate_dash.js and check_design.js are corrected so the validation pipeline reports accurate findings on generated output
**Depends on**: Phase 18
**Requirements**: VF-01, VF-02, VF-03
**Success Criteria** (what must be TRUE):
  1. Running validate_dash.js against a valid dashboard JSON that uses vizId (not item.item) produces zero DS4 findings — the check accepts both property names
  2. Running check_design.js against a viz that defines _onMouseMove after a comment block produces zero false-positive D11 findings — the scan starts from the method definition, not the first string occurrence
  3. Running validate_dash.js against a dashboard with a defaults.tokens.default entry of "*" produces a DS5 pass — only non-wildcard or missing entries trigger the check
**Plans**: 1 plan
Plans:
- [x] 19-01-PLAN.md -- Fix DS4 vizId/item, add DS5w WARN, fix D11 lastIndexOf in validate_dash.js and check_design.js

### Phase 20: Data Binding & Drilldown
**Goal**: Every generated viz reads field names from data.fields at runtime and every clickable panel has complete drilldown wiring — both the JS _onClick and the dashboard JSON eventHandlers are present and correctly paired
**Depends on**: Phase 19
**Requirements**: DB-01, DB-02, DB-03, DR-01, DR-02, DR-03
**Success Criteria** (what must be TRUE):
  1. A generated viz fed a search result with a differently-named field than the formatter default auto-discovers and renders that field — no hardcoded domain-specific fallback strings appear in JS
  2. A generated formatter's "Data configurations" text input shows an empty default with placeholder "Auto-detected from data. Override if needed." — not a pre-filled domain string like "artist_name"
  3. Formatter section labels read "Data configurations" (or equivalent generic text using {{VIZ_NAMESPACE}}) — no domain-baked labels like "Artist Leaderboard: Data configurations" appear in any generated formatter.html
  4. Every clickable viz in a generated pack has _onClick implemented with hit-test logic and this.drilldown() call — verified by inspecting visualization_source.js
  5. Every panel with _onClick in a generated pack has matching dashboard JSON with "drilldown": "all" in options and an eventHandlers entry with drilldown.setToken — neither half is present without the other
**Plans**: 2 plans
Plans:
- [x] 20-01-PLAN.md — Data binding: remove Data configurations section, add formatData() note, Expected columns + drilldown notes per viz type
- [x] 20-02-PLAN.md — Drilldown enforcement: vp-create Step 3c all-panel wiring, Section 8 seriesColors in dashboard-interactivity.md

### Phase 21: Animation & Visual Polish
**Goal**: Animation controls produce the visible behaviors they promise, gradient fills appear when the visual language specifies them, and the light theme passes WCAG AA contrast — the pack looks premium and correct in both themes out of the box
**Depends on**: Phase 20
**Requirements**: AN-01, AN-02, AN-03, VP-01, VP-02, VP-03
**Success Criteria** (what must be TRUE):
  1. User toggles showEntrance to On in a generated viz and sees a visible entrance animation (arc fill, row cascade, or opacity fade) within the first render — toggling Off stops it with no other visual change
  2. User enables flashCritical on a critical-status element and sees shadowBlur oscillating visibly at 500-800ms — the pulse is legible without reading source code
  3. User sets animationSpeed to "slow" and back to "fast" and measures a perceptible timing difference — the control actually changes the interval or duration used in JS
  4. A generated viz pack with fillTechnique: gradient in its visual language contains at least one createLinearGradient or createRadialGradient call per viz — no flat fill substitutes appear
  5. User switches a generated viz to light themeMode and hero text (value/score/label) renders at full opacity with 4.5:1 contrast or better against the panel background — verified by check_contrast.js
**Plans**: 2 plans
Plans:
- [x] 21-01-PLAN.md — D01 conditional FAIL for gradient enforcement (check_design.js + tests + theme-template.md)
- [x] 21-02-PLAN.md — Animation enforcement + light theme contrast in SKILL.md + viz-blueprints.md
**UI hint**: yes

### Phase 22: Validator Feedback Loop
**Goal**: The validation pipeline tells Claude which viz failed D01/D08 by name, and the vp-viz pipeline self-corrects XFILE/D08 violations before handing off to vp-create — removing the manual fix cycle
**Depends on**: Phase 21
**Requirements**: VI-01, VI-02
**Success Criteria** (what must be TRUE):
  1. Running check_design.js on a pack with a D01 violation in "gauge_ring" produces output that includes the viz name "gauge_ring" in the finding message — not just "D01: No gradient calls found"
  2. Running check_design.js on a pack with a D08 violation in "kpi_tile" produces output that includes the viz name "kpi_tile" in the finding message — not just "D08: Formatter control not read in JS"
  3. After building all vizs in vp-viz, the pipeline automatically runs validate_viz.sh and if XFILE or D08 findings are present, reports which viz+control failed, applies fixes, rebuilds, and re-validates without user intervention — all within a single pipeline invocation (max 2 repair iterations)
**Plans**: 2 plans
Plans:
- [x] 22-01-PLAN.md — Add viz name to D01/D08 output in check_design.js; update D01/D08 tests to assert viz name presence
- [x] 22-02-PLAN.md — Add post-build validate+loop to vp-viz SKILL.md pipeline step; document XFILE/D08 auto-fix behaviour

### Phase 23: Color Palette & Accent Foundation
**Goal**: Every generated formatter ships with 6-8 brand palette swatches in color pickers, light theme textFaint is dark enough to pass WCAG AA, and accentColor is restored with unambiguous usage rules — glow/hover/selection only, never solid fill
**Depends on**: Phase 22
**Requirements**: CP-01, CP-02, CP-03
**Success Criteria** (what must be TRUE):
  1. A generated formatter.html for any viz type contains at least 6 <splunk-color> elements inside every <splunk-color-picker> — populated from the brand palette extracted during vp-design
  2. theme-template.md LIGHT object textFaint value is #6B7080 or darker — verified by running check_contrast.js against a generated light-theme pack and seeing zero WCAG AA failures on body text
  3. The generated formatter.html for every viz includes an accentColor <splunk-color-picker> with 6-8 brand palette swatches, and the corresponding JS uses t.accent exclusively in withAlpha() calls inside hover, glow-halo, selection-ring, or threshold-flash contexts — no ctx.fillStyle = t.accent solid fills appear outside those contexts
  4. Setting accentIntensity to 0 in the formatter produces a viz with no visible glow, halo, or highlight overlay — the accent effects fully disappear at intensity 0
**Plans**: 2 plans
Plans:
- [x] 23-01-PLAN.md — Update formatter-patterns.md brand swatch template; update vp-design SKILL.md to extract and pass palette to formatter generation step
- [x] 23-02-PLAN.md — Update theme-template.md LIGHT textFaint to #6B7080; restore accentColor picker in formatter-patterns.md with usage contract comment

### Phase 24: Animation Boilerplate
**Goal**: animation-recipes.md contains generic copy-paste ES5 entrance and LED pulse boilerplates that work for any viz type, and viz-blueprints.md per-viz animation notes point to the correct boilerplate by name — no more "implementation varies"
**Depends on**: Phase 22
**Requirements**: AB-01, AB-02, AB-03
**Success Criteria** (what must be TRUE):
  1. animation-recipes.md contains a clearly-labelled "Generic Entrance Boilerplate" section with a self-contained ~15-line ES5 requestAnimationFrame block — it compiles with no modifications other than substituting the draw call
  2. animation-recipes.md contains a clearly-labelled "Generic LED Pulse Boilerplate" section with a self-contained setInterval 30fps shadowBlur oscillation block — it compiles with no modifications other than substituting the target element reference
  3. Every viz type entry in viz-blueprints.md that previously said "animation varies by type" or equivalent now says "use Generic Entrance Boilerplate" or "use Generic LED Pulse Boilerplate" with a direct section reference
**Plans**: 2 plans
Plans:
**Wave 1**
- [x] 24-01-PLAN.md — Write Generic Entrance Boilerplate and Generic LED Pulse Boilerplate sections in animation-recipes.md

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 24-02-PLAN.md — Update viz-blueprints.md animation notes to reference specific boilerplates by section name

### Phase 25: Backgrounds & Preview Assets
**Goal**: generate_assets.js produces a background image that matches the visual language backgroundType (not always the same dark radial gradient), generates a light mode background variant, and preview.png thumbnails use brand gradient fills with recognizable viz silhouette shapes and a 2x variant
**Depends on**: Phase 23
**Requirements**: BG-01, BG-02, BG-03, PA-01, PA-02
**Success Criteria** (what must be TRUE):
  1. Running generate_assets.js for a brand with backgroundType: "geometric_pattern" produces a background PNG with a visible repeating geometric pattern — not the default radial gradient
  2. Running generate_assets.js for a brand with backgroundType: "solid_texture" produces a different background PNG than a brand with backgroundType: "gradient" — the two are visually distinct
  3. generate_assets.js produces a bg_gradient_light.png (or sets Dashboard Studio backgroundColor) alongside the dark background — the light background is white or near-white with a subtle brand accent, not a darkened color
  4. A generated preview.png uses at least two brand palette colors as gradient fills on the silhouette shapes — not a single flat fill or monochrome outline
  5. A generated preview.png is 116x76 pixels (official Splunk viz picker spec) — validate_viz.sh A02 passes on the generated file
  6. A generated appIcon.png displays a recognizable domain symbol (e.g., heartbeat line for healthcare, shield for security) using the brand primary color — not a generic colored circle
**Plans**: 2 plans
Plans:
**Wave 1**
- [x] 25-01-PLAN.md — BG track: add backgroundType/backgroundPattern to vp-design schema + theme-template; implement 4-type background dispatcher + light variants in generate_assets.js; tests T11-T16

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 25-02-PLAN.md — PA track: resize all preview silhouettes to 116x76 with 2-color mini-renders; extend appIcon with 15-symbol domain cascade; update validate_viz.sh A02 check; T8 update + T17

### Phase 26: Multi-Channel Archetype
**Goal**: The Multi-Channel Composite archetype is documented in viz-blueprints.md as a first-class pattern, and data-rich domain entries in domain-templates.md reference it with concrete channel configurations for F1/motorsport, healthcare monitoring, and network ops
**Depends on**: Phase 24
**Requirements**: MC-01, MC-02
**Success Criteria** (what must be TRUE):
  1. viz-blueprints.md contains a "Multi-Channel Composite" entry with a description of the stacked synchronized channels pattern, a shared x-axis specification, per-channel y-scale guidance, and at least one complete channel configuration example
  2. The domain-templates.md entry for F1/motorsport (or equivalent data-rich domain) references the Multi-Channel Composite archetype with specific channel names (e.g., throttle %, brake %, speed km/h) — not a generic pointer
  3. The domain-templates.md entry for healthcare monitoring references the Multi-Channel Composite archetype with specific channel names (e.g., heart rate, SpO2, respiration rate) — not a generic pointer
**Plans**: 2 plans
Plans:
- [x] 26-01-PLAN.md — Add Multi-Channel Composite archetype to viz-blueprints.md with full pattern specification and one worked example
- [x] 26-02-PLAN.md — Add multi-channel archetype references to F1/motorsport, healthcare monitoring, and network ops entries in domain-templates.md
**UI hint**: yes

### Phase 27: API Correctness
**Goal**: Fix drilldown payload shape to official spec; splunkCategorical color pickers; threshold 3-band RAG template; escapeHtml() for XSS prevention
**Depends on**: Phase 26
**Requirements**: AC-01, AC-02, AC-03, AC-04
**Success Criteria** (what must be TRUE):
  1. The _onClick template in viz-blueprints.md uses `{data: {fieldName: value}}` payload shape with browserEvent as the second argument to this.drilldown() — no `field:` or `value:` properties remain
  2. The FIELD_VALUE_DRILLDOWN fallback note says string `'fieldvalue'`, not integer `1`
  3. Series color pickers in formatter-patterns.md use `type="splunkCategorical"` while brand/accent pickers retain `type="custom"`
  4. A "Threshold colors (3-band RAG)" section exists in formatter-patterns.md with thresholdField, thresholdLow, thresholdHigh, thresholdDirection, three color pickers, and per-element toggle controls
  5. edge-cases.md contains ECR-08 documenting escapeHtml() and makeSafeUrl() from SplunkVisualizationUtils with wrong/correct patterns
  6. pre-code-checklist.md includes a mandatory escapeHtml/makeSafeUrl check referencing ECR-08
**Plans**: 2 plans
Plans:
**Wave 1**
- [x] 27-01-PLAN.md — Fix drilldown payload shape in viz-blueprints.md + split color picker section to splunkCategorical/custom + add threshold RAG template in formatter-patterns.md

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 27-02-PLAN.md — Add ECR-08 escapeHtml/makeSafeUrl XSS prevention to edge-cases.md + mandatory check in pre-code-checklist.md

### Phase 28: Extension API Templates
**Goal**: Complete generation templates exist for the DS Extension API path — config.json, visualization.js (Canvas 2D wrapper), package.json, and app.conf — so Claude can generate Extension API vizs
**Depends on**: Phase 27
**Requirements**: ET-01, ET-02, ET-03, ET-04
**Success Criteria** (what must be TRUE):
  1. A config.json template exists with optionsSchema, editorConfig, and all 4 confirmed editor types (editor.color, editor.text, editor.number, editor.checkbox)
  2. A visualization.js template exists with VisualizationAPI import, listener-based state (data, options, theme, dimensions), columnar data access, Canvas 2D render function, and no-data fallback
  3. package.json and app.conf templates exist with correct @splunk/dashboard-studio-extension dependency and yarn build/package scripts
  4. The visualization.js template uses ESM import syntax and inlines shared/theme.js DARK/LIGHT tokens
**Plans**: 2 plans
Plans:
- [ ] 28-01-PLAN.md — Create config-json-template.md with optionsSchema, editorConfig, 4 editor types, drilldown wiring, Classic-vs-Extension comparison
- [x] 28-02-PLAN.md — Create visualization-js-template.md with Canvas 2D Extension API wrapper, listener-based state, columnar data, package.json and app.conf sections

### Phase 29: Skill Format Conditioning
**Goal**: vp-init asks the user to choose Classic or Extension format, stores the choice in the visual language, and vp-viz/vp-create read it to generate the correct file types
**Depends on**: Phase 28
**Requirements**: FC-01, FC-02, ES-01, ES-02, ES-03
**Success Criteria** (what must be TRUE):
  1. vp-init SKILL.md prompts the user to choose between "Classic (DS + Simple XML)" and "Extension (DS-only)" before brand research
  2. The format choice is stored in the visual language output and readable by downstream skills
  3. vp-viz SKILL.md has format-conditional sections — Extension path generates visualization.js + config.json, Classic path generates visualization_source.js + formatter.html
  4. pre-code-checklist.md has Extension API items — ESM syntax, columnar data, no VIZ_NAMESPACE, addDrilldownListener
  5. vp-create SKILL.md has Extension API packaging — yarn install + yarn package instead of build_flat.js + manual tar
**Plans**: 3 plans
Plans:
- [x] 29-01-PLAN.md — Add format choice question to vp-init SKILL.md + include format field in hand-off to vp-design
- [x] 29-02-PLAN.md — Add format-conditional generation section to vp-viz SKILL.md + Extension API items to pre-code-checklist.md
- [x] 29-03-PLAN.md — Add format-conditional build/package section to vp-create SKILL.md

### Phase 30: Data & Drilldown Adapter
**Goal**: viz-blueprints.md and edge-cases.md document the Extension API data access and drilldown patterns alongside Classic patterns, so Claude generates correct code for either format
**Depends on**: Phase 28
**Requirements**: DA-01, DA-02, DT-01, DT-02
**Success Criteria** (what must be TRUE):
  1. viz-blueprints.md documents columnar data access (columns[fieldIdx][rowIdx]) alongside the existing row-major pattern
  2. edge-cases.md has Extension API-specific entries — loading gate, dataSources null check, string-to-number conversion, iframe sandbox
  3. viz-blueprints.md _onClick template has an Extension API variant using addDrilldownListener/triggerDrilldown
  4. config.json template has showDrilldown, hasEventHandlers, and canSetTokens correctly set for drilldown-enabled vizs
**Plans**: 2 plans

### Phase 31: Build & Validation
**Goal**: validate_viz.sh detects format=extension and applies Extension API-specific checks, and the build path produces a valid .spl file
**Depends on**: Phase 29, Phase 30
**Requirements**: BV-01, BV-02
**Success Criteria** (what must be TRUE):
  1. validate_viz.sh has a format-aware mode checking config.json schema, ESM syntax, and columnar data patterns for Extension API vizs
  2. Running yarn package on a scaffolded Extension API app produces a .spl file with the correct internal structure
**Plans**: 2 plans

### Phase 32: Aesthetic Scoring
**Goal**: score_design.js automatically scores generated viz code on aesthetic dimensions and integrates as an optional Phase 5 in the validation pipeline
**Depends on**: Phase 27 (independent of dual-format work)
**Requirements**: AS-01, AS-02
**Success Criteria** (what must be TRUE):
  1. score_design.js exists and scores generated viz code on gradient usage, typography hierarchy, spacing ratios, color variety, and animation presence
  2. Running score_design.js produces a 0-100 numeric score with per-dimension breakdown
  3. validate_viz.sh runs score_design.js as an optional Phase 5 check when invoked with --score flag
**Plans**: 2 plans

### Phase 33: Test Build
**Goal**: One complete end-to-end build using the Extension API path produces a working .spl file with 3+ vizs, validating the entire dual-format pipeline
**Depends on**: Phase 31
**Requirements**: TB-01
**Success Criteria** (what must be TRUE):
  1. A test build using the Extension API path produces a .spl file containing 3+ branded vizs
  2. The .spl internal structure matches the Extension API spec — framework_type=studio_visualization in visualizations.conf, config.json per viz, bundled visualization.js per viz
  3. Each viz in the pack has working theme detection, no-data fallback, and drilldown wiring
**Plans**: 1 plan

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Baseline & Core Validators | v4.1.0 | 3/3 | Complete | 2026-05-14 |
| 2. Schema & Cross-file Validation | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 3. Repair Loop & Light Theme Safety | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 4. Visual Identity & Assets | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 5. Rule Consolidation | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 6. Design Principles & Skill Layer | v5.0.0 | 3/3 | Complete | 2026-05-16 |
| 7. Generation Quality & Theme Parity | v5.0.0 | 4/4 | Complete | 2026-05-16 |
| 8. Design Quality Gate & Edge Case Resilience | v5.0.0 | 3/3 | Complete | 2026-05-16 |
| 9. Animation & Motion | v5.0.0 | 3/3 | Complete | 2026-05-16 |
| 10. Foundation Fixes | v5.1.0 | 2/2 | Complete | 2026-05-18 |
| 11. Blueprint Expansion & Creative Freedom | v5.1.0 | 2/2 | Complete | 2026-05-18 |
| 12. Dashboard Composition | v5.1.0 | 2/2 | Complete | 2026-05-18 |
| 13. Accent Architecture Foundation | v5.2.0 | 0/3 | Not started | - |
| 14. Smart Fields & Domain Ideation | v5.2.0 | 0/2 | Not started | - |
| 15. Mandatory Dashboard Packaging | v5.2.0 | 0/1 | Not started | - |
| 16. Code Quality & Reference Cleanup | v5.3.0 | 2/2 | Complete | 2026-05-18 |
| 17. Dashboard Schema & Composition | v5.3.0 | 2/2 | Complete | 2026-05-18 |
| 18. Interactive Dashboard Features | v5.3.0 | 3/3 | Complete | 2026-05-19 |
| 19. Validator Fixes | v5.4.0 | 1/1 | Complete | 2026-05-19 |
| 20. Data Binding & Drilldown | v5.4.0 | 2/2 | Complete | 2026-05-19 |
| 21. Animation & Visual Polish | v5.4.0 | 2/2 | Complete | 2026-05-19 |
| 22. Validator Feedback Loop | v5.5.0 | 2/2 | Complete    | 2026-05-20 |
| 23. Color Palette & Accent Foundation | v5.5.0 | 2/2 | Complete    | 2026-05-20 |
| 24. Animation Boilerplate | v5.5.0 | 2/2 | Complete    | 2026-05-20 |
| 25. Backgrounds & Preview Assets | v5.5.0 | 2/2 | Complete    | 2026-05-20 |
| 26. Multi-Channel Archetype | v5.5.0 | 2/2 | Complete   | 2026-05-21 |
| 27. API Correctness | v5.5.0 | 2/2 | Complete   | 2026-05-21 |
| 28. Extension API Templates | v5.6.0 | 2/2 | Complete   | 2026-05-22 |
| 29. Skill Format Conditioning | v5.6.0 | 3/3 | Complete   | 2026-05-22 |
| 30. Data & Drilldown Adapter | v5.6.0 | 0/2 | Not started | - |
| 31. Build & Validation | v5.6.0 | 0/2 | Not started | - |
| 32. Aesthetic Scoring | v5.6.0 | 0/2 | Not started | - |
| 33. Test Build | v5.6.0 | 0/1 | Not started | - |
