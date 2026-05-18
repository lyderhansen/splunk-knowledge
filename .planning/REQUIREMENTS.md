# Requirements: splunk-knowledge — v5.3.0 Production Polish & Interactive Dashboards

**Defined:** 2026-05-18
**Core Value:** When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

## v1 Requirements

### Code Quality (CQ)

- [x] **CQ-01**: canvas-recipes.md trimmed from 998 to under 500 lines — duplicate sections removed, remaining content cross-references split files
- [x] **CQ-02**: Generated viz code never clamps accentIntensity to 1.0 — verified by grep across test output
- [x] **CQ-03**: Every generated viz has showHoverEffect early-exit in _onMouseMove — no exceptions
- [x] **CQ-04**: KPI viz blueprint includes sparkline as a standard feature — sparkPlacement and sparkHeight in Settings
- [x] **CQ-05**: Preview.png uses @viz-type annotation from source file — unique silhouette per viz, no duplicates in same pack

### Dashboard Quality (DQ)

- [x] **DQ-01**: Tabbed dashboard JSON uses correct schema — tabs.items are objects with layoutId+label, barPosition not tabBarPosition, no "Layout undefined" errors
- [x] **DQ-02**: Dashboard background is visually dramatic — not just a dark gradient, uses depth layers and brand-specific treatment
- [x] **DQ-03**: Dashboard always has a visible branded title — splunk.markdown panel at top
- [x] **DQ-04**: ds-int-tabs skill is automatically loaded when dashboard has 7+ vizs or user requests tabs

### Interactive Features (INT)

- [ ] **INT-01**: Generated dashboards have working drilldown token flows — click a viz panel, downstream panels filter
- [ ] **INT-02**: Generated dashboards have input dropdowns for common filters (time range, category)
- [ ] **INT-03**: Drilldown tokens have default values so dashboard works before any click

## Future Requirements

- validate_dash.js automated dashboard JSON schema checker
- Aviation and Fintech domain-specific viz types
- Real Splunk data integration patterns (production SPL templates)

## Out of Scope

- Responsive dashboard layouts — Dashboard Studio uses absolute positioning only
- Real-time streaming vizs — standard Splunk polling is sufficient
- Mobile-responsive viz rendering — desktop/wall-display only

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| CQ-01 | Phase 16 | - | pending |
| CQ-02 | Phase 16 | - | pending |
| CQ-03 | Phase 16 | - | pending |
| CQ-04 | Phase 16 | - | pending |
| CQ-05 | Phase 16 | - | pending |
| DQ-01 | Phase 17 | - | pending |
| DQ-02 | Phase 17 | - | pending |
| DQ-03 | Phase 17 | - | pending |
| DQ-04 | Phase 17 | - | pending |
| INT-01 | Phase 18 | - | pending |
| INT-02 | Phase 18 | - | pending |
| INT-03 | Phase 18 | - | pending |
