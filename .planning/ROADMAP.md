# Roadmap: splunk-viz-packs Hardening

## Overview

This is a hardening milestone for an existing, working plugin (v4.1.0, 28 manual tests). The product generates Splunk custom visualization apps from brand briefs. It works but produces too many first-install bugs and generic-looking output. This roadmap replaces fragile grep-based validation with proper AST/DOM/schema parsing, adds an automated repair loop, enforces design quality gates, and consolidates rules for better LLM adherence. Each phase delivers a testable improvement to either reliability or visual quality.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Baseline & Core Validators** - Establish FISR metric and replace grep with acorn AST + cheerio DOM parsing
- [ ] **Phase 2: Schema & Cross-file Validation** - Add Dashboard JSON schema validation and formatter-to-JS consistency checks
- [ ] **Phase 3: Repair Loop & Light Theme Safety** - Automated validate-fix-rebuild cycle plus WCAG contrast enforcement
- [ ] **Phase 4: Visual Identity & Assets** - Brand-specific rendering, creative viz selection, auto-generated icons and previews
- [ ] **Phase 5: Rule Consolidation** - Compress 54 rules to <30, split oversized references, improve LLM rule adherence

## Phase Details

### Phase 1: Baseline & Core Validators
**Goal**: Validators catch real bugs deterministically, and a FISR baseline exists to measure all future improvements
**Depends on**: Nothing (first phase)
**Mode:** mvp
**Requirements**: SKL-03, VAL-01, VAL-02
**Success Criteria** (what must be TRUE):
  1. Running validate_viz.sh on a viz pack performs acorn AST parsing in ES5 mode and reports specific ES6+ violations (const, let, arrow, template literal, class, destructuring) with line numbers
  2. Running validate_viz.sh on a viz pack performs cheerio DOM parsing on formatter.html and reports structural HTML issues (unclosed tags, malformed nesting, missing required attributes)
  3. A documented FISR score exists for tests 21-28 (retroactive pass/fail per test, stored in .planning/) that future phases can compare against
  4. Existing grep-based checks that still add value continue to pass (no regression in current detection)
**Plans:** 3 plans

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Bundle vendor deps (acorn + cheerio) and write validate_ast.js AST/DOM validator
- [x] 01-03-PLAN.md — Retroactively score FISR for tests 21-28 and produce FISR-BASELINE.md

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Wire validate_ast.js into validate_viz.sh and replace vp-create duplicate with delegation shim

### Phase 2: Schema & Cross-file Validation
**Goal**: Dashboard JSON and cross-file consistency bugs are caught before Splunk install
**Depends on**: Phase 1
**Mode:** mvp
**Requirements**: VAL-03, VAL-05
**Success Criteria** (what must be TRUE):
  1. Running validation on a generated dashboard JSON catches B9 type format errors, B10 bare option keys, and missing data source references via ajv schema
  2. Running cross-file validation detects when a formatter.html option name does not match the corresponding JS config read (namespace mismatch)
  3. Validation output is structured (parseable by repair loop in Phase 3) rather than plain text grep output
**Plans**: TBD

### Phase 3: Repair Loop & Light Theme Safety
**Goal**: Common validation failures auto-fix without user intervention, and light theme text is always readable
**Depends on**: Phase 2
**Mode:** mvp
**Requirements**: VAL-04, VAL-06, DES-01
**Success Criteria** (what must be TRUE):
  1. When validate_viz.sh finds a fixable issue (namespace mismatch, value= vs default=, missing theme default), it auto-repairs, rebuilds, and re-validates -- up to 3 attempts before failing
  2. Theme.js color tokens are checked against WCAG AA contrast ratios for both dark and light backgrounds -- failing tokens are reported with specific hex values and contrast ratios
  3. A viz pack built with `/vp-create` renders readable text in both dark and light Splunk themes without manual color adjustments
  4. The repair loop produces a structured log showing each attempt (what failed, what was fixed, whether re-validation passed)
**Plans**: TBD

### Phase 4: Visual Identity & Assets
**Goal**: Every viz pack looks like a professional designer made it -- unique to the brand, with proper app icons and preview images
**Depends on**: Phase 1
**Mode:** mvp
**Requirements**: DES-02, DES-03, DES-04, DES-05
**Success Criteria** (what must be TRUE):
  1. Every completed viz pack includes an appIcon.png (36x36) with the brand accent color and an initial letter -- generated automatically during build, not a placeholder
  2. Every completed viz pack includes a preview.png (300x200) per visualization with a brand-colored silhouette that represents the viz type -- not a solid color block or 1x1 pixel
  3. vp-design produces viz type selections that avoid default donuts and generic compositions -- the anti-donut checklist and bold-choice guidance are enforced in the skill
  4. Two viz packs for different brands produce visibly different _render() code -- not the same code with swapped color tokens
**Plans**: TBD
**UI hint**: yes

### Phase 5: Rule Consolidation
**Goal**: Skills carry fewer, higher-impact rules that the LLM actually follows consistently
**Depends on**: Phase 3
**Mode:** mvp
**Requirements**: SKL-01, SKL-02
**Success Criteria** (what must be TRUE):
  1. The total rule count across vp-* skills is under 30 (down from 54), with overlapping rules merged and low-impact rules removed
  2. all-patterns.md is under 500 lines (down from 911), with rules classified as universal vs contextual
  3. broken-rules.md is under 500 lines (down from 751), with rules reframed as positive patterns rather than NEVER/ALWAYS prohibitions
  4. A rebuild of a previously-tested brand (from tests 21-28) with the consolidated rules produces equal or better FISR compared to the Phase 1 baseline
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phase 4 depends only on Phase 1, so it could theoretically run after Phase 1, but sequential execution is the default.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Baseline & Core Validators | 0/3 | Not started | - |
| 2. Schema & Cross-file Validation | 0/? | Not started | - |
| 3. Repair Loop & Light Theme Safety | 0/? | Not started | - |
| 4. Visual Identity & Assets | 0/? | Not started | - |
| 5. Rule Consolidation | 0/? | Not started | - |
