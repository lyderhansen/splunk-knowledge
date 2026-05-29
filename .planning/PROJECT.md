# splunk-knowledge — Plugin Marketplace

## What This Is

A marketplace of Claude Code plugins for Splunk development — custom visualizations, dashboards, SPL queries, and admin tasks. Two primary plugins now: **splunk-viz-packs** (v5.10.1, legacy multi-viz / validator-driven) and **splunk-custom-viz** (v6.0.7, HTML-first / 4-skill, currently the active one for new projects per marketplace.json). v4.1.0-v5.8.0 built and hardened splunk-viz-packs (validation, design quality gate, Extension API dual-format, live Red Bull verification). The cv6 rewrite landed mid-2026-05 as splunk-custom-viz with an HTML-first mockup contract. v6.0 turns to hardening + speed: cv6 must finish a full session in fewer turns without hanging mid-code-write, and a new oneshot-dashboard path produces a working Dashboard Studio dashboard from dummy data with zero design ceremony.

## Core Value

When a user runs `/cv-scope` (cv6) or `/cv-oneshot` (v6.0), they get an installable Splunk artifact fast — no hangs, no design ceremony when speed is the priority, designer-grade output when it's not. `splunk-viz-packs` retains its zero-fix / wow-factor guarantee for multi-viz brand packs.

## Requirements

### Validated

- ✓ Plugin architecture (splunk-viz-packs, splunk-custom-viz, splunk-dashboard-studio, splunk-spl, splunk-admin) — existing
- ✓ splunk-viz-packs: 6 skills, progressive disclosure (<500 lines/SKILL.md), validate_viz.sh + build_flat.js, AST/DOM/schema validation, repair loop, WCAG contrast, asset generation, visual language schema, rule consolidation, 195 tests — v4.1.0–v5.8.0
- ✓ splunk-viz-packs: design principles, design quality gate (D01-D11), premium recipes, intelligent formatter config, theme parity, cross-viz consistency, edge-case resilience — v5.0.0–v5.5.0
- ✓ splunk-viz-packs: dual-format (Classic .tar.gz + Extension API .spl), aesthetic scoring (score_design.js), JSONata reference, animation scope rule, Pillow per-viz preview pipeline, THM-05 light-mode backgroundColor — v5.6.0–v5.8.0
- ✓ splunk-viz-packs: end-to-end live Splunk verification (Red Bull Classic + Extension API) — v5.7.0
- ✓ splunk-custom-viz: 4 skills (cv-scope → cv-sketch → cv-create → cv-build), HTML-first mockup workflow, DESIGN-LOCK.md contract, dual-format output — v6.0.0–v6.0.7
- ✓ splunk-custom-viz: composite preview layouts, variant dispatch, series colors, mandated @preview-layout — v6.0.6–v6.0.7
- ✓ splunk-custom-viz: chunked per-viz emission in cv-create (sentinel-anchored four-tool-call sequence, resume detection, per-viz checkpoint, ✓/↻/✗ progress glyphs) — v6.0.8 (Phase 44, validated at scale in test51_cucm + test52_asus_rog)

### Active (v6.1)

