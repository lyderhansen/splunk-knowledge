# Phase 2: Schema & Cross-file Validation - Discussion Log

**Date:** 2026-05-15
**Participants:** User + Claude

## Areas Discussed

### 1. Schema Source & Scope

**Options presented:**
1. Reverse-engineer from outputs
2. Minimal targeted schema
3. Full schema from Splunk docs

**User's selection:** User offered to provide samples. Claude noted sufficient samples already exist in test sessions and .splunk-dashboards/. Discussion converged on minimal targeted schema approach — validate only the parts that cause bugs (B9, B10, data source references).

**Rationale:** Full schema would generate false positives and require maintenance for Splunk version changes. Targeted approach covers real failure modes without overhead.

### 2. Cross-file Matching Strategy

**Options presented:**
1. Namespace prefix matching only
2. Full option name matching

**User's selection:** Full option name matching

**Rationale:** Catches both orphaned options (declared in formatter but not read in JS) and missing reads (read in JS but not in formatter). More thorough.

### 3. Code Review Fixes from Phase 1

**Options presented:**
1. Fix in Phase 2
2. Separate fix phase (2.1)
3. Defer to later

**Discussion:** User questioned why ES6 was being mentioned when the project uses ES5. Clarification: the validator *detects* non-ES5 patterns to prevent them from reaching Splunk. The review found it doesn't detect *all* non-ES5 patterns. User agreed these are rare in practice (Claude generates the code and knows the constraint).

**Decision:** Defer — fix when they cause real problems. Phase 2 stays focused on schema and cross-file validation.

## Deferred Ideas

- Phase 1 code review fixes (5 blockers: missing ES6+ AST node types)
- Full Dashboard Studio JSON Schema
