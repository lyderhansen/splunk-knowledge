---
created: 2026-05-25T12:40:56.441Z
title: Evaluate cv6 HTML-first as splunk-viz-packs replacement
area: general
files:
  - /Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge-cv6/plugins/splunk-custom-viz
  - /Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge-cv6/cursor_review_2026_05_23.md
  - /Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge-cv6/cursor_overkill_2026_05_23.md
  - tests/test46_cursor_skill/
  - plugins/splunk-viz-packs (v5.10.0 — current)
---

## Problem

A parallel v6.0.0 rewrite of `splunk-viz-packs` lives on the `splunk-custom-viz-v6` branch (worktree at `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge-cv6/`). It's called **`splunk-custom-viz`** and takes a radically different approach: 4 skills (cv-scope → cv-sketch → cv-create → cv-build) vs v5's 6 skills, 29 files vs v5's 1817, and an **HTML-first workflow** where `mockup.html` + `DESIGN-LOCK.md` are the design contract instead of validator-based discipline.

The cv6 branch's `marketplace.json` already labels v5 splunk-viz-packs as "Legacy v5.x — use splunk-custom-viz for new projects" — i.e. the rewrite is intended as the replacement.

**Evidence cv6 works:**
- `tests/test46_cursor_skill/cisco_sec_viz/attack_timeline` — built via cv-* skills; user feedback: "the results was great"
- 1,149-line `mockup.html` + 543-line `DESIGN-LOCK.md` produced before any Splunk code
- Aligns with `feedback_html_first_workflow.md` memory ("PROVEN")
- Aligns with `feedback_creative_prioritization.md` memory (compliance was eating attention in v5; mockup-as-contract sidesteps that)

**Evidence cv6 is unproven:**
- Only 1 shipped test pack vs v5's 4 post-Phase 41/42 multi-viz packs (test43, test44, test45_lego, test_phase42_bgcolor)
- Breadth at multi-viz inventory + dashboard composition + drilldown wiring untested

**Cursor's published review** (`cursor_review_2026_05_23.md` + `cursor_overkill_2026_05_23.md`, 939 lines combined) is the rationale for the rewrite. P0 findings against v5: 12MB of node_modules shipping in marketplace, score_design.js theater (counts proxies for effort, not quality), and "development workflow bled into shipped content."

## Solution

Three forks in the road — decide which:

- **(a) Adopt cv6 as the canonical plugin.** Merge `splunk-custom-viz-v6` to main, archive `splunk-viz-packs` to `archive/` (or mark deprecated in marketplace.json), redirect all docs/tests to cv-*. Highest blast radius; cleanest end state.
- **(b) Cherry-pick the HTML-first pattern into v5.** Keep `splunk-viz-packs` as the active plugin but add an HTML mockup stage to `vp-design` and a `DESIGN-LOCK.md` contract format for `vp-viz` to consume. Lower risk; preserves the validator infrastructure that's actually pulling weight (per cursor_overkill §C); doesn't kill the multi-viz breadth proven across tests 25-45.
- **(c) Coexist until breadth parity.** Ship both plugins in the marketplace, label cv6 as "design-first / single-viz" and v5 as "multi-viz packs". Run a few multi-viz brand builds on cv6 to confirm it scales. Decide after that.

**Recommended starting probe:** Run the SAME brand prompt through cv6 (4-6 vizs, dashboard, drilldowns) and v5, compare results. If cv6 hits parity on a multi-viz pack, (a). If cv6 stumbles at inventory but the single-viz quality remains higher, (b). Otherwise (c).

**Open questions:**
- Does cv6 produce a Dashboard Studio JSON dashboard, or only individual vizs? (v5 has the mandatory dashboard step — Phase 15 DSB-01)
- How does cv6 handle Extension API .spl output? (claimed in plugin.json but only Classic .tar.gz seen in test46)
- Are the cursor reviews the user's view, or an external reviewer the user agrees with? (relevant to how heavily their critique should bind future decisions)

## Resume signal

Open this todo via `/gsd:capture --list` or just re-read this file. The cv6 branch is `splunk-custom-viz-v6` at worktree `splunk-knowledge-cv6`.
