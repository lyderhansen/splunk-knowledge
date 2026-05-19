# Milestones

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
