---
name: ds-spl
description: DEPRECATED — SPL reference has moved to the splunk-spl plugin. Install it and use spl-gotchas instead. This stub remains for backwards compatibility.
---

# ds-spl — MOVED to splunk-spl plugin

SPL reference is now in the **splunk-spl** plugin (separate install).

- **Gotchas + command index:** `spl-gotchas` skill (21 traps + 151-command categorized index)
- **Per-command deep reference:** `splunk-spl/reference/<command>.md` (149 files)

Install the plugin: add `splunk-spl` from the splunk-knowledge marketplace.

## Quick reference (if splunk-spl is not installed)

The most common SPL traps — load `spl-gotchas` for the full list:

1. `spath` uses `output=` not `as`
2. `case()` default: `1==1, "val"` not `true() = "val"`
3. Dotted fields need single quotes in eval/where: `'field.name'`
4. `sort` default limit is 10000 — use `sort 0`
5. `matchValue` for string-equality DOS, `rangeValue` for numeric ranges
6. `!=` in search returns nulls — use `where`
7. `timechart` limit=10 hides series — use `limit=0 useother=f`
8. `first()`/`last()` are NOT time-ordered — use `earliest()`/`latest()`
9. `join` default max is 50000 — use `max=0`
10. `"field"` in eval is a string literal, not a field reference
