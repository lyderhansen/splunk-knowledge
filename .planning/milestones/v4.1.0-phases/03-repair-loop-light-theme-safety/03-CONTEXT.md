# Phase 3: Repair Loop & Light Theme Safety - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated validate-fix-rebuild cycle for common validation failures, plus WCAG AA contrast enforcement on theme.js color tokens. When validate_viz.sh finds a fixable issue, it auto-repairs the source files, rebuilds AMD bundles via build_flat.js, and re-validates — up to 3 attempts before failing. Separately, a contrast checker verifies that theme.js text tokens meet WCAG AA 4.5:1 ratio against their background tokens for both dark and light themes.

</domain>

<decisions>
## Implementation Decisions

### Repair Loop Scope
- **D-01:** Auto-fix ALL mechanically fixable codes: B10 (bare option keys in dashboard JSON), B9 (wrong viz type prefix), B5 (missing type="custom" on splunk-color-picker), B7 (default= vs value= on formatter controls), B20 (themeMode default should be "auto"). These all have exactly one correct fix derivable from context.
- **D-02:** DS1 (undeclared data source) and XFILE (orphaned/missing options) are REPORT ONLY — these require judgment about correct fix. The repair log includes enough context for the user or Claude to fix manually.
- **D-03:** F-series ES5 violations are NOT auto-fixed — rewriting JS syntax is too risky. Report only.

### Fix Strategy
- **D-04:** Dashboard JSON fixes (B10, B9) use JSON.parse → modify object → JSON.stringify (re-serialize the CDATA content). B10 fix: prefix bare keys with `vizType.`. B9 fix: strip `custom.` prefix from viz type.
- **D-05:** Formatter HTML fixes (B5, B7, B20) use cheerio (already vendored) to find and patch attributes in-place. Same tool that validates also repairs.
- **D-06:** A new `repair_findings.js` Node script reads validate_findings.ndjson and applies fixes to the source files. Pure ES5 CJS, follows existing script conventions.

### Orchestration
- **D-07:** validate_viz.sh gets a `--repair` flag. On failure with fixable findings, it calls repair_findings.js to patch files, then calls build_flat.js to rebuild AMD bundles, then re-runs validation. Up to 3 attempts. This keeps the single entry point pattern from Phase 1.
- **D-08:** Full cycle per attempt: fix source files → rebuild AMD bundles via build_flat.js → re-validate everything. The packaged output must reflect the fixes.
- **D-09:** The repair loop produces a structured log showing each attempt: what failed, what was fixed, whether re-validation passed. Format is Claude's discretion but must be machine-parseable.

### WCAG Contrast Checker
- **D-10:** A new `check_contrast.js` script reads theme.js, extracts DARK and LIGHT token objects, and checks text-on-background pairs against WCAG AA 4.5:1 minimum contrast ratio.
- **D-11:** Pairs to check: text/bg, text/panel, text/panelHi, textDim/bg, textDim/panel, textDim/panelHi, textFaint/bg (informational). Both DARK and LIGHT objects checked.
- **D-12:** Output format: FAIL/WARN lines on stdout (matching existing format) + FINDING: NDJSON on stderr. Report failing pairs with exact hex values and computed contrast ratio.
- **D-13:** Contrast checker is report-only (no auto-fix) — adjusting colors requires design judgment. But the report gives specific hex values and ratios so Claude or the user knows exactly what to adjust.

