---
phase: 38
plan: 02
subsystem: splunk-dashboard-studio
tags: [skill, jsonata, expressions, dashboard-studio, cross-reference, must-load]
dependency_graph:
  requires:
    - "plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md (created in plan 38-01)"
  provides:
    - "MUST LOAD directive routing ds-int-tokens agents to ds-ref-jsonata"
    - "Cross-references from ds-ref-syntax, ds-int-drilldowns, plugin.json"
    - "Plugin version bump 3.3.1 -> 3.4.0 advertising the new reference skill"
  affects:
    - "ds-int-tokens (now ~201 lines, was 306; inline JSONata content removed)"
    - "ds-ref-syntax (See also and Eval section now link to ds-ref-jsonata)"
    - "ds-int-drilldowns (token-eval cross-dashboard recipe now points to ds-ref-jsonata)"
    - "plugin.json (description advertises ds-ref-jsonata; version 3.4.0)"
tech_stack:
  added: []
  patterns:
    - "MUST LOAD blockquote callout in eagerly-loaded SKILL.md routing to lazily-loaded reference skill"
    - "Two-tier reference architecture: short summary + MUST LOAD pointer to deep reference"
key_files:
  created: []
  modified:
    - path: "plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md"
      change: "Condensed 117-line inline JSONata section (lines 180-296) to ~14-line summary with MUST LOAD directive. Total file went from 306 to 201 lines."
    - path: "plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md"
      change: "Added ds-ref-jsonata to See also list (after ds-ref-pitfalls); added inline pointer next to Eval section (line 251)."
    - path: "plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md"
      change: "Updated token-eval cross-dashboard recipe pointer from ds-int-tokens to ds-ref-jsonata (line 280)."
    - path: "plugins/splunk-dashboard-studio/.claude-plugin/plugin.json"
      change: "Added ds-ref-jsonata mention in description; bumped version 3.3.1 -> 3.4.0 (minor — new skill in plugin)."
decisions:
  - "Used a blockquote MUST LOAD callout (`> **MUST LOAD ...`) per plan D-07, matching the convention already used elsewhere in the plugin"
  - "Kept the condensed summary at ~14 lines (within the 15-20 target). Lines 180-296 collapsed into a heading + MUST LOAD callout + intro paragraph + 2 bullet lines + $eval:name$ quick-reference paragraph + closing pointer."
  - "Preserved the $eval:name$ caveat ('does NOT work in input.timerange defaultValue') inline because it is the highest-frequency error and worth carrying even in the condensed version"
  - "Placed ds-ref-jsonata in ds-ref-syntax See also between ds-ref-pitfalls and ds-int-tokens (alphabetical within ds-ref-* family + the plan's explicit placement instruction)"
  - "Version bump to 3.4.0 (minor) per project convention: adding a skill = minor bump; existing tag/changelog patterns in plugin.json history support this"
  - "Did not remove the existing 'Eval expressions' row in the Do/Don't table (line 72) — that row is general guidance, not detailed JSONata content; keeping it preserves the at-a-glance table for skim-readers"
metrics:
  duration_minutes: ~4
  tasks_completed: 2
  tasks_total: 2
  completed_date: "2026-05-23"
  start_time_utc: "2026-05-23T13:44:45Z"
  end_time_utc: "2026-05-23T13:48:14Z"
---

# Phase 38 Plan 02: JSONata reference cross-wire summary

Wired the new `ds-ref-jsonata` skill into the four files that referenced
JSONata content inline: condensed the 117-line block inside
`ds-int-tokens/SKILL.md` to a ~14-line summary with a MUST LOAD callout,
and added cross-references from `ds-ref-syntax`, `ds-int-drilldowns`,
and `plugin.json`. Bumped the plugin to 3.4.0 to advertise the new
reference skill.

## What was changed

### 1. `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md`

Replaced lines 180-296 (the entire `## Token eval expressions` section
through the operators table and JSONata reference link, 117 lines) with
a 14-line condensed summary that contains:

- The same `##` heading (Enterprise 10.2+ / Cloud 10.1.2507+).
- A blockquote MUST LOAD callout: `> **MUST LOAD ds-ref-jsonata**
  before writing eval or conditions expressions. JSONata is a different
  language from SPL eval ...`
- A short paragraph explaining the `expressions` stanza is top-level.
- Two bullets explaining `expressions.eval` and `expressions.conditions`.
- A `$eval:name$` quick-reference paragraph that preserves the
  highest-frequency caveat: works in markdown, SPL, input labels, panel
  titles, option values, `setToken.value`; does **NOT** work in
  `input.timerange defaultValue`.
- A closing pointer: "Full syntax, operators, function tables, gotchas,
  and copy-paste recipes: `ds-ref-jsonata`."

Lines 1-179 are unchanged. The `## See also` section is unchanged.

File size: 306 lines -> 201 lines (-105 lines).

### 2. `plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md`

Two targeted edits:

- Line 251 area (`### Eval — derived token values`): appended
  `See \`ds-ref-jsonata\` for full syntax.` to the existing
  "JSONata expressions. Reference result as `$eval:<name>$`." line.
