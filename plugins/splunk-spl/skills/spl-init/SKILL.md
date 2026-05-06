---
name: spl-init
description: "Entry point for the splunk-spl plugin. Routes to the right SPL resource based on intent: spl-gotchas for trap avoidance and command index, or per-command reference files for full syntax. Use when the user says 'write SPL', 'debug this search', 'which command for X', or invokes splunk-spl without a specific skill."
---

# spl-init — Entry point for SPL reference

## What this plugin does

Two-layer SPL knowledge system for writing, reviewing, and debugging
Splunk Search Processing Language:

1. **spl-gotchas** (eagerly loaded) — 23 silent-fail traps ranked by
   frequency + categorized command index with when-to-use descriptions
2. **reference/*.md** (lazy loaded) — per-command deep reference for
   all ~152 SPL commands, read on demand

## Routing table

| User says | Route to | Why |
|---|---|---|
| "Write a search for X" | `spl-gotchas` first, then write | Traps prevent silent failures |
| "Debug this SPL" | `spl-gotchas` trap list | Match symptoms to known traps |
| "Which command for X?" | `spl-gotchas` command index | Categorized with when-to-use |
| "Full syntax for `stats`" | `reference/stats.md` | Deep reference per command |
| "What args does `tostring` take?" | `reference/eval.md` | Function docs in eval reference |
| "Review my dashboard SPL" | `spl-gotchas` + write review | Check all queries against traps |

## Quick start

**Before writing ANY SPL, load `spl-gotchas`.** It contains the top 23
traps that cause searches to silently return wrong results with no
error message. The most common:

| # | Trap | What breaks |
|---|---|---|
| 1 | Unquoted multi-word field values | `where status=Not Found` → syntax error |
| 2 | `case()` without default | Returns NULL, downstream stats vanish |
| 5 | `sort` default 10K limit | Silently truncates large result sets |
| 10 | String literal vs field name | `"value"` (literal) vs `value` (field) |
| 22 | `tostring()` format arg | Only `hex`/`commas`/`duration` — not number patterns |
| 23 | `strftime` on `_time` | Kills chart x-axis — only use in tables |

## Per-command reference

For full syntax on any command, read the reference file:

```
plugins/splunk-spl/reference/<command>.md
```

152 command reference files covering every SPL command from Splunk
10.2. Each file contains: syntax, arguments, examples, gotchas,
and related commands.

## Cross-plugin usage

This plugin is consumed by:

| Plugin | Skill | How |
|---|---|---|
| `splunk-dashboard-studio` | `ds-create` | SPL in dashboard data sources |
| `splunk-viz-packs` | `vp-create` | SPL in savedsearches.conf + dashboard JSON |
| `FAKE_DATA` | `fd-add-generator` | SPL in props.conf transforms |

**Rule:** Any skill that writes SPL MUST load `spl-gotchas` first.

## What this skill does NOT do

This is a router. It does not write SPL or debug searches.

| Task | Resource |
|---|---|
| Trap avoidance + command index | `spl-gotchas` |
| Full command syntax | `reference/<command>.md` |
| Dashboard SPL patterns | `ds-create` (from `splunk-dashboard-studio`) |
| Makeresults test data | `ds-mock` (from `splunk-dashboard-studio`) |
