# Wave 6 Review — tests/test* Pack Age Sweep (Flag-Only)

**Reviewed:** 2026-05-25
**Reviewer:** Plan 43-06 (inline orchestrator — Wave 6 sweep + REVIEW.md synthesis)
**Scope:** Flag-only sweep across all 46 `tests/test*` directories — NO source edits per CONTEXT D-05 #4 + Phase 42 D-04 (test packs are throwaway artifacts).
**Method:** mtime-based dating of `visualization_source.js` per pack, classified against milestone landing dates (THM-05: 2026-05-24, PP-01/PP-02: 2026-05-22, AF-01/AF-02: 2026-05-23).

---

## Methodology

Per RESEARCH §tests/test* Pack Age Survey Assumption A1, mtime alone is unreliable for THM-05/AF-01 violation detection — content-grep is recommended. This sweep uses both signals:

1. **Mtime of `visualization_source.js`** — primary signal for pack age classification.
2. **Empty/no-viz-js packs excluded** — packs without `appserver/static/visualizations/*/visualization_source.js` are early prototypes or non-viz-pack scaffolds (test01-08, test09, test22, test22b, test22c, test06, test41_extension, test46).

**Note:** The 46-vs-45 count discrepancy between RESEARCH and Wave 4 NIT 2 is resolved at 46 directories at sweep time (one pack added since Wave 4 wrote its review).

---

## Pack Inventory by Era

### Pre-THM-05 / Pre-AF-01 (`visualization_source.js` mtime < 2026-05-22 OR no viz code refactor since)

These packs predate Phase 40 (Animation Helper Scope Rule) and Phase 42 (THM-05 backgroundColor unconditional read). Their viz code may demonstrate the very anti-patterns the milestone fixed. **They are misleading examples for any new pack scaffold.**

| Pack | Last viz-code mtime | Notes |
|------|---------------------|-------|
| test12_mood | 2026-05-06 | Pre-v5.5; mood-recipes era |
| test13_tuning | 2026-05-07 | Porsche fix recipe (memory: feedback_test15_fix_recipe) |
| test14_more_freedom | 2026-05-07 | Creative freedom test |
| test15_340 | 2026-05-07 | Test15 fix recipe target |
| test16_porche | 2026-05-07 | Porsche v5.5 test |
| test17_impecable_ui_implement | 2026-05-11 | impeccable UI suite |
| test18_spotify | 2026-05-11 | Pre-Phase-37 Spotify |
| test19_netflix | 2026-05-11 | |
| test20_McLaren | 2026-05-12 | Phase 24 era |
| test21_patagonia | 2026-05-13 | check_contrast.js integration test target |
| test23_single_viz | 2026-05-13 | |
| test24_apple | 2026-05-13 | Light theme contrast failure surfaced here |
| test25_v4 | 2026-05-14 | check_contrast.js integration test target; cited in Wave 3 integration tests |
| test26_full_pack | 2026-05-14 | v4 full pack |
| test27_table | 2026-05-14 | Table viz pack |
| test28_drilldown_tabs | 2026-05-15 | validate_viz integration test target; cited in Wave 3 |
| test29_v5 | 2026-05-17 | Phase 24-ish |
| test30_v5.1 | 2026-05-18 | |
| test31_v5.1 | 2026-05-18 | |
| test32_avinor | 2026-05-18 | |
| test33_nasa | 2026-05-18 | |
| test33_2_nasa | 2026-05-18 | |
| test34_emirates | 2026-05-18 | |
| test35_cocacola | 2026-05-19 | |
| test36_forsvaret | 2026-05-19 | |
| test37_Spotify | 2026-05-19 | feedback_test37_findings — known issues |
| test38_strava | 2026-05-19 | feedback_test38_strava_report — cleanest pre-PP-01 build |
| test39_skatt | 2026-05-21 | Last pre-PP-01 pack |

