# splunk-knowledge — Plugin Marketplace

## What This Is

A marketplace of Claude Code plugins for Splunk development — custom visualizations, dashboards, SPL queries, and admin tasks. The primary focus is **splunk-viz-packs** (v5.6.0): a plugin that generates branded Splunk custom visualization apps from a brand brief. v4.1.0 shipped validation/repair. v5.0.0 added design awesomeness. v5.1.0 hardened vizs and dashboard composition. v5.2.0 added smart fields and domain identity. v5.3.0 polished code quality and added interactive dashboard features. v5.4.0 fixed runtime bugs and visual polish. v5.5.0 added wow-factor — branded backgrounds, animation boilerplates, multi-channel vizs, official API correctness, and XSS prevention. v5.6.0 added dual-format architecture — Extension API (config.json + ESM) alongside Classic (formatter.html + AMD), aesthetic scoring, and a validated test build.

## Core Value

When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

## Requirements

### Validated

- ✓ Plugin architecture with 4 plugins (splunk-viz-packs, splunk-dashboard-studio, splunk-spl, splunk-admin) — existing
- ✓ 6 skills in splunk-viz-packs (vp-init, vp-design, vp-viz, vp-create, vp-debug, vp-recipes) — v4.1.0
- ✓ Progressive disclosure (<500 lines per SKILL.md, references/) — v4.0.0
- ✓ Executable validation (validate_viz.sh, build_flat.js) — deterministic checks
- ✓ Subagent ban for code generation — 100% failure rate proven in test22a/b
- ✓ B9 type format fix (STOP section at top of vp-viz) — passes since test27
- ✓ Namespaced options (B10) — three-format table in vp-viz
- ✓ AST/DOM/schema validation (acorn + cheerio + ajv) — v4.1.0 Phase 1-2
- ✓ Automated repair loop (--repair flag, B10/B9/B5/B7/B20 auto-fix) — v4.1.0 Phase 3
- ✓ WCAG AA contrast enforcement (check_contrast.js, 4.5:1 ratio) — v4.1.0 Phase 3
- ✓ Pure JS PNG asset generation (appIcon + preview silhouettes) — v4.1.0 Phase 4
- ✓ Visual Language schema + novelty scoring — v4.1.0 Phase 4
- ✓ Mandatory viz interactivity (sort, hover, drilldown) — v4.1.0 Phase 4
- ✓ Rule consolidation (54→15 quick-rules, all-patterns 911→185 lines) — v4.1.0 Phase 5
- ✓ Expanded automated validation (195 tests across 6 test suites) — v4.1.0

### Active

- [ ] Design principles engine — codified Canvas 2D design rules from top design skills
- [ ] Design quality gate — automated scorer for aesthetics (shadows, color, typography, spacing)
- [ ] Premium rendering recipes — gradients, glow, shadow layering, responsive text, animations
- [ ] Enhanced vp-viz generation — DataDrivers-quality code from the start
- [ ] Intelligent viz configuration — context-aware formatter options with smart defaults per viz type
- [ ] Theme parity — dark and light themes that both look intentional
- [ ] Cross-viz consistency — shared spacing grid, hover contract, typography scale
- [ ] Edge case resilience — graceful degradation for empty/null/overflow data
- [ ] First-build success hardening — push FISR toward 100%

### Deferred

- [ ] Harden splunk-dashboard-studio plugin (ds-* skills)
- [ ] Harden splunk-spl and splunk-admin plugins

### Out of Scope

- PNG export from vizs — SVG only for dashboard imagery
- Real-time streaming vizs — standard Splunk polling is sufficient
- Mobile-responsive viz rendering — Splunk dashboards are desktop/wall-display
- Multi-tenant viz sharing — each pack is a standalone Splunk app

## Current State: v5.6.0 shipped

**Shipped:** 2026-05-22 — 6 phases, 12 plans, 18 requirements satisfied.

**What v5.6.0 delivered:**
- Dual-format architecture: vp-init asks Classic vs Extension, all downstream skills branch on choice
- Extension API templates: config.json (optionsSchema/editorConfig), visualization.js (ESM + Canvas 2D + listeners)
- Format-aware validation: E01-E05 checks in validate_viz.sh for Extension API vizs
- Aesthetic scorer: score_design.js (0-100 across 5 dimensions), optional --score flag
- Validated test build: 3-viz .spl file produced end-to-end, framework_type=studio_visualization confirmed

**Next milestone:** Not yet defined. Run `/gsd-new-milestone` to start planning.

<details>
<summary>v5.5.0 Visual Wow-Factor & First-Build Perfection (shipped 2026-05-21)</summary>

Branded backgrounds, color pickers, multi-channel vizs, animation boilerplates, official API correctness, XSS prevention.

</details>

<details>
<summary>v5.4.0 Runtime Robustness & Visual Polish (shipped 2026-05-19)</summary>

**Goal:** Generated viz packs work correctly out of the box and look premium in both themes.

**Delivered:** DS4 item.item fix, D11 lastIndexOf fix, DS5w non-wildcard WARN. Removed Data configurations formatter section (DataDrivers pattern — formatData() field indexing + search_fragment). Mandatory drilldown on all vizs. seriesColors/seriesColorsByField for built-in panels. D01 conditional FAIL for gradient enforcement. Animation enforcement checklist. Light theme contrast checklist.

</details>

