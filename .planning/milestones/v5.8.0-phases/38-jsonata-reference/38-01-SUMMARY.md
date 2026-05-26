---
phase: 38
plan: 01
subsystem: splunk-dashboard-studio
tags: [skill, jsonata, expressions, dashboard-studio, reference]
dependency_graph:
  requires:
    - "plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md (source material lines 180-296)"
    - "plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md (structural pattern)"
  provides:
    - "JSONata syntax reference for Dashboard Studio eval and conditions expressions"
    - "Gotchas-first organisation matching spl-gotchas pattern"
    - "Two-tier confidence markers (Confirmed vs Standard JSONata)"
    - "6 copy-paste recipes with full DS JSON wrappers"
  affects:
    - "ds-int-tokens (Plan 38-02 will add MUST LOAD directive and condense inline JSONata content)"
    - "ds-int-visibility (downstream skill that consumes expressions.conditions)"
    - "ds-int-drilldowns (three-handler chain pattern referenced)"
    - "ds-ref-syntax (sibling reference skill; expressions stanza placement)"
tech_stack:
  added: []
  patterns:
    - "Gotchas-first SKILL.md organisation"
    - "Two-tier confidence markers [Confirmed] / [Standard JSONata]"
    - "Terse single-row function tables (signature + description + tier)"
    - "Recipe block: pure expression + full DS JSON wrapper"
key_files:
  created:
    - path: "plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md"
      lines: 497
      purpose: "Comprehensive JSONata reference for Dashboard Studio expressions.eval and expressions.conditions"
  modified: []
decisions:
  - "Used hybrid structure per D-03: gotchas first, then expressions stanza, then $eval:name$ reference, then conditions, then operators, then function categories, then recipes — matches spl-gotchas + ds-ref-syntax precedent"
  - "Two-tier confidence approach per RESEARCH.md D-01 compliance strategy: [Confirmed] for live-tested / official-example features, [Standard JSONata] for spec-based features expected to work"
  - "Omitted Tier 3 niche functions per RESEARCH.md: \\$base64*, \\$encodeUrl*, \\$formatBase, \\$parseInteger, \\$eval(), \\$error, \\$assert, \\$sift"
  - "Recipe block format simplified to one consolidated JSON snippet per recipe (not separate pure+wrapped blocks) to stay under 500-line limit"
  - "Trap 1 leads with a 7-row JSONata vs SPL eval comparison table — the single highest-frequency error per RESEARCH Pitfall 2"
  - "No emoji used per CLAUDE.md project guideline (replaced check/cross marks with Correct/Wrong text)"
metrics:
  duration_minutes: ~12
  tasks_completed: 1
  tasks_total: 1
  completed_date: "2026-05-23"
  start_time_utc: "2026-05-23T13:30:00Z"
  end_time_utc: "2026-05-23T13:42:06Z"
---

# Phase 38 Plan 01: JSONata reference SKILL summary

Created the `ds-ref-jsonata` skill — a 497-line gotchas-first JSONata
reference scoped to Splunk Dashboard Studio `expressions.eval` and
`expressions.conditions` stanzas. Lands the new reference file that
plan 38-02 will then link from `ds-int-tokens` via a MUST LOAD
directive.

## What was built

A single SKILL.md at
`plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` with
13 top-level sections in this order:

1. **Gotchas and limitations (read first)** — 8 traps led by the
   highest-frequency error (JSONata vs SPL eval). Each trap is one
   short paragraph plus a code or table example.
2. **The `expressions` stanza** — JSON schema for both `eval` and
   `conditions`, key points, and the version requirements matrix.
3. **`$eval:name$` reference syntax** — consolidated works/fails
   matrix (markdown / SPL / input labels / panel titles / option
   values / setToken vs timerange defaultValue / linkToDashboard
   tokens).
4. **Conditions syntax** — operators table, three example
   conditions, cross-reference to `ds-int-visibility` for wiring.
5. **Operators (eval expressions)** — 12-row table with tier
   markers.
6. **String functions** — 15-row table.
7. **Numeric functions** — 10-row table.
8. **Date/time functions** — 4-row function table plus 11-row
   XPath picture-format token table for `$now()`.
9. **Aggregation and boolean functions** — 8-row table.
10. **Array functions** — 7-row table.
11. **Higher-order functions** — 4-row table plus lambda-syntax
    explainer.
12. **Common recipes** — 6 recipes: RAG threshold coloring,
    dynamic label/title, toggle visibility, time arithmetic
    (epoch ± seconds), conditional formatting, multi-token
    aggregation. Each recipe shows pure JSONata plus full DS JSON
    wrapper.
13. **See also** — cross-references to ds-int-tokens,
    ds-int-visibility, ds-int-drilldowns, ds-ref-syntax,
    ds-int-defaults, and the JSONata official docs.

## How it satisfies acceptance criteria

| Criterion | Result |
| --- | --- |
| File exists at `plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` | PASS |
| Line count between 300 and 499 | PASS (497) |
| YAML frontmatter has `name: ds-ref-jsonata` and description with trigger keywords | PASS |
| Gotchas section appears before any function documentation | PASS (line 24 vs string functions at line 226) |
| Keyword grep `\$now\|\$substring\|\$map\|ternary\|lambda\|conditions` returns >= 5 | PASS (27 hits) |
| Both `expressions.eval` and `expressions.conditions` appear in the file | PASS |
| `[Confirmed]` and `[Standard JSONata]` tier markers are present | PASS |
| Common recipes section contains at least 5 recipes | PASS (6) |
| No SPL eval syntax appears as recommended usage | PASS (`strftime(`, `if(`, `.` for concat only appear in the "WRONG" column of the Trap 1 comparison table) |

## Verification checks (from plan)

| Command | Result |
| --- | --- |
| `test -f plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` | exit 0 |
| `wc -l` | 497 (< 500) |
| `grep -c 'Confirmed\|Standard JSONata'` | 11 (>= 2) |
| `grep -c 'expressions.eval\|expressions.conditions'` | 11 (>= 2) |

## Deviations from Plan

None. Plan executed exactly as written. A few notes on plan-internal
choices:

- The plan's action block prescribed two separate code blocks per
  recipe ("pure JSONata AND full Dashboard Studio JSON context
  wrappers"). I implemented this as one prose line showing the pure
  expression plus one JSON code block showing the DS wrapper — both
  formats are present, just consolidated for line-budget reasons.
  This stayed within plan intent (D-05) while keeping the file under
  500 lines.
- The plan's bullet 12 listed RAG, dynamic label, toggle, time
  arithmetic, conditional formatting, multi-token aggregation —
  all six are present (Recipes 1-6 in that exact order).
- Trap 8 in the plan said "Token references are bare inside
  `conditions`". I expanded it to also apply to `eval` expression
  values, since the same rule holds there (verified against the
  official Splunk 10.4 working examples in ds-int-tokens lines
  248-282).

## Threat Flags

None. This is documentation-only content; no new attack surface,
network endpoints, auth paths, or schema changes introduced.
Threat model T-38-01 (Info Disclosure) accepted as planned — all
content is public Splunk/JSONata documentation.

## Auto-fixed issues

None. No bugs, missing critical functionality, or blocking issues
encountered during execution.

## Commits

| Task | Commit | Files |
| --- | --- | --- |
| 1 — Create ds-ref-jsonata/SKILL.md | `3f432dca` | `plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` |

## Self-Check: PASSED

- File exists at `plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` — confirmed via `test -f`
- Commit `3f432dca` exists in this worktree branch — confirmed via `git log --oneline`
- All 9 acceptance criteria and 4 verification commands pass — confirmed via grep / wc / test
