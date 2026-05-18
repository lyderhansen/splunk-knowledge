# Requirements: splunk-knowledge — v5.2.0 Smart Vizs & Domain Identity

**Defined:** 2026-05-18
**Core Value:** When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

## Constraint: Zero User Dependencies

Plugins must work with **zero external dependencies for end users**. All validation tooling runs inside skill scripts executed by Claude Code during builds. If Node.js is unavailable, validators fall back gracefully.

## v1 Requirements

### Accent Architecture (ACC)

- [ ] **ACC-01**: Data element fills (bars, arcs, cells, area) use `t.series[i]` colors — never `t.accent`
- [ ] **ACC-02**: `t.accent` is reserved for hover highlight, selection state, glow effects, and focus rings only
- [ ] **ACC-03**: `accentIntensity` accepts values above 100 — uncapped multiplier for extreme glow
- [ ] **ACC-04**: Preview.png silhouettes are visually distinct per viz type with high contrast against background

### Smart Fields (SFD)

- [ ] **SFD-01**: Multi-series vizs (line, area, bar) auto-discover all numeric fields from `data.fields` and plot as series
- [ ] **SFD-02**: Table/list vizs auto-discover all columns from `data.fields` — no hardcoded field name inputs
- [ ] **SFD-03**: Fields prefixed with `_` (internal Splunk fields) are excluded from auto-discovery
- [ ] **SFD-04**: User can override auto-discovered fields via formatter controls (xField, statusField, etc.)

### Domain Identity (DOM)

- [ ] **DOM-01**: vp-design researches the domain's visual language before choosing viz types — not after
- [ ] **DOM-02**: Every pack includes at least 2 viz types that could not exist outside that domain
- [ ] **DOM-03**: Domain-specific viz types have Canvas complexity gate — overambitious types get proxy patterns
- [ ] **DOM-04**: domain-templates.md includes domain-unique viz entries for SOC, Energy, Healthcare with "no generic equivalent" annotation

### Mandatory Dashboard (DSB)

- [ ] **DSB-01**: vp-create has mandatory Step 3c that generates a Dashboard Studio view with ALL vizs in the pack
- [ ] **DSB-02**: Dashboard panel count equals viz directory count — verified before packaging
- [ ] **DSB-03**: Dashboard generation is gated on clean validate_viz.sh exit — no dashboard if vizs fail

## Future Requirements

- Aviation and Fintech domain-specific viz types (deferred — need more test data)
- score_design.js automated aesthetic scoring (deferred — needs calibration)
- Auto-palette HSL derivation for series colors (deferred — needs visual validation)
- showHoverEffect early-exit enforcement in check_design.js (new FAIL code)

## Out of Scope

- Responsive dashboard layouts — Splunk Dashboard Studio uses absolute positioning only
- Real-time streaming vizs — standard Splunk polling is sufficient
- Mobile-responsive viz rendering — Splunk dashboards are desktop/wall-display
- Viz types requiring WebGL or SVG — Canvas 2D ES5 only

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| ACC-01 | Phase 13 | - | pending |
| ACC-02 | Phase 13 | - | pending |
| ACC-03 | Phase 13 | - | pending |
| ACC-04 | Phase 13 | - | pending |
| SFD-01 | Phase 14 | - | pending |
| SFD-02 | Phase 14 | - | pending |
| SFD-03 | Phase 14 | - | pending |
| SFD-04 | Phase 14 | - | pending |
| DOM-01 | Phase 14 | - | pending |
| DOM-02 | Phase 14 | - | pending |
| DOM-03 | Phase 14 | - | pending |
| DOM-04 | Phase 14 | - | pending |
| DSB-01 | Phase 15 | - | pending |
| DSB-02 | Phase 15 | - | pending |
| DSB-03 | Phase 15 | - | pending |
