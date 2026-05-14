# splunk-knowledge — Plugin Marketplace

## What This Is

A marketplace of Claude Code plugins for Splunk development — custom visualizations, dashboards, SPL queries, and admin tasks. The primary focus right now is **splunk-viz-packs** (v4.1.0): a plugin that generates branded Splunk custom visualization apps from a brand brief. The goal is to make every generated viz pack work on first build AND look like a professional designer made it.

## Core Value

When a user runs `/vp-init`, the resulting viz pack installs in Splunk without errors and produces a dashboard that makes someone say "wait, that's Splunk?" — zero manual fixes, wow-factor by default.

## Requirements

### Validated

- ✓ Plugin architecture with 4 plugins (splunk-viz-packs, splunk-dashboard-studio, splunk-spl, splunk-admin) — existing
- ✓ 6 skills in splunk-viz-packs (vp-init, vp-design, vp-viz, vp-create, vp-debug, vp-recipes) — v4.1.0
- ✓ 54 gotcha rules (F1-F12, B1-B23, R1-R8, I1-I2, C1-C9) — tested across 28 tests
- ✓ Progressive disclosure (<500 lines per SKILL.md, references/) — v4.0.0
- ✓ Executable validation (validate_viz.sh, build_flat.js) — deterministic checks
- ✓ Subagent ban for code generation — 100% failure rate proven in test22a/b
- ✓ B9 type format fix (STOP section at top of vp-viz) — passes since test27
- ✓ Namespaced options (B10) — three-format table in vp-viz

### Active

- [ ] Zero-fix first builds — viz packs work on first install without manual intervention
- [ ] Formatter settings work correctly by default in Dashboard Studio AND ad-hoc search
- [ ] Brand-specific visual identity — no generic/AI-looking dashboards
- [ ] Creative viz selection — no default donuts, bold unexpected choices
- [ ] Light theme parity — works as well as dark, not an afterthought
- [ ] Preview.png and appIcon.png generated automatically and look good
- [ ] Expanded automated validation — catch more bugs before install
- [ ] Harden splunk-dashboard-studio plugin (ds-* skills) — secondary priority
- [ ] Harden splunk-spl and splunk-admin plugins — tertiary priority

### Out of Scope

- PNG export from vizs — SVG only for dashboard imagery
- Real-time streaming vizs — standard Splunk polling is sufficient
- Mobile-responsive viz rendering — Splunk dashboards are desktop/wall-display
- Multi-tenant viz sharing — each pack is a standalone Splunk app

## Context

- **Testing approach:** Manual Splunk tests (build → install → verify visually) + automated validation scripts. Tests 21-28 cover various brands (Patagonia, Nike, Apple, Hospital, Riot Games, Stripe, Cloudflare).
- **Known bug sources:** Bugs come from everywhere — JS code, formatter HTML, Dashboard JSON, conf files. No single dominant source, which means the skill instructions need to be tight at every layer.
- **Design quality gap:** Vizs often look generic/AI-generated. Settings panel doesn't always work correctly by default. Wrong viz types chosen (lazy donuts instead of bold choices).
- **Subagent limitation:** Code generation MUST be inline — subagents lose skill context and produce 100% broken output. Research tasks can use subagents.
- **Existing codebase map:** See `.planning/codebase/` for full architecture, stack, conventions, concerns.

## Constraints

- **ES5 only**: Splunk's RequireJS environment requires pure ES5 in viz source — no const, let, arrow functions, template literals
- **Canvas 2D**: All vizs render via HTML Canvas 2D API — no DOM-based rendering, no D3, no SVG inside vizs
- **AMD modules**: Built vizs must be AMD format (`define([...], function(...) {})`) — flat builder handles this
- **Splunk app structure**: Strict directory layout required (`appserver/static/visualizations/{name}/`)
- **macOS tar**: Must use `COPYFILE_DISABLE=1` to prevent resource fork corruption
- **Plugin language**: All plugin artifacts must be in English (per CLAUDE.md)
- **SKILL.md < 500 lines**: Official best practice for Claude Code skill authoring

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inline code generation (no subagents) | test22a/b proved 100% failure rate with subagents | ✓ Good |
| Progressive disclosure (v4.0.0) | 1300-line skills violated 500-line best practice | ✓ Good |
| B9 STOP section at top of SKILL.md | Only placement that prevents "custom." prefix errors | ✓ Good |
| Flat AMD builder over webpack | Webpack 5 IIFE wrapper breaks Splunk's RequireJS | ✓ Good |
| validate_viz.sh as gatekeeper | Deterministic checks catch what LLM interpretation misses | ✓ Good |
| Renamed skills (vp-couture→vp-design, etc.) | Internal jargon → clear names | — Pending |
| appIcon/preview.png as FAIL not WARN | Agents ignored WARNs, only FAILs block packaging | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after initialization*
