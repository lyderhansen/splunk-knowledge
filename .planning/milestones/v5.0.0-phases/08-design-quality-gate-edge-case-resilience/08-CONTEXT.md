# Phase 8: Design Quality Gate & Edge Case Resilience - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Two capabilities: (1) a `check_design.js` script that catches design regressions at build time, wired into validate_viz.sh as Phase 4; and (2) hardening all generated viz code against empty/null/overflow data via reusable patterns in a new reference file. Both ensure generated vizs pass quality gates and render gracefully under any data condition.

</domain>

<decisions>
## Implementation Decisions

### Check Severity Model
- **D-01:** WARNs are always shown, no suppress mechanism. Keep it simple — WARNs don't block packaging, so they surface every time. Claude documents intentional deviations in viz comments if needed.
- **D-02:** DQG-05 threshold is 4 sections (matching Phase 7 D-12), not 3. The quality gate enforces what the generator targets.
- **D-03:** Severity mapping: FAIL = DQG-03 (hero formula), DQG-05 (formatter sections < 4), DQG-08 (bidirectional wiring). WARN = DQG-01 (gradients), DQG-02 (shadows), DQG-04 (tinted neutrals), DQG-06 (color pickers).

### Edge Case Pattern Location
- **D-04:** New dedicated file `plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md`. Contains safeStr/safeNum templates, empty-state draw pattern, pagination math, ctx.save/restore discipline, and single-row/multi-row guards.
- **D-05:** SKILL.md step 5 (JS generation) references edge-cases.md as a MUST-READ alongside theme-template.md and canvas-recipes. No inline expansion — SKILL.md is at 468/500 lines.

### Bidirectional Wiring Check (DQG-08)
- **D-06:** Implementation: namespace extraction from formatter + grep presence in JS. Extract control names by stripping `{{VIZ_NAMESPACE}}.` prefix from formatter `name=` attributes. Grep for each name string in visualization_source.js (catches opt(), detectTheme(), or any access pattern). Reverse: extract all opt('...') calls from JS, verify each has a matching formatter control.
- **D-07:** No special whitelist for themeMode or other indirect reads — grep presence is sufficient. If the string "themeMode" appears in both files (formatter name attr and JS source), the check passes regardless of how it's consumed.

### Empty State Brand Treatment
- **D-08:** Icon + text pattern: a subtle canvas-drawn decorative element (dashed circle or horizontal line in accent color at low opacity) above centered "No data available" text in brand typography (theme.FONTS.body at whisper opacity).
- **D-09:** The edge-cases.md template provides the canonical pattern. Claude may adapt the icon shape per brand but the structure (icon above + centered text below) is fixed.

### Carried Forward from Phase 7
- Phase 7 D-08: hero text ALWAYS `t.text` on light theme (check_design.js should validate this — candidate for DQG-03 hero formula check)
- Phase 7 D-12: minimum 4 formatter sections (now enforced as DQG-05 FAIL threshold)
- Phase 7 D-07: accentIntensity ONLY controls glow — other effects have individual toggles (relevant to bidirectional wiring check)

### Claude's Discretion
- Icon shape/style for empty state per brand (dashed circle, horizontal line, brand mark outline)
- Whether to add additional WARN checks beyond DQG-01 through DQG-06 if obvious patterns emerge during implementation
- Exact regex patterns for detecting "hero formula" (DQG-03) — likely Math.min/Math.max with measureText or getTypoScale

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — existing validation pipeline (Phases 2-3), new Phase 4 hooks here
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js` — existing AST-based JS validation
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js` — existing Phase 3 contrast check (reference for check structure)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — generation orchestration (step 5 JS, step 7 formatter)
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — formatter HTML structure (4 sections)
- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` — theme.js patterns (LIGHT/DARK objects, safeStr/safeNum already exist here)
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — per-viz Settings lists (bidirectional wiring source-of-truth)
- `.planning/phases/07-generation-quality-theme-parity/07-CONTEXT.md` — Phase 7 decisions (D-05 through D-13)

</canonical_refs>

<code_context>
## Codebase Context

### Existing Validation Infrastructure
- `validate_viz.sh` runs phases sequentially: Phase 2 (cross-file formatter↔JS), Phase 3 (contrast + repair loop)
- Each phase is a bash section that calls Node.js scripts (validate_ast.js, check_contrast.js)
- Findings use FAIL/WARN/PASS severity with B-codes (formatter) and F-codes (JS)
- repair_findings.js auto-fixes certain findings (Phase 3 repair loop)

### Existing Edge Case Patterns
- `safeStr(val)` and `safeNum(val, fallback)` already defined in theme-template.md as helper functions
- `this._lastGoodData` cache pattern already documented in CLAUDE.md conventions
- ctx.save()/ctx.restore() mentioned but no formal discipline documented
- No empty-state drawing pattern exists yet
- No pagination pattern exists yet

### File Budget
- SKILL.md: 468/500 lines (32 remaining — cannot absorb edge case patterns inline)
- validate_viz.sh: ~280 lines (room for Phase 4 section)
- New check_design.js: no limit (standalone script)
- New edge-cases.md: no limit (reference file)

</code_context>

<deferred>
## Deferred Ideas

None captured this session.
</deferred>
