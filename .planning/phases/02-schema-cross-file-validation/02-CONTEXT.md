# Phase 2: Schema & Cross-file Validation - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Dashboard JSON schema validation and cross-file formatter-to-JS consistency checks to the validation pipeline. Dashboard JSON is validated against a minimal targeted ajv schema (B9 type format, B10 bare option keys, missing data source references). Cross-file validation parses both formatter.html option names and JS config key reads, then verifies 1:1 correspondence. All output is structured (machine-parseable) for the Phase 3 repair loop.

</domain>

<decisions>
## Implementation Decisions

### Schema Approach
- **D-01:** Minimal targeted schema — only validate the parts of Dashboard Studio JSON that cause bugs (B9 type format, B10 bare option keys, missing data source references). Do NOT attempt a full Dashboard Studio JSON Schema. Fewer false positives, focused on real failure modes.
- **D-02:** Schema is reverse-engineered from existing test outputs (tests 15-28 dashboard XML/JSON files) plus Splunk Cloud 10.4 docs (`docs/SplunkCloud-10.4.2604-DashStudio.txt`). Plenty of samples already exist — no additional user input needed.
- **D-03:** ajv is bundled in vendor/ following the same pattern as acorn/cheerio from Phase 1 (D-08). No npm at runtime.

### Cross-file Validation
- **D-04:** Full option name matching — parse every option name from formatter.html AND every config key read from JS, then verify 1:1 correspondence. Flag orphaned options (in formatter but not read in JS) and missing reads (read in JS but not declared in formatter). This is the thorough approach.
- **D-05:** Cross-file validation runs as a new mode in validate_ast.js (e.g., `--cross <formatter> <js>`) or as a separate script, following the same integration pattern as Phase 1 (called from validate_viz.sh).

### Structured Output
- **D-06:** Validation output must be structured and machine-parseable so Phase 3's repair loop can consume it. The exact format (JSON per finding, one-finding-per-line with fields, etc.) is Claude's discretion — but it must be parseable, not just human-readable text.
- **D-07:** The existing FAIL/WARN text format for human consumption is preserved alongside structured output. Both formats emitted.

### Code Review Fixes
- **D-08:** Defer the 5 code review blockers from Phase 1 (missing ES6+ AST node types like SpreadElement/RestElement, grep fallback edge cases). These detect rare patterns that Claude doesn't typically generate. Fix when they cause a real problem, not preemptively. Phase 2 stays focused on schema and cross-file validation.

### Claude's Discretion
- Internal ajv schema structure and validation rules
- Whether cross-file check is a new validate_ast.js mode or a separate script
- Structured output format (JSON, NDJSON, tagged lines, etc.)
- How to extract Dashboard JSON from the XML envelope for validation
- How to handle dynamically-constructed config key reads in JS

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Deliverables (foundation for Phase 2)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js` — Phase 1 AST/DOM validator (acorn + cheerio). Phase 2 extends this or adds alongside it.
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — Phase 1 enhanced pipeline. Phase 2 wires new checks here.
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/` — Bundled acorn 8.16.0 + cheerio 1.2.0. Phase 2 adds ajv here.
- `.planning/phases/01-baseline-core-validators/01-01-SUMMARY.md` — What validate_ast.js delivers
- `.planning/phases/01-baseline-core-validators/01-02-SUMMARY.md` — How validate_viz.sh integration works
- `.planning/phases/01-baseline-core-validators/01-REVIEW.md` — Code review findings (5 blockers, 5 warnings)

### Dashboard Studio Docs & Samples
- `docs/SplunkCloud-10.4.2604-DashStudio.txt` — Splunk Cloud 10.4 Dashboard Studio reference (24K lines)
- `tests/test28_drilldown_tabs/cloudflare_noc/default/data/ui/views/` — cleanest dashboard XML samples
- `tests/test27_table/stripe_payment_ops_viz/default/data/ui/views/` — multi-view dashboard samples
- `.splunk-dashboards/data-center-pulse/dashboard.json` — workspace JSON sample

### Skill Rules (define what schema validates)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — B9 STOP section, B10 namespace rules
- `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` — all 54 FAIL/WARN rules

### Requirements
- `.planning/REQUIREMENTS.md` — VAL-03, VAL-05 requirements for this phase
- `.planning/ROADMAP.md` — Phase 2 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validate_ast.js`: Phase 1 validator with acorn + cheerio. Cross-file check could extend this or follow same patterns.
- `validate_viz.sh` lines 174-193: Current grep-based B9/B10 dashboard checks. These are the checks being replaced with schema validation.
- `build_flat.js`: CJS module patterns — any new Node.js tool should follow the same conventions (shebang, var declarations, require from vendor/).

### Established Patterns
- FAIL/WARN output format: `  FAIL {CODE}: {message}` — new structured output must coexist with this
- vendor/ dependency bundling: npm install to vendor/, add gitignore negation, require from relative path
- validate_viz.sh integration: capability detection (check for node + vendor), call node helper, capture output, set FAIL flag
- Exit code convention: 0 = clean, 1 = violations, 2 = usage error

### Integration Points
- validate_viz.sh formatter loop (lines 30-75): Where cross-file check would be triggered (has access to both formatter and JS paths)
- validate_viz.sh dashboard/XML loop (lines 174-193): Where schema validation replaces grep checks
- Phase 3 repair loop: Must be able to parse Phase 2's structured output to know what to fix

</code_context>

<specifics>
## Specific Ideas

- Full option name matching chosen over namespace-prefix-only because it catches orphaned/missing options — the thorough approach
- Schema is minimal and targeted because a full Dashboard Studio schema would generate false positives and require ongoing maintenance for Splunk version changes
- Existing test session dashboard files provide sufficient samples for reverse-engineering — no additional user samples needed

</specifics>

<deferred>
## Deferred Ideas

- Phase 1 code review fixes (5 blockers: missing ES6+ AST node types) — fix when they cause real problems, rare in practice
- Full Dashboard Studio JSON Schema — could be valuable long-term but Phase 2 scope is targeted validation only

</deferred>

---

*Phase: 2-Schema & Cross-file Validation*
*Context gathered: 2026-05-15*
