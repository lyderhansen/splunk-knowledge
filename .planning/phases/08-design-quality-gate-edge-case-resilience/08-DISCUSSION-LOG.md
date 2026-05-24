# Phase 8 Discussion Log

**Date:** 2026-05-16
**Areas discussed:** 4/4

## Area 1: Check Severity Model
- **Options:** No suppress (WARNs always shown) / Inline comment suppress / Skip-list in visualizations.conf
- **Selected:** No suppress — WARNs are always shown
- **Follow-up:** DQG-05 threshold aligned to Phase 7 D-12 (4 sections, not 3)
- **Options:** 4 sections (match D-12) / 3 sections (original floor)
- **Selected:** 4 sections (match Phase 7 D-12)

## Area 2: Edge Case Pattern Location
- **Options:** New edge-cases.md / Inline in SKILL.md / Add to all-patterns.md
- **User asked for recommendation** → Claude recommended new edge-cases.md (SKILL.md at ceiling, all-patterns is wrong domain)
- **Selected:** Yes, new edge-cases.md in vp-viz/references/

## Area 3: Bidirectional Wiring Strictness
- **Options:** Regex-aware with whitelists / Strict opt() only / Namespace extraction + grep
- **User deferred to Claude** → Claude chose namespace extraction + grep presence (most robust, no false positives)
- **Selected:** Namespace extraction from formatter + grep presence in JS

## Area 4: Empty State Brand Treatment
- **Options:** Centered text only / Icon + text (subtle) / Claude's discretion per brand
- **Selected:** Icon + text (subtle) — decorative element above centered "No data available"