- [ ] Validator hardening — K1b (picker value reaches Canvas call), K3 (declared font embedded as @font-face), K4 (cross-app viz type consistency), and the wired-to-render contract for text-inputs (test51 Correction #15)
- [ ] Font embedding pipeline in cv-create — `theme.js.FONTS` declarations must produce real `@font-face` blocks in each viz's `visualization.css` (test52 Correction #26)
- [ ] Cross-app merge ergonomics — viz pack → parent app namespace rewrite as a single `cv-build --merge-into <parent_app>` flag (or new `cv-merge` skill); kills test52 Correction #24 foot-gun
- [ ] cv-sketch Stage D Slop Test additions — SVG arc geometry (test52 #22), small-markdown-on-shape badges (test51 G2)
- [ ] splunk-spl reference debt — `relative_time(now(), "0")` All-time trap, `multisearch` + `inputlookup` incompatibility, `stats round(avg(...))` invalid syntax, wide→tall `makemv + mvexpand + case` recipe
- [ ] splunk-dashboard-studio reference debt — `fillergauge` 100px min height, `splunk.area.stackMode` enum, cache invalidation 3-step refresh checklist, small-markdown-overlay anti-pattern
- [ ] Working patterns codified — bottom-up multi-row layout (canvas-port-rules.md Rule 9), `_render<X>(..., isLight)` shared helper pattern, three-dashboard multi-audience matrix, anti-references-into-DESIGN-LOCK persistence

### Deferred

- [ ] Phase 45 — splunk-custom-viz session reduction (fewer turns end-to-end) — moved from v6.0
- [ ] Phase 46 — cv-oneshot skill (zero-ceremony Dashboard Studio from dummy SPL) — moved from v6.0
- [ ] Harden splunk-dashboard-studio plugin beyond reference-debt items (full ds-* skill audit)
- [ ] Harden splunk-spl and splunk-admin plugins beyond reference-debt items
- [ ] Decide splunk-viz-packs vs splunk-custom-viz long-term (adopt / cherry-pick / coexist) — pending breadth parity evidence
- [ ] Original 2026-05-23 v6.0 draft (Mood × Aesthetic Flavor collapse, AST strategy) — shelved, may revisit post-v6.x

### Out of Scope (v6.1)

- New viz types or new cv-* skills not directly tied to the HANDOFFs
- Any rework of phase 44's chunked emission contract (validated, leave alone)
- Cross-dashboard `linkToDashboard` drilldown handler completion in test52_asus_rog/ — that's a tarball v1.1 patch, not a skill-level fix
- Any redesign of splunk-viz-packs (v5.10.1 stays as legacy)

## Current Milestone: v6.1 HANDOFF Harvest

**Goal:** Harvest the proven-in-production lessons from two real-brand v6.0.8 builds (Cisco UC and Asus ROG) into skills, references, and validators so the next pack does not repeat the same caught mistakes.

**Target features:**
- Validator hardening — K1b, K3, K4 + text-input wired-to-render contract
- Font embedding pipeline so brand fonts actually land in the Splunk iframe
- Cross-app merge ergonomics (cv-build `--merge-into` or new cv-merge skill)
- cv-sketch Slop Test additions (SVG arc geometry, small-markdown-on-shape)
- SPL reference debt (4 new traps + 1 reshape recipe)
- Dashboard Studio reference debt (fillergauge min height, area stackMode enum, cache invalidation, markdown-overlay anti-pattern)
- Working patterns codified (Rule 9 bottom-up layout, shared `_render<X>` helper, three-dashboard matrix, anti-refs persistence)

**Key context:**
- Source inputs already in repo: `tests/test51_cucm/HANDOFF.md` + `tests/test52_asus_rog/HANDOFF.md` — both gitignored but readable
- Phase 44 (chunked emission) is shipped and validated — v6.1 builds on top, not in parallel
- Cross-plugin scope: splunk-custom-viz + splunk-spl + splunk-dashboard-studio (no splunk-admin or splunk-viz-packs work)
- Plugin language: English only per CLAUDE.md

## Previous Milestone: v6.0 shipped

**Shipped:** 2026-05-27 — 1 of 3 planned phases (closed early). **splunk-custom-viz at v6.0.8.** Phase 44 (chunked code emission in cv-create) shipped and validated at scale in two real-brand runs (test51_cucm + test52_asus_rog) — 0 mid-file hangs across 1613-line mockup and 3039-line viz source. Phases 45 (session reduction) and 46 (cv-oneshot) deferred to v6.2+ because the test runs surfaced a HANDOFF backlog that needed harvesting first.

## Earlier Milestone: v5.8.0 shipped

**Shipped:** 2026-05-25 — 6 phases, 20 plans, 14 requirements satisfied. **splunk-viz-packs at v5.10.1; splunk-dashboard-studio at v3.5.0; splunk-custom-viz at v6.0.7.**

**What v5.8.0 delivered:**
- JSONata reference (`ds-ref-jsonata`) for Dashboard Studio eval/conditions expressions; ds-int-tokens MUST-LOAD wired
- Extension API templates corrected: IIFE format, bundled extension package, bare stanza names
- Animation Helper Scope Rule (AF-01/AF-02) — `opt()` only inside `updateView`; helpers receive computed values as parameters
- Pillow per-viz preview pipeline (`generate_previews.py`, Inter Regular bundled, 116×76 RGB) with `--legacy-previews` fallback
- THM-05 light-mode `backgroundColor` fix across all 4 template files
- Deep Review milestone audit: 95 files reviewed, 19 BLOCKERs + 30 WARNINGs all fixed inline, plugin.json descriptions trimmed to match validator reality

**Post-v5.8.0 quick task:** cv6-skill-corrections (2026-05-25) — applied 4 handover findings, fixed Patrol Coverage stack overflow, restored per-type preview.png silhouettes, added KNOWN-CORRECTIONS.md + 3 validator grep checks.

<details>
<summary>v5.7.0 Real Brand End-to-End Validation (shipped 2026-05-22)</summary>

DS skill updates (linkToDashboard tokens, JSONata expressions, containerOptions.visibility, three-handler chain recipe). Red Bull Classic test build (5 vizs, 140 KB .tar.gz, ALL CHECKS PASSED). Red Bull Extension API test build (3 vizs, 10.8 KB .spl, rendering live). Critical live findings drove all v5.8.0 fixes.

</details>

<details>
<summary>v5.6.0 DS Extension API & Dual-Format Architecture (shipped 2026-05-22)</summary>

Dual-format architecture, Extension API templates, format-aware validation (E01-E05), aesthetic scoring, validated test build.

</details>

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
*Last updated: 2026-05-27 — v6.0 closed (Phase 44 shipped, 45/46 deferred); v6.1 HANDOFF Harvest milestone started*