**Pre-2026-05-22 count: 28 packs.** Their viz code does NOT reflect THM-05 (light-mode backgroundColor unconditional read), AF-01 (Animation Helper Scope Rule), or PP-01/PP-02 (Pillow preview pipeline). They predate the rule and were never retrofitted (per Phase 42 D-04 carry-forward — test packs are throwaway artifacts; remediation is out of scope for this phase).

### Phase 41 landing era (2026-05-22 — PP-01/PP-02 day)

| Pack | mtime | Notes |
|------|-------|-------|
| test40_rema | 2026-05-22 | Borderline — may have PP-01 partial application |
| test42_redbull | 2026-05-22 | |

**Count: 2 packs.** May exhibit partial Phase 41 patterns but predate Phase 42 THM-05.

### Post-Phase 41/42 packs (2026-05-23+)

These packs *should* reflect the v5.7.0+ rules. They are the only candidates worth citing as "exemplary" patterns in future skill examples.

| Pack | mtime | Notes |
|------|-------|-------|
| test43_redbull_detailed | 2026-05-23 | |
| test44_redbull_Detailed_5.7 | 2026-05-23 | Wave 4 of v5.7.0 |
| test45_lego | 2026-05-23 | Cited in Wave 3 as candidate "clean modern pack" integration target |
| test_phase42_bgcolor | 2026-05-24 | Phase 42 THM-05 test fixture — explicitly built to exercise THM-05 |

**Post-Phase 41/42 count: 4 packs.**

### Empty / scaffold-only / non-viz-pack directories

| Pack | Reason |
|------|--------|
| test01, test03, test04, test05, test08 | Early prototypes — no viz code |
| test06-agent-dashboard | Agent dashboard scaffold |
| test09-vizpacks | Wrapper scaffold |
| test22_nike, test22b_nike, test22c_nike | Subagent-dispatch experiments (memory: feedback_subagent_context_loss; feedback_inline_not_subagent) — failed to produce viz code |
| test41_extension | Extension API scaffold-only |
| test46_cursor_skill | Cursor skill experiment scaffold |

**Empty/scaffold count: 12 directories.**

---

## Summary

| Category | Count | Action per CONTEXT D-05 #4 + Phase 42 D-04 |
|----------|-------|--------------------------------------------|
| Pre-2026-05-22 (pre-PP-01) | 28 | FLAG-ONLY. No edits this phase. Considered misleading examples for any new pack scaffold. |
| Phase 41 landing day (2026-05-22) | 2 | FLAG-ONLY. Partial Phase 41 — predates Phase 42 THM-05. |
| Post-Phase 41/42 (2026-05-23+) | 4 | EXEMPLARY candidates for skill examples (test45_lego, test_phase42_bgcolor specifically). |
| Empty / scaffold-only | 12 | NO ACTION. Not viz packs. |
| **Total directories** | **46** | |

**No `tests/` source files were modified by Wave 6.** Per CONTEXT D-05 #4 and the Phase 42 D-04 carry-forward lock, test pack source code retrofit is OUT OF SCOPE for this phase. The 28 pre-PP-01 packs remain in tree as historical references and are not candidates for the Phase 43 remediation block (Plan 43-07).

---

## Recommendations for skill authoring

Where a SKILL.md or reference doc cites a test pack as an example or integration target, prefer post-2026-05-23 packs to avoid demonstrating the very anti-patterns the milestone fixed:

- **Wave 3 integration tests** (`test_validate_viz_integration.sh`, `test_check_contrast.js`) cite test21 / test25 / test28 — all pre-THM-05. Wave 3 WARNING #18, #19 captured this; the recommendation is to add `test45_lego` as an optional clean-pack integration target.
- **`vp-viz/SKILL.md` and other SKILLs that show "see test pack X" pointers** (if any) should prefer test45_lego or test_phase42_bgcolor as the modern reference example.

These are recommendations for the canonical skill files, not for the test packs themselves.
