# Requirements: splunk-knowledge — v5.5.0 Visual Wow-Factor & First-Build Perfection

**Defined:** 2026-05-20
**Core Value:** When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

**Test findings driving this milestone:** test37 (Spotify), test38 (Strava), F1 DataDrivers reference app, network-diagram-viz.

## v1 Requirements

### Background & Visual Identity (BG)

- [x] **BG-01**: Dashboard background supports multiple types: gradient (current), geometric pattern, brand photo overlay, solid with texture — selected by visual language `backgroundType` field
- [x] **BG-02**: generate_assets.js produces background type matching the visual language — not always the same dark radial gradient
- [x] **BG-03**: Light mode background variant generated alongside dark mode — bg_gradient_light.png or Dashboard Studio backgroundColor property

### Color Palette (CP)

- [x] **CP-01**: Every `<splunk-color-picker>` in generated formatters includes 6-8 brand palette colors as `<splunk-color>` elements — populated from the brand research palette
- [x] **CP-02**: Light theme `textFaint` default in theme-template.md passes WCAG AA 3:1 minimum on light background — darker default (#6B7080 or similar)
- [x] **CP-03**: `accentColor` picker restored in formatter with full brand palette swatches. Accent color used ONLY for glow halo, hover highlight, selection ring, and threshold flash — always as transparent overlay (withAlpha), never solid fill. accentIntensity scales visibly (80 = dramatic glow). Intensity 0 = no accent effects, clean transparent background.

### Multi-Channel Vizs (MC)

- [ ] **MC-01**: viz-blueprints.md includes a "Multi-Channel Composite" archetype showing stacked synchronized data channels with shared x-axis and per-channel y-scales (F1 lap analysis pattern)
- [x] **MC-02**: Domain-templates.md entries for data-rich domains (F1/motorsport, healthcare monitoring, network ops) reference the multi-channel archetype with example channel configurations

### Animation Behavior (AB)

- [x] **AB-01**: animation-recipes.md provides a generic 15-line ES5 entrance boilerplate that works for ANY viz type — Claude copies verbatim, customizes only the draw call
- [x] **AB-02**: animation-recipes.md provides a generic LED pulse boilerplate (setInterval 30fps, shadowBlur oscillation) that works for ANY viz type with status values
- [x] **AB-03**: viz-blueprints.md per-viz animation notes specify which boilerplate to use — not "implement varies by viz type"

### Preview Assets (PA)

- [x] **PA-01**: generate_assets.js preview.png uses 116x76 pixels (official Splunk spec), brand gradient fills, recognizable viz silhouette shapes — not 300x200 flat outlines
- [x] **PA-02**: generate_assets.js appIcon.png uses brand primary color with a recognizable symbol — not a generic colored circle

### API Correctness (AC)

- [x] **AC-01**: Drilldown payload uses official `data: { fieldName: value }` shape — not `{ field, value }`. Pass `browserEvent` as second argument for keyboard modifier support (ctrl+click → new tab)
- [x] **AC-02**: Series color pickers use `type="splunkCategorical"` (gives full Splunk palette) with brand `<splunk-color>` additions — not `type="custom"` only
- [x] **AC-03**: Threshold colors section template added to formatter-patterns.md — 3-band RAG pattern (thresholdField, thresholdLow/High, direction toggle, 3 color pickers, per-element toggles) for status-bearing vizs
- [ ] **AC-04**: `escapeHtml()` from SplunkVisualizationUtils used when adding search data to DOM — required for Splunk app certification (XSS prevention)

### Validator Improvements (VI)

- [x] **VI-01**: check_design.js D01/D08 findings include the viz name in the output message — no more guessing which viz failed
- [x] **VI-02**: vp-viz pipeline runs validate_viz.sh after all vizs are built and loops (max 2 iterations): if XFILE/D08 failures, report which viz + control, fix, rebuild, re-validate — before handing off to vp-create

## Future Requirements

- Token-based drilldown configuration in formatter (network-diagram-viz Tokens section pattern)
- Aviation and Fintech domain-specific viz types
- score_design.js automated aesthetic scoring
- Auto-palette HSL derivation for series colors
- Real Splunk data integration patterns (production SPL templates)
- Behavioral D08 check: verify opt() value is used in a conditional branch, not just read

## Out of Scope

- DOS expressions (`> x | getField()`) for custom viz field binding — platform-only
- DS Extension API generation (config.json, React hooks, esbuild) — v6.0 scope, dual-format architecture
- Responsive dashboard layouts — Dashboard Studio uses absolute positioning only
- Logo generation via external AI image APIs — keep pure JS Canvas generation

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| VI-01 | Phase 22 | 22-01 | pending |
| VI-02 | Phase 22 | 22-02 | pending |
| CP-01 | Phase 23 | 23-01 | pending |
| CP-02 | Phase 23 | 23-02 | pending |
| CP-03 | Phase 23 | 23-02 | pending |
| AB-01 | Phase 24 | 24-01 | pending |
| AB-02 | Phase 24 | 24-01 | pending |
| AB-03 | Phase 24 | 24-02 | pending |
| BG-01 | Phase 25 | 25-01 | pending |
| BG-02 | Phase 25 | 25-01 | pending |
| BG-03 | Phase 25 | 25-01 | pending |
| PA-01 | Phase 25 | 25-02 | pending |
| PA-02 | Phase 25 | 25-02 | pending |
| MC-01 | Phase 26 | 26-01 | pending |
| MC-02 | Phase 26 | 26-02 | pending |
| AC-01 | Phase 27 | - | pending |
| AC-02 | Phase 27 | - | pending |
| AC-03 | Phase 27 | - | pending |
| AC-04 | Phase 27 | - | pending |
