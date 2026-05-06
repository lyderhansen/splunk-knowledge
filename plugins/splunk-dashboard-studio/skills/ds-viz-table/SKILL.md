---
name: ds-viz-table
description: Splunk Dashboard Studio splunk.table visualization — rows and columns workhorse for detail data, alert lists, service inventories, and heatmaps. Provides patterns for severity row-tinting via _color_rank, three sparkline-colouring strategies (per-row by index, per-column, per-row by threshold), pagination, and column-level formatting. Use when the user asks about tables, heatmaps, sparkline tables, alert queues, severity rows, or row colouring in Splunk Dashboard Studio.
---

# splunk.table — rows and columns

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_table_dark` / `ds_viz_table_light`.

The go-to viz for detail data, recent-alerts lists, service
inventories, top-N rankings, and heatmaps.

## When to use

- Message is "show me the rows" — compare values across multiple
  fields, scan for outliers, drill into individual records.

## When NOT to use

| Decision | Use instead |
|---|---|
| Single number is hero | `splunk.singlevalue` / `splunk.singlevalueradial` |
| Distribution / trend | `splunk.line` / `splunk.area` / `splunk.column` |
| Raw event payloads | `splunk.events` (preserves `_raw`, supports field actions) |
| Time-ordered records as chart | `splunk.timeline` |

## Quick start

```json
{
  "type": "splunk.table",
  "title": "Recent alerts",
  "dataSources": { "primary": "ds_alerts" },
  "options": {
    "count": 10,
    "headerVisibility": "fixed",
    "showInternalFields": false,
    "tableFormat": {
      "rowBackgroundColors": "> table | seriesByName('_color_rank') | rangeValue(rowBg)",
      "rowColors":           "> table | seriesByName('_color_rank') | rangeValue(rowFg)"
    }
  },
  "context": {
    "rowBg": [...],
    "rowFg": [...]
  }
}
```

## Three formatting tiers

| Tier | Where | Scope |
|---|---|---|
| **Global** | `options.*` | Whole panel: chrome, count, font, headerVisibility |
| **tableFormat** | `options.tableFormat.*` | Whole table: align grid, row colours, header colours, sparklines |
| **columnFormat** | `options.columnFormat.<fieldName>.*` | Single column: width, align, cell type |

DOS expressions reference `tableFormat` arrays via `seriesByName('field')` and resolve through bands declared in `context`.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Heatmap rows:** compute `_color_rank` upstream + `showInternalFields: false` to hide it. | Forget `showInternalFields: false` — `_color_rank` leaks into rendered output. |
| **Threshold bands:** use **half-step** thresholds (`1.5`, `2.5`) so integer ranks land cleanly inside one band. | Use overlapping or boundary-aligned thresholds — ranks land in the wrong bucket. |
| **Sparklines:** generate via `\| stats sparkline(avg(metric), 30m) by host`. | Use `\| eval x="1,2,3" \| makemv` — only first row gets typed as mv; rows 2..N degrade silently. |
| **Sparkline density:** spread synthetic events across the dashboard time window. | Pile synthetic events into recent minutes — `mvcount` returns 3 (marker + value + 0), and Splunk ignores `sparklineColors`. |
| **Per-column sparkline colour:** ONLY via `columnFormat.<col>.sparklineColors: ["#hex"]`. | Try to use `tableFormat.sparklineColors` for per-column — that distributes per **row**, not per column. |
| **Per-row sparkline colour:** `tableFormat.sparklineColors: "> table \| pick(arr)"` (by index) OR `\| rangeValue(bands)` (by threshold). | Hand-author 2D arrays for row-count-driven dashboards — they're brittle. |
| **Header theming:** don't set `headerBackgroundColor` / `headerColor` at all — defaults track theme. | Hardcode `#0B0C0E` as header colour — unreadable in light theme. |
| **Hide `_time`:** `| fields - _time` in SPL. | Expect `showInternalFields: false` to hide `_time` — it's exempt. |
| **dataSource names:** stick to `[A-Za-z0-9 -_.]`. | Use slashes, parentheses, `/` — picker breaks even though JSON parses. |

## See also

- [PATTERNS.md](PATTERNS.md) — 12 verified patterns: default,
  pagination, monospace, heatmap, sparkline-colour 8a/8b/8c, executive,
  type-driven align.
- [OPTIONS.md](OPTIONS.md) — global / tableFormat / columnFormat tiers.
- [GOTCHAS.md](GOTCHAS.md) — `_color_rank` leak, sparkline mv detection,
  header theming, name regex.
- [SPARKLINE-DATA.md](SPARKLINE-DATA.md) — SPL recipe for true
  multivalue sparkline columns; the canonical 288-bucket pattern.
- `ds-viz-events` — raw `_raw` event payloads.
- `ds-viz-timeline` — time-ordered records as chart.
- `ds-ref-design-principles` — heatmap and severity colour conventions.
