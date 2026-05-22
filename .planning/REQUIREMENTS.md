# Requirements: splunk-knowledge — v5.6.0 DS Extension API & Dual-Format Architecture

**Defined:** 2026-05-21
**Core Value:** When a user runs `/vp-init`, they choose Classic (DS+SXML) or Extension (DS-only) format, and both paths produce a first-build-success viz pack with the same wow-factor quality.

**Research driving this milestone:** DS Extension API official docs (help.splunk.com 10.4.2604), .planning/research/ds-extension-api.md

## v1 Requirements

### Format Choice (FC)

- [x] **FC-01**: vp-init prompts the user to choose between "Classic (works in DS + Simple XML)" and "Extension (DS-only, modern API)" before proceeding with brand research
- [x] **FC-02**: The format choice is stored in the visual language output and propagated to vp-viz and vp-create — all downstream skills read it without re-asking

### Extension API Templates (ET)

- [ ] **ET-01**: A config.json template exists in vp-viz references with optionsSchema, editorConfig sections, and the 4 confirmed editor types (editor.color, editor.text, editor.number, editor.checkbox)
- [x] **ET-02**: A visualization.js template exists for Extension API Canvas 2D vizs — VisualizationAPI import, listener-based state management, columnar data access, theme detection, no-data fallback
- [x] **ET-03**: A package.json and app.conf template exist for Extension API apps — @splunk/dashboard-studio-extension dependency, esbuild devDep, yarn build/package scripts
- [x] **ET-04**: The visualization.js template inlines shared/theme.js tokens (DARK/LIGHT) and uses ESM import syntax — not AMD define()

### Extension API Skill Updates (ES)

- [ ] **ES-01**: vp-viz SKILL.md has a format-conditional section — when format=extension, it generates visualization.js + config.json instead of visualization_source.js + formatter.html
- [ ] **ES-02**: vp-viz pre-code-checklist.md has Extension API items alongside Classic items — ESM syntax, columnar data access, no VIZ_NAMESPACE in config.json, addDrilldownListener instead of _onClick
- [ ] **ES-03**: vp-create SKILL.md has Extension API packaging steps — yarn install + yarn package instead of build_flat.js + manual tar

### Data Adapter (DA)

- [ ] **DA-01**: viz-blueprints.md documents the columnar data access pattern alongside the existing row-major pattern — columns[fieldIdx][rowIdx] with parseFloat/parseInt for all numeric values
- [ ] **DA-02**: edge-cases.md documents Extension API-specific edge cases — loading gate, dataSources null check, string-to-number conversion, iframe sandboxing (no window.parent)

### Drilldown & Tokens (DT)

- [ ] **DT-01**: viz-blueprints.md _onClick template has an Extension API variant using addDrilldownListener or triggerDrilldown with the correct payload shape
- [ ] **DT-02**: config.json template has showDrilldown, hasEventHandlers, and canSetTokens correctly wired for drilldown-enabled vizs

### Build & Validation (BV)

- [ ] **BV-01**: validate_viz.sh has a format-aware mode — when format=extension, it checks config.json schema instead of formatter.html, ESM syntax instead of AMD, and columnar data patterns instead of ROW_MAJOR
- [ ] **BV-02**: The Extension API build path produces an installable .spl file when `yarn package` runs — verified by a test build

### Aesthetic Scoring (AS)

- [ ] **AS-01**: score_design.js exists as a new validator that scores generated viz code on aesthetic dimensions — gradient usage, typography hierarchy, spacing ratios, color variety, animation presence
- [ ] **AS-02**: score_design.js produces a numeric score (0-100) with per-dimension breakdowns — integrated into validate_viz.sh as an optional Phase 5 check

### Test Build (TB)

- [ ] **TB-01**: One complete end-to-end test build using the Extension API path produces a working .spl file with at least 3 vizs — installed and verified in Splunk (or verified by structure inspection if no Splunk instance)

## Future Requirements

- editor.select/editor.radio discovery — expand config.json controls when Splunk documents more editor types
- React template — for complex interactive vizs that benefit from React hooks
- CLI-free build.mjs generation — remove dependency on @splunk/create scaffold
- Dashboard JSON options namespacing investigation — how Extension API viz options appear in DS JSON
- Dual-format dashboard generation — vp-create produces correct dashboard JSON for both Classic and Extension vizs

## Out of Scope

- React-based viz rendering — stick with Canvas 2D for both formats
- Migrating existing Classic vizs to Extension API — new generation only
- Splunkbase publishing workflow — packaging produces .spl, publishing is manual
- @splunk/dashboard-studio-extension version pinning — use latest until stabilized

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| FC-01 | TBD | - | pending |
| FC-02 | TBD | - | pending |
| ET-01 | TBD | - | pending |
| ET-02 | TBD | - | pending |
| ET-03 | TBD | - | pending |
| ET-04 | TBD | - | pending |
| ES-01 | TBD | - | pending |
| ES-02 | TBD | - | pending |
| ES-03 | TBD | - | pending |
| DA-01 | TBD | - | pending |
| DA-02 | TBD | - | pending |
| DT-01 | TBD | - | pending |
| DT-02 | TBD | - | pending |
| BV-01 | TBD | - | pending |
| BV-02 | TBD | - | pending |
| AS-01 | TBD | - | pending |
| AS-02 | TBD | - | pending |
| TB-01 | TBD | - | pending |
