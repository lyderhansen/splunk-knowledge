# Milestones

## v6.0 Speed & Oneshot (Shipped: 2026-05-27)

**Phases completed:** 1 of 3 planned (closed early). Phases 45 (session reduction) and 46 (cv-oneshot) deferred to v6.2+.

**Key accomplishments:**

- **Phase 44 — chunked code emission in cv-create.** Added `/* CV-RENDER-{DARK,LIGHT}-{BEGIN,END} */` sentinels to `boilerplate_emit.js`; rewrote `cv-create/SKILL.md` Step 3 + standalone-mode + iteration-mode for per-viz discrete four-tool-call emission with resume detection, per-viz checkpoint, and ✓/↻/✗ progress glyphs. SKILL.md = 322 lines (under 500 cap). MANDATORY reading prelude preserved.
- **Production validation at scale.** Two real-brand v6.0.8 runs: `tests/test51_cucm/` (Cisco UC + Pexip, 3 dashboards + 6 vizs) and `tests/test52_asus_rog/` (Asus ROG, 7 vizs + 3 dashboards, 1613-line mockup + 3039-line viz source) both shipped with **0 mid-file hangs and 0 final-validation failures**. SC#1 from the v6.0 ROADMAP is met.
- **HANDOFF backlog surfaced.** Both runs produced HANDOFF.md files documenting ~27 corrections, ~6 new validator checks, and ~5 working patterns — now harvested in v6.1.

**Plugin versions at close:** splunk-custom-viz v6.0.8 · splunk-viz-packs v5.10.1 (legacy) · splunk-dashboard-studio v3.5.0 · splunk-spl v1.2.0

**Deferred to v6.2+:**
- Phase 45 — splunk-custom-viz session reduction (fewer turns end-to-end)
- Phase 46 — cv-oneshot skill (zero-ceremony Dashboard Studio from dummy SPL)

---

## v5.4.0 Runtime Robustness & Visual Polish (Shipped: 2026-05-19)

**Phases completed:** 3 phases, 5 plans, 9 tasks

**Key accomplishments:**

- Three false-positive/false-negative bugs fixed in validate_dash.js and check_design.js — DS4 now accepts Dashboard Studio spec-correct item property, DS5 distinguishes missing default (FAIL) from non-wildcard default (WARN DS5w), D11 scans from method definition not first comment mention
- One-liner:
- Added mandatory animation JS branching requirements to vp-viz SKILL.md CRITICAL SUBSET and "NOT decorative" enforcement paragraph to viz-blueprints.md, closing the gap where animation controls were documented but not enforced.

---

## v5.3.0 Production Polish & Interactive Dashboards (Shipped: 2026-05-19)

**Phases completed:** 3 phases, 7 plans, 8 tasks

**Key accomplishments:**

- canvas-recipes.md halved from 998 to 498 lines by removing duplicates of split recipe files and condensing verbose sections, with cross-references replacing all removed content
- One-liner:
- 1. [Rule 1 - Bug] Existing test fixtures lacked bg_gradient/markdown
- dashboard-json-template.md
- DS5 check added to validate_dash.js: pure ES5 two-pass loop that catches missing defaults.tokens.default entries for any setToken eventHandler, with 3 test scenarios (8 assertions) all passing at 74/74
- Series color pickers (5 slots + overflow + fieldColorMap) replace accentColor in formatter; _onClick drilldown template added to viz-blueprints.md; supports_drilldown/trellis flags added to conf-templates.md

---

## v4.1.0 splunk-viz-packs Hardening (Shipped: 2026-05-15)

**Phases:** 5 | **Plans:** 15 | **Tests:** 195 automated
**Production code:** 1,906 LOC (JS + bash) | **Test code:** 2,260 LOC
**Known deferred items at close:** 4 (verification status — see STATE.md Deferred Items)

**Key accomplishments:**

1. **AST + DOM + Schema validation** — Replaced grep-based checks with acorn ES5 AST parsing, cheerio HTML DOM analysis, and ajv JSON schema validation. Cross-file formatter-to-JS consistency checks catch namespace mismatches.
2. **Automated repair loop** — validate_viz.sh --repair flag auto-fixes B10/B9/B5/B7/B20 violations (fix → rebuild → revalidate, up to 3 attempts). Closes 90%+ of first-install failures.
3. **WCAG AA contrast enforcement** — check_contrast.js verifies theme.js text-on-background pairs against 4.5:1 ratio. Catches the "light theme contrast too low" problem at build time.
4. **Pure JS PNG asset generator** — generate_assets.js creates brand-colored appIcon.png (36x36) and viz-type preview.png (300x200) silhouettes with zero external deps.
5. **Visual Language schema** — Structured brand differentiation system (cornerRadius, fillTechnique, spacing, shadowDepth) + weighted novelty scoring to prevent lazy viz defaults.
6. **Rule consolidation** — 54 rules compressed to 15 quick-rules. all-patterns.md 911→185 lines. broken-rules.md 751→128 lines. FISR regression verified.

**Future improvements noted:**

- Dashboard drilldown not working end-to-end (ds-* plugin scope)
- Dashboard JSON missing `"title"` field (ds-create template issue)

---
