# Roadmap: splunk-knowledge — Plugin Marketplace

## Milestones

- ✅ **v4.1.0 splunk-viz-packs Hardening** — Phases 1-5 (shipped 2026-05-15)
- 🚧 **v5.0.0 Design Awesomeness** — Phases 6-9 (in progress)

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

### 🚧 v5.0.0 Design Awesomeness (In Progress)

**Milestone Goal:** Make every generated viz pack look like it was designed by a professional design studio — depth, glow, premium typography, intelligent configuration, and bulletproof code.

- [x] **Phase 6: Design Principles & Skill Layer** — Codify premium Canvas 2D design rules into reference files; extend canvas-recipes.md with depth/texture/typography patterns; define cross-viz consistency contracts — completed 2026-05-16
- [ ] **Phase 7: Generation Quality & Theme Parity** — Upgrade vp-viz generation to produce 10-14 formatter options per viz type; make dark and light themes independently designed, not inverted
- [ ] **Phase 8: Design Quality Gate & Edge Case Resilience** — Ship check_design.js (D01-D08 design checks) wired into validate_viz.sh Phase 4; harden all generated code against empty/null/overflow data
- [x] **Phase 9: Animation & Motion** — Add requestAnimationFrame entrance animations, LED pulse effect, eased hover transitions, and staggered row entrance to the canvas-recipes.md toolkit; all togglable via formatter — completed 2026-05-16

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

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Baseline & Core Validators | v4.1.0 | 3/3 | Complete | 2026-05-14 |
| 2. Schema & Cross-file Validation | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 3. Repair Loop & Light Theme Safety | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 4. Visual Identity & Assets | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 5. Rule Consolidation | v4.1.0 | 3/3 | Complete | 2026-05-15 |
| 6. Design Principles & Skill Layer | v5.0.0 | 0/3 | Not started | - |
| 7. Generation Quality & Theme Parity | v5.0.0 | 0/4 | Not started | - |
| 8. Design Quality Gate & Edge Case Resilience | v5.0.0 | 0/3 | Not started | - |
| 9. Animation & Motion | v5.0.0 | 3/3 | Complete | 2026-05-16 |
