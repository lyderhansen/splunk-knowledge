# Requirements: splunk-knowledge — v5.1.0 Viz Hardening & Dashboard Wow-Factor

**Defined:** 2026-05-18
**Core Value:** When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

## Constraint: Zero User Dependencies

Plugins must work with **zero external dependencies for end users**. All validation tooling runs inside skill scripts executed by Claude Code during builds. If Node.js is unavailable, validators fall back gracefully.

## v1 Requirements

### Bug Fixes (FIX)

- [ ] **FIX-01**: User changes any formatter setting and sees the change reflected immediately — opt() uses two-path lookup (namespaced + short key)
- [ ] **FIX-02**: User sets showEntrance=false and sees the viz render at its final value immediately — no stuck-at-zero state
- [ ] **FIX-03**: User sees flashCritical LED pulse clearly visible on critical cells — shadowBlur 8-24px with solid inner fill as secondary cue
- [ ] **FIX-04**: User changes zone colors on ring gauge and sees the arc colors change — hexFromSplunk applied to all color picker opt() reads
- [ ] **FIX-05**: User toggles showHoverEffect off on leaderboard/status matrix and hover highlight stops

### Settings Completeness (SET)

- [ ] **SET-01**: User sees status matrix accept any status string value — not hardcoded to ok/warn/crit
- [ ] **SET-02**: User sees leaderboard with pagination controls — next/prev page when rows exceed maxRows
- [ ] **SET-03**: User can control KPI text placement — center/top/left/right positioning via formatter
- [ ] **SET-04**: User can control KPI sparkline placement and size — bottom/right/background with configurable height
- [ ] **SET-05**: User can show/hide cell value labels in status matrix via formatter toggle
- [ ] **SET-06**: User can show/hide column headers in leaderboard via formatter toggle

### Creative Freedom (CRE)

- [ ] **CRE-01**: Claude generates visually distinct KPI tiles per brand — no default centered-number template, creative decisions driven by brand personality
- [ ] **CRE-02**: All viz blueprints use "inspiration not template" language — Creative decisions section expanded, Technical rules section loosened
- [ ] **CRE-03**: Drilldown Field formatter control has clear help text explaining it sets which field value is passed on click

### Dashboard Composition (DSH)

- [ ] **DSH-01**: Generated dashboard has a branded background treatment — gradient wash, radial accent glow, or generated pattern; never a plain single color
- [ ] **DSH-02**: Generated dashboard has visual hierarchy — hero KPI strip at top, primary viz center, detail panels right
- [ ] **DSH-03**: Generated dashboard has depth — background rectangles creating card groups and section separators
- [ ] **DSH-04**: Generated dashboard tells a story — panel arrangement follows data narrative, not random grid placement

## Future Requirements

- Preview.png uniqueness — shape-distinct silhouettes per viz type (gauge=arc, kpi=number, table=rows)
- score_design.js automated aesthetic scoring (deferred — needs calibration against test packs)

## Out of Scope

- Responsive dashboard layouts — Splunk Dashboard Studio uses absolute positioning only
- Real-time animation sync across vizs — each viz manages its own rAF loop independently (D-12)
- Mobile-responsive viz rendering — Splunk dashboards are desktop/wall-display

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| FIX-01 | Phase 10 | - | pending |
| FIX-02 | Phase 10 | - | pending |
| FIX-03 | Phase 10 | - | pending |
| FIX-04 | Phase 10 | - | pending |
| FIX-05 | Phase 10 | - | pending |
| SET-01 | Phase 11 | - | pending |
| SET-02 | Phase 11 | - | pending |
| SET-03 | Phase 11 | - | pending |
| SET-04 | Phase 11 | - | pending |
| SET-05 | Phase 11 | - | pending |
| SET-06 | Phase 11 | - | pending |
| CRE-01 | Phase 11 | - | pending |
| CRE-02 | Phase 11 | - | pending |
| CRE-03 | Phase 11 | - | pending |
| DSH-01 | Phase 12 | - | pending |
| DSH-02 | Phase 12 | - | pending |
| DSH-03 | Phase 12 | - | pending |
| DSH-04 | Phase 12 | - | pending |