### Claude's Discretion
- Internal repair_findings.js structure and how it dispatches per-code fixes
- How to extract and re-inject CDATA content in dashboard XML after JSON modification
- check_contrast.js implementation (relative luminance calculation, pair selection)
- Repair log format (JSON, NDJSON, markdown — as long as it's structured and machine-parseable)
- Whether check_contrast.js is integrated into validate_viz.sh or called separately

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Deliverables (foundation for Phase 3)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — Phase 2 enhanced pipeline, the file getting --repair flag
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js` — Phase 2 dashboard JSON validator (B9/B10/DS1)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js` — Phase 2 AST/DOM validator with --cross mode (XFILE)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/build_flat.js` — Flat AMD builder (called during rebuild step)
- `.planning/phases/02-schema-cross-file-validation/02-01-SUMMARY.md` — validate_dash.js capabilities
- `.planning/phases/02-schema-cross-file-validation/02-02-SUMMARY.md` — validate_ast.js --cross capabilities
- `.planning/phases/02-schema-cross-file-validation/02-03-SUMMARY.md` — validate_viz.sh integration wiring

### Theme Token Structure (WCAG checker targets)
- `tests/test28_drilldown_tabs/cloudflare_noc/shared/theme.js` — reference theme.js with DARK/LIGHT token objects
- `tests/test25_v4/hospital_nps_gauge/shared/theme.js` — another theme.js sample for cross-validation
- `tests/test27_table/stripe_payment_ops_viz/shared/theme.js` — third theme.js sample

### Vendored Dependencies
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/cheerio/` — HTML DOM manipulation (for B5/B7/B20 fixes)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/ajv/` — JSON schema validation
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/acorn/` — JS AST parsing

### Skill Rules (define what gets fixed)
- `plugins/splunk-viz-packs/skills/vp-ref-gotchas/SKILL.md` — all 54 FAIL/WARN rules with descriptions
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — B9 STOP section, B10 namespace rules

### Requirements
- `.planning/REQUIREMENTS.md` — VAL-04, VAL-06, DES-01 requirements for this phase
- `.planning/ROADMAP.md` — Phase 3 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validate_findings.ndjson`: Machine-parseable FINDING lines from Phase 2 — this is the input to repair_findings.js. Each line is `FINDING:{json}` with type, code, file, vizId, message, context fields.
- `validate_dash.js extractFromXml()`: Already extracts JSON from dashboard XML CDATA — repair needs the inverse (re-inject modified JSON back into CDATA).
- `validate_ast.js runHtmlChecks()`: cheerio DOM parsing of formatter.html — same tool can be used for HTML fixes.
- `build_flat.js`: Already called during packaging — repair loop calls it between fix and re-validate.

### Established Patterns
- FAIL/WARN output format: `  FAIL {CODE}: {message}` — repair log should follow same format
- FINDING: NDJSON on stderr — repair_findings.js consumes these, check_contrast.js produces them
- Exit code convention: 0=clean, 1=violations, 2=usage error
- vendor/ dependency bundling: no new deps needed — cheerio handles HTML, JSON.parse handles JSON
- validate_viz.sh capability detection: `HAS_NODE`, `USE_AST`, `HAS_DASH` pattern for graceful fallback

### Integration Points
- validate_viz.sh `--repair` flag: after all checks complete and TOTAL_FAIL > 0, if --repair is set, enter repair loop
- FINDINGS_FILE path: already set up in validate_viz.sh (`$(dirname "$APP_DIR")/validate_findings.ndjson`)
- build_flat.js invocation: `node build_flat.js "$APP_DIR"` — already called by vp-create

### Theme Token Contract
- DARK/LIGHT objects have identical key structure: bg, panel, panelHi, edge, edgeStrong, grid, text, textDim, textFaint, s1-s5, accent, success, warn, danger, invert
- All color values are hex (#RRGGBB) or rgba() strings — contrast checker must handle both
- detectTheme() in viz source switches between DARK/LIGHT at render time

</code_context>

<specifics>
## Specific Ideas

- B10 is 90%+ of all findings (167 of ~170 in test28) — this is the highest-value auto-fix
- The repair loop enables the "zero-fix first build" core value — if Claude generates a viz pack with namespace issues, the build pipeline fixes them automatically
- WCAG contrast checker addresses the memory note about "light theme contrast too low" and "hero values MUST use full t.text" — these become enforceable rules, not just memory
- Repair loop + contrast checker together close the gap between "builds without error" and "looks correct in both themes"

</specifics>

<deferred>
## Deferred Ideas

- Auto-fix for DS1 (undeclared data source) and XFILE (orphaned options) — requires understanding user intent
- Auto-fix for F-series ES5 violations — JS syntax rewriting is too risky for automated repair
- Contrast-based auto-color-adjustment (lighten/darken tokens to meet WCAG) — requires design judgment
- Phase 1 code review blockers (missing ES6+ AST node types) — fix when they cause a real problem

</deferred>

---

*Phase: 3-Repair Loop & Light Theme Safety*
*Context gathered: 2026-05-15*
