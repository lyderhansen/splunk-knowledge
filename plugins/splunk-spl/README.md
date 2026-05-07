# splunk-spl

A Claude Code / Cursor plugin for writing, reviewing, and debugging Splunk SPL (Search Processing Language).

**Version:** 1.1.0

## What it does

Two-layer SPL knowledge system:

1. **spl-gotchas** (eagerly loaded) — 23 silent-fail traps ranked by frequency + categorized command index with when-to-use descriptions for all ~140 SPL commands
2. **reference/*.md** (lazy loaded) — 152 per-command deep reference files sourced from Splunk 10.2

## Skills

```
skills/
  spl-init             entry point · routes to gotchas or per-command reference
  spl-gotchas          traps + index · 23 silent-fail traps, categorized command table

reference/
  stats.md             per-command reference (152 files)
  eval.md
  where.md
  ...
```

## Quick start

**Before writing ANY SPL, load `spl-gotchas`.** Top traps:

| # | Trap | What breaks |
|---|---|---|
| 1 | Unquoted multi-word values | `where status=Not Found` → syntax error |
| 2 | `case()` without default | Returns NULL, downstream stats vanish |
| 5 | `sort` default 10K limit | Silently truncates large results |
| 10 | String literal vs field name | `"value"` (literal) vs `value` (field) |
| 22 | `tostring()` format arg | Only `hex`/`commas`/`duration` — not number patterns |
| 23 | `strftime` on `_time` | Kills chart x-axis — only use in tables |

## Cross-plugin usage

| Plugin | Skill | How |
|---|---|---|
| `splunk-dashboard-studio` | `ds-create` | SPL in dashboard data sources |
| `splunk-viz-packs` | `vp-create` | SPL in savedsearches.conf + dashboard JSON |
| `FAKE_DATA` | `fd-add-generator` | SPL in props.conf transforms |
