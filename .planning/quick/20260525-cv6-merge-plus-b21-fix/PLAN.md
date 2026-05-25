---
quick_id: 20260525-cv6-merge-plus-b21-fix
created: 2026-05-25T15:11:00Z
status: in-progress
type: housekeeping
---

# Quick Task: cv6 additive merge + B21 empty-data guard fix

Two scopes, zero file overlap, atomic per-task commits.

## Task A — Path A additive merge of splunk-custom-viz (v6)

Bring the cv6 plugin into main as a NEW plugin **alongside** splunk-viz-packs (NOT replacing it). v5 stays installable at 5.10.x; v6 added as the HTML-first alternative.

**Files modified:**
- `plugins/splunk-custom-viz/` (NEW — entire directory copied from `../splunk-knowledge-cv6/`)
- `.claude-plugin/marketplace.json` (updated — adopt cv6 branch's canonical 5-plugin block)
- `archive/cursor_overkill_2026_05_23.md` (NEW — context doc for parked todo)
- `archive/cursor_review_2026_05_23.md` (NEW — context doc for parked todo)

**Commit:** `feat(marketplace): add splunk-custom-viz v6.0.0 as additive HTML-first plugin`

## Task B — B21 empty-data guard fix in v5

The B21 rule's grep is too loose — passes when `safeStr` appears anywhere, misses unguarded `data.fields.length` after only `data.rows` checked. Observed in test48_v510 polestar — momentary "Cannot read properties of undefined (reading 'length')" before render.

**Files modified:**
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md` (strengthen B21 rule)
- `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md` (add Classic row-major guard example at template level)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` (tighten B21 grep with structural guard check)
- `plugins/splunk-viz-packs/.claude-plugin/plugin.json` (5.10.0 → 5.10.1)
- Memory: `feedback_empty_data_guard.md` (NEW)

**Commit:** `fix(43.1): tighten B21 empty-data guard rule + bump splunk-viz-packs 5.10.0 → 5.10.1`

## Acceptance

- [x] cv6 plugin appears in `plugins/` alongside v5
- [x] marketplace.json registers 5 plugins
- [x] v5 plugin.json description not touched by Task A (additive only)
- [x] v5 plugin.json version = 5.10.1 (after Task B)
- [x] B21 structural check in validate_viz.sh
- [x] pre-code-checklist.md has the strengthened guard rule
- [x] visualization-js-template.md shows the Classic guard pattern
- [x] tests/test48_v510/ untouched (no retroactive patching)
