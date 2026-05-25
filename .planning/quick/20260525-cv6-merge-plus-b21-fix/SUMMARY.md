---
quick_id: 20260525-cv6-merge-plus-b21-fix
completed: 2026-05-25T15:20:00Z
status: complete
type: housekeeping
---

# Quick Task Summary: cv6 additive merge + B21 fix

Two atomic tasks, both shipped.

## Task A — cv6 additive merge (commit `<cv6-commit>`)

**Result:** splunk-custom-viz (v6.0.1) now installable from marketplace alongside splunk-viz-packs (v5.10.1).

| Artifact | Before | After |
|---|---|---|
| Plugins in `plugins/` | 4 | 5 (+ splunk-custom-viz) |
| `.claude-plugin/marketplace.json` plugin entries | 4 | 5 |
| splunk-viz-packs marketplace description | "Build themed Splunk custom viz apps…" | "Legacy v5.x — use splunk-custom-viz for new projects. …" |
| `archive/` cursor review docs | absent | `cursor_overkill_2026_05_23.md` + `cursor_review_2026_05_23.md` (context for parked todo) |

**Files copied from `../splunk-knowledge-cv6/`:**
- `plugins/splunk-custom-viz/` (entire directory — 28 files: plugin.json, README.md, 4 skill dirs, 4 build scripts, 6 reference docs, 8 stage-A docs, templates, tests)
- `.claude-plugin/marketplace.json` (replaced with cv6 branch's canonical 5-plugin block)
- `archive/cursor_overkill_2026_05_23.md` (416 lines — rationale for v6 rewrite)
- `archive/cursor_review_2026_05_23.md` (523 lines — P0-P2 critique of v5)

**No splunk-viz-packs files touched.** Path A from the parked todo. Both plugins coexist.

## Task B — B21 empty-data guard fix (commit `77e26a56`)

**Result:** v5.10.1 ships with a structurally-aware B21 validator that catches the partial-guard regression observed in test48_v510 polestar.

**Files modified:**
- `plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md` (line 24-25 — added explicit rule with pattern + cause)
- `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md` (new "Empty-Data Guard" section with Classic + Extension examples + `_lastGoodData` cache idiom)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` (B21 upgraded from loose `!= null|safeStr|safeNum` grep to two-tier check: legacy idiom + structural pattern matching both orderings)
- `plugins/splunk-viz-packs/.claude-plugin/plugin.json` (5.10.0 → 5.10.1)

**Memory saved:** `feedback_empty_data_guard.md` indexed in MEMORY.md.

**Self-test confirms the new check works:** Running validate_viz.sh against tests/test48_v510/polestar_fleet_ops correctly emits 6 FAIL B21 lines (one per viz — all 6 have the partial-guard pattern). Future builds will be caught at validate time.

**test48_v510 NOT retroactively patched.** Per CONTEXT D-05 #4 + Phase 42 D-04 lock — test packs are throwaway artifacts.

## Acceptance Criteria

- [x] `ls plugins/` lists splunk-custom-viz alongside splunk-viz-packs
- [x] `cat .claude-plugin/marketplace.json` shows 5 plugin entries
- [x] `cat plugins/splunk-custom-viz/.claude-plugin/plugin.json | grep version` → 6.0.1
- [x] `cat plugins/splunk-viz-packs/.claude-plugin/plugin.json | grep version` → 5.10.1
- [x] `grep -c "B21" plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` → 3 (was 1)
- [x] pre-code-checklist.md has the strengthened B21 rule line
- [x] splunk-viz-packs plugin.json description unchanged by Task A (additive only)
- [x] tests/test48_v510/ unchanged (no retroactive patching)
- [x] Memory `feedback_empty_data_guard.md` saved + indexed
- [x] Self-test: new B21 check fails polestar's partial guards (proves rule works)

## Next Steps

1. **Test cv6 with a real prompt** — run the Polestar prompt through cv6 (or pick a fresh brand) to compare against v5's test48 result. Updates the parked cv6 evaluation todo with multi-viz parity evidence.
2. **Decide on test48 disposition** — leave as-is (carries the bug as a historical example) or rebuild with v5.10.1's tightened rule. Per Phase 42 D-04, test packs are throwaway, so leave-as-is is the default.
