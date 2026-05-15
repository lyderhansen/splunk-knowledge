# splunk-knowledge — Plugin Marketplace

## What This Is

A marketplace of Claude Code plugins for Splunk development — custom visualizations, dashboards, SPL queries, and admin tasks. The primary focus is **splunk-viz-packs** (v4.1.0): a plugin that generates branded Splunk custom visualization apps from a brand brief. v4.1.0 hardening milestone shipped — the plugin now has AST/DOM/schema validation, automated repair, WCAG contrast enforcement, pure JS asset generation, and consolidated rules.

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

- [ ] Dashboard drilldown working end-to-end in generated dashboards
- [ ] Dashboard JSON `"title"` field populated in generated output
- [ ] Harden splunk-dashboard-studio plugin (ds-* skills)
- [ ] Harden splunk-spl and splunk-admin plugins
- [ ] Full LLM rebuild regression test (build from scratch with consolidated skills)

### Out of Scope

- PNG export from vizs — SVG only for dashboard imagery
- Real-time streaming vizs — standard Splunk polling is sufficient
- Mobile-responsive viz rendering — Splunk dashboards are desktop/wall-display
- Multi-tenant viz sharing — each pack is a standalone Splunk app

## Context

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
*Last updated: 2026-05-15 after v4.1.0 milestone*
