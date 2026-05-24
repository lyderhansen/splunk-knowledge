---
phase: 42-light-mode-backgroundcolor
date: 2026-05-24
mode: discuss (default)
---

# Phase 42 Discussion Log

Human-reference only. Downstream agents read CONTEXT.md, not this file.

## Domain Boundary Stated

> A documentation-only fix to four references files so future Claude-generated viz
> code respects the user's `backgroundColor` formatter control in both dark and
> light themes — not just dark.

## Gray Areas Asked

### Q1 — Doc location (multiSelect)
Options offered:
1. theme-template.md (primary)
2. pre-code-checklist.md (rule line)
3. visualization-js-template.md (render() template)
4. config-json-template.md (Extension API)

**User selected:** all four

→ Recorded as D-01 in CONTEXT.md.

### Q2 — Read order (single-select)
Options offered:
1. Functional — never inside an if(isDark)
2. Strict literal — before var isDark / var t
3. Strict literal with explicit default

**User said:** "you decide" → Claude's discretion exercised.

**Decision:** Functional interpretation. LM-02's pattern `opt('backgroundColor', t.bg)`
requires `t` to be computed first, contradicting strict-literal. The real bug per
the Tesla FSD memory is theme-conditional rendering that falls through to `t.bg`/
`t.panel` directly — the rule must forbid that, not the var-declaration order.

→ Recorded as D-02 in CONTEXT.md with WRONG/RIGHT example.

### Q3 — Enforcement (single-select)
Options offered:
1. Doc-only (templates + checklist)
2. Add a check_design.js D-rule
3. Doc-first; defer validator rule

**User selected:** Doc-only (templates + checklist).

→ Recorded as D-03 in CONTEXT.md. Validator D-rule captured in `<deferred>`.

### Q4 — Retrofit scope (single-select)
Options offered:
1. Templates only (forward-only)
2. Templates + smoke-test pack patch
3. Templates + all recent test packs

**User said:** "you decide" → Claude's discretion exercised.

**Decision:** Templates only (forward-only). Rationale:
- ROADMAP allocates 1 plan
- Test packs are test artifacts, not production
- Plan 41-02 wave-isolation discipline (just shipped) forbade touching test packs
- Next vp-create build will produce correct code

→ Recorded as D-04 in CONTEXT.md.

## Claude's Discretion Items

- **D-05 (Extension API rule shape):** Added unprompted. The Extension API has no
  `isDark` boolean — it uses `addThemeListener(callback)`. The Classic WRONG/RIGHT
  block doesn't translate verbatim; the v6.0 rule is "options.backgroundColor must
  be read once at render start and not replaced inside the listener callback."
- **D-06 (Version bump):** 5.9.0 → 5.9.1 (patch, since the public surface is
  unchanged). Memory `feedback_plugin_version_bump.md` requires the bump.
- **THM-05 tag chosen:** extends the existing THM-01..THM-04 family in
  theme-template.md so cross-references are consistent.

## Scope Creep Avoided

None. The user did not propose any out-of-scope additions during discussion.

## Deferred Ideas

- `check_design.js` D12 rule that fails validation when
  `if (isDark) { ... opt('backgroundColor') ... }` is found. Captured in
  `<deferred>` of CONTEXT.md.
- Retrofit Tesla FSD and older test packs to demonstrate the fix end-to-end.
- Phase 43 (Deep Review) should explicitly check the Extension API
  `addThemeListener` pattern once v6.0 packs exist.

## Locked Prior Decisions Applied

- ES5-only (Phase 22+, reaffirmed Phase 40) — applies to example code blocks.
- `hexFromSplunk()` wraps every color picker opt() read (Phase 22+, B22).
- `themeMode` defaults to "auto" (Phase 24+, FAIL B20).
- Reference files load on-demand (Phase 39 progressive disclosure).
- Wave-isolation / no-test-pack-mutation discipline (Phase 41-02).