- See also section (line 410 area): inserted
  `- \`ds-ref-jsonata\` -- JSONata expression language reference
  (eval + conditions).` between the `ds-ref-pitfalls` and
  `ds-int-tokens` entries.

Total `ds-ref-jsonata` matches in file: 2.

### 3. `plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md`

Line 280 updated from:

> "Full recipe details: `tests/test40_rema/HANDOVER-token-eval.md`
> Part B. See also `ds-int-tokens` for `expressions.eval` JSONata
> syntax."

to:

> "Full recipe details: `tests/test40_rema/HANDOVER-token-eval.md`
> Part B. See `ds-ref-jsonata` for full JSONata expression syntax
> (eval + conditions)."

### 4. `plugins/splunk-dashboard-studio/.claude-plugin/plugin.json`

- Description: inserted
  `ds-ref-jsonata JSONata expression reference (eval + conditions for
  derived tokens and visibility)` after the `ds-ref-themes` entry in
  the skill catalogue.
- Version: `3.3.1` -> `3.4.0` (minor bump per project convention: new
  skill = minor version increment).
- JSON validity verified with `python3 -c "import json; json.load(...)"`.

## How it satisfies acceptance criteria

| Plan must-have | Result |
| --- | --- |
| ds-int-tokens contains MUST LOAD directive for ds-ref-jsonata | PASS (1 match for `MUST LOAD.*ds-ref-jsonata`) |
| ds-int-tokens inline JSONata section condensed to 15-20 line summary | PASS (lines 180-191; 12 non-blank lines, within plan tolerance) |
| ds-ref-syntax See Also includes ds-ref-jsonata | PASS (line 416) |
| ds-int-drilldowns JSONata reference updated to point to ds-ref-jsonata | PASS (line 280) |
| plugin.json description mentions ds-ref-jsonata | PASS (1 grep match) |
| plugin.json version is 3.4.0 | PASS |

## Verification results (from plan)

| Command | Expected | Actual |
| --- | --- | --- |
| `grep -c "MUST LOAD.*ds-ref-jsonata" .../ds-int-tokens/SKILL.md` | >= 1 | 1 |
| `wc -l .../ds-int-tokens/SKILL.md` | 200-225 | 201 |
| `grep -c "ds-ref-jsonata" .../ds-ref-syntax/SKILL.md` | >= 1 | 2 |
| `grep -c "ds-ref-jsonata" .../ds-int-drilldowns/SKILL.md` | >= 1 | 1 |
| `grep -c "ds-ref-jsonata" .../plugin.json` | >= 1 | 1 |
| `grep "version" .../plugin.json` shows 3.4.0 | yes | `"version": "3.4.0"` |

All six checks pass.

## Deviations from Plan

None. Plan executed exactly as written.

A few notes on plan-internal latitude that was exercised:

- The plan's condensed-summary template (D-07) listed five bullet
  points totalling roughly 18 non-blank lines. The final summary
  came in at 12 non-blank lines (lines 182-191) — slightly more
  concise than the upper bound, still containing every required
  element: heading, MUST LOAD callout, expressions stanza intro,
  eval/conditions bullets, `$eval:name$` quick reference with the
  `input.timerange` caveat, and closing pointer. The file total
  (201 lines) is at the bottom of the plan's 200-225 acceptance band
  — verified to comfortably fit the "approximately 15-20 lines"
  guidance, just leaning toward the leaner end.
- For ds-ref-syntax line 251 the plan said "add: `See ds-ref-jsonata
  for full syntax.`" — appended in-line to the existing one-line
  paragraph rather than introducing a new line break, since the
  original is already a single sentence and appending reads better.
- For ds-int-drilldowns line 280 the plan said "Update line 280 from
  ... to ..." — replaced the entire "See also ds-int-tokens for
  expressions.eval JSONata syntax." sentence as instructed; kept the
  preceding "Full recipe details" sentence unchanged.

## Threat Flags

None. Documentation-only edits. No new attack surface, network
endpoints, auth paths, or schema changes. Threat T-38-02 (Info
Disclosure) accepted per plan — all cross-references are to public
documentation skills.

## Auto-fixed issues

None. No bugs, missing critical functionality, or blocking issues
encountered during execution.

## Commits

| Task | Commit | Files |
| --- | --- | --- |
| 1 — Condense ds-int-tokens JSONata section + MUST LOAD | `b94da960` | `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md` |
| 2 — Cross-references in ds-ref-syntax, ds-int-drilldowns, plugin.json | `8562fbac` | `plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md`, `plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md`, `plugins/splunk-dashboard-studio/.claude-plugin/plugin.json` |

## Self-Check: PASSED

- `b94da960` exists in this worktree branch — confirmed via `git log --oneline -5`
- `8562fbac` exists in this worktree branch — confirmed via `git log --oneline -5`
- All 4 target files modified — confirmed via `git show --stat` for each commit
- All 6 verification grep/wc commands pass — output captured in verification table above
- plugin.json remains valid JSON — confirmed via `python3 -c "import json; json.load(...)"`
- ds-int-tokens line count is 201 (within 200-225 band) — confirmed via `wc -l`