<details>
<summary>v5.3.0 Production Polish & Interactive Dashboards (shipped 2026-05-19)</summary>

**Goal:** Trim bloated reference files, fix generated code quality issues, add interactive dashboard features.

**Delivered:** canvas-recipes.md halved (998→498), DS2-DS5 dashboard validators (tab schema, background, title, token defaults), dashboard-interactivity.md reference (drilldown flows, input controls, defaults block wiring), series color pickers replacing accentColor, _onClick drilldown template, supports_drilldown/trellis conf flags.

</details>

<details>
<summary>v5.2.0 Smart Vizs & Domain Identity (shipped 2026-05-18)</summary>

**Goal:** Auto-field discovery, domain-specific viz types, accent separation, mandatory dashboard.

**Delivered:** auto-field-patterns.md, domain visual language step 3b, 9 domain-unique viz entries, mandatory Step 3c, @viz-type annotation, pipeline fixes (disable-model-invocation), WebSearch for brand research.

</details>

<details>
<summary>v5.1.0 Viz Hardening & Dashboard Wow-Factor (shipped 2026-05-18)</summary>

**Goal:** Fix bugs from test29, fill settings gaps, creative freedom, dashboard composition.

**Delivered:** getOption two-path fix, entrance-off guard, flashCritical 8-24px, ECR-06/07, missing settings, creative latitude, dashboard-composition.md (599 lines), gradient PNG generator.

</details>

<details>
<summary>v5.0.0 Design Awesomeness (shipped 2026-05-16)</summary>

**Goal:** Make every generated viz pack look like it was designed by a professional design studio — depth, glow, premium typography, intelligent configuration, and bulletproof code.

**Target features:**
- Design principles engine (codified from ui-ux-pro-max, impeccable, design-taste-frontend, gpt-taste, minimalist-ui)
- Design quality gate (automated aesthetic scoring)
- Premium Canvas 2D rendering recipes (gradients, glow, shadow layering, responsive text, animations)
- Enhanced vp-viz generation (DataDrivers F1 app quality bar)
- Intelligent viz configuration (context-aware formatter options per viz type)
- Theme parity (intentional dark + light, not just inverted)
- Cross-viz consistency (spacing grid, hover contract, typography scale)
- Edge case resilience (empty/null/overflow graceful degradation)
- First-build success hardening (toward 100% FISR)

</details>

## Context

- **Reference bar:** DataDrivers F1 app — LED glow effects, trail opacity fading, responsive pagination, neon accents, custom fonts, every viz fully configurable via formatter options
- **Testing approach:** 195 automated tests (AST, repair, contrast, dashboard, assets, integration) + manual Splunk tests. Tests 21-28 cover brands (Patagonia, Nike, Apple, Hospital, Riot Games, Stripe, Cloudflare).
- **Validation pipeline:** validate_viz.sh orchestrates acorn AST (ES5), cheerio DOM (HTML), ajv schema (JSON), cross-file consistency, WCAG contrast, and asset quality checks. --repair flag auto-fixes B10/B9/B5/B7/B20.
- **Design quality:** Visual Language schema enforces brand-specific rendering. Novelty scoring prevents lazy viz defaults. Interactivity mandates ensure sort/hover/drilldown.
- **Subagent limitation:** Code generation MUST be inline — subagents lose skill context and produce 100% broken output.
- **Rule budget:** 15 quick-rules in vp-viz SKILL.md (down from 54). all-patterns.md is 185-line index pointing to canvas-recipes.md and formatter-patterns.md.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inline code generation (no subagents) | test22a/b proved 100% failure rate with subagents | ✓ Good |
| Progressive disclosure (v4.0.0) | 1300-line skills violated 500-line best practice | ✓ Good |
| B9 STOP section at top of SKILL.md | Only placement that prevents "custom." prefix errors | ✓ Good |
| Flat AMD builder over webpack | Webpack 5 IIFE wrapper breaks Splunk's RequireJS | ✓ Good |
| validate_viz.sh as gatekeeper | Deterministic checks catch what LLM interpretation misses | ✓ Good |
| Acorn AST over grep for ES5 checks | Line numbers, specific violations, no false positives | ✓ Good |
| Cheerio DOM over regex for HTML | Proper parsing catches structural issues grep misses | ✓ Good |
| Pure JS PNG encoder over Pillow | Zero deps, always works when Node.js available | ✓ Good |
| Single-source + cross-refs for rules | Prevents rule drift between 3+ copies of same rule | ✓ Good |
| Repair loop with early-break | Stops when no fixable violations remain (CR-02 fix) | ✓ Good |
| Categorical visual language values | Translate directly to Canvas code (sharp→radius=0) | ✓ Good |
| Soft novelty scoring (warn not block) | Allows legitimate simple packs while nudging creativity | ✓ Good |

## Constraints

- **ES5 only**: Splunk's RequireJS environment requires pure ES5 in viz source
- **Canvas 2D**: All vizs render via HTML Canvas 2D API
- **AMD modules**: Built vizs must be AMD format
- **Splunk app structure**: Strict directory layout required
- **macOS tar**: Must use `COPYFILE_DISABLE=1`
- **Zero user deps**: All tooling runs inside Claude Code during builds
- **Plugin language**: All plugin artifacts must be in English
- **SKILL.md < 500 lines**: Official best practice

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-05-20 after v5.5.0 milestone start*
