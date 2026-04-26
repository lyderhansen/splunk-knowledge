---
name: ds-viz-table
description: |
  splunk.table - rows and columns. The workhorse viz for showing detail data, alert lists,
  service inventories, and heatmaps. Three layered formatting tiers: global chrome (count,
  font, headers, backgroundColor), tableFormat (whole-table effects, sparklines, row tinting),
  and columnFormat (per-column overrides). Heatmap row-shading uses _color_rank + DOS.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_table_dark
  - ds_viz_table_light
---

# splunk.table

Rows and columns. The go-to viz for detail data, recent-alerts lists, service inventories, top-N rankings, and heatmaps.

## When to use it

Pick `splunk.table` when the **message is "show me the rows"** - the user needs to compare values across multiple fields, scan for outliers, or drill into individual records.

Pick something else when:

| Decision               | Use instead                                                  |
| ---------------------- | ------------------------------------------------------------ |
| Single number is hero  | `splunk.singlevalue` / `splunk.singlevalueradial`            |
| Distribution/trend     | `splunk.line` / `splunk.area` / `splunk.column`              |
| Raw event payloads     | `splunk.events` (preserves _raw, supports field actions)     |
| Time-ordered records   | `splunk.timeline`                                            |

## Data shape

A standard table-shaped result. Field types are inferred for default alignment (numbers right, strings left).

```spl
| makeresults count=5
| streamstats count AS rn
| eval host = case(rn==1,"web-01", rn==2,"web-02", 1==1,"db-01")
| eval cpu = case(rn==1,94, rn==2,82, 1==1,33)
| table host cpu
```

For row-tinting, compute a numeric **rank field** upstream (convention: `_color_rank`) and **always pair it with `showInternalFields: false`** so the rank is hidden from the rendered output.

## Three formatting tiers

`splunk.table` exposes options at three levels - know which tier you're working at before tweaking:

| Tier             | Where             | Scope                                              |
| ---------------- | ----------------- | -------------------------------------------------- |
| **Global**       | `options.*`       | Whole panel: chrome, count, font, headerVisibility |
| **tableFormat**  | `options.tableFormat.*` | Whole table: align grid, row colours, header colours, sparklines |
| **columnFormat** | `options.columnFormat.<fieldName>.*` | Single column: width, align, cell type |

DOS expressions reference `tableFormat` arrays via `seriesByName('field')` and resolve through bands declared in `context`.

## Global options (chrome)

| Option                | Type    | Default      | Notes                                               |
| --------------------- | ------- | ------------ | --------------------------------------------------- |
| `backgroundColor`     | string  | theme        | Cell-area tint (different from panel chrome)        |
| `count`               | number  | 10           | Visible rows; paginator handles overflow            |
| `font`                | enum    | proportional | `proportional` \| `monospace`                       |
| `fontSize`            | enum    | default      | `extraSmall` (10) \| `small` (12) \| `default` (14) \| `large` (16) |
| `headerVisibility`    | enum    | inline       | `none` \| `fixed` \| `inline`                       |
| `paginateDataSourceKey` | string  | -          | Server-side pagination key                         |
| `showInternalFields`  | boolean | true         | **Set to `false` when using `_color_rank`**         |
| `showRowNumbers`      | boolean | false        | Prepends a 1-indexed row number column              |
| `headers`             | array   | -            | Custom header labels (override field names)         |
| `table`               | object  | -            | Reserved (advanced)                                 |

> **`_time` is exempt** from `showInternalFields: false` - it stays visible.

## tableFormat options (whole-table)

All take 2D arrays (row × column) when set statically, or DOS expressions:

| Option                  | Notes                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `align`                 | Per-cell alignment (`left` / `center` / `right`)                 |
| `cellTypes`             | Per-cell renderer: `TextCell` \| `ArrayCell` \| `SparklineCell`  |
| `data`                  | Per-cell formatted text override                                 |
| `headerBackgroundColor` | Header chrome (single hex)                                       |
| `headerColor`           | Header text                                                      |
| `rowBackgroundColors`   | Row tint - **the heatmap pattern**                               |
| `rowColors`             | Row text colour                                                  |
| `sparklineAreaColors`   | Fill colour for area sparklines                                  |
| `sparklineColors`       | Stroke colour for sparklines                                     |
| `sparklineTypes`        | `line` \| `area`                                                 |

## columnFormat options (per-column)

Keyed by field name. Same shape as `tableFormat` but **1D arrays** (only the column's cells), plus:

- `width` - pixel width

```json
"columnFormat": {
  "host":  { "width": 140 },
  "trend": { "cellTypes": ["SparklineCell"], "sparklineColors": ["#33FF99"], "sparklineTypes": ["area"] }
}
```

## Verified patterns (from test-dashboard)

| # | Pattern                                                | Key options                                           |
| - | ------------------------------------------------------ | ----------------------------------------------------- |
| 1 | Default                                                | (no options)                                          |
| 2 | Pagination + fixed header + row numbers                | `count: 3`, `headerVisibility: fixed`, `showRowNumbers: true` |
| 3 | Hide internal fields                                   | `showInternalFields: false`                           |
| 4 | Monospace small                                        | `font: monospace`, `fontSize: small`                  |
| 5 | Per-column align + width                               | `columnFormat.<field>.width`                          |
| 6 | Static header colours                                  | `tableFormat.headerBackgroundColor` + `headerColor`   |
| 7 | **Heatmap rows via `_color_rank` + `rangeValue`**      | DOS `rowBackgroundColors` and `rowColors`             |
| 8 | Inline sparkline column                                | `columnFormat.<field>.cellTypes: ["SparklineCell"]`   |
| 9 | Stripped-down KPI table                                | `count: 1`, `headerVisibility: none`                  |
| 10 | Cell-area tint                                         | `backgroundColor` + matching header colours           |
| 11 | Executive-readable                                     | `fontSize: large`, `headerVisibility: fixed`          |
| 12 | Type-driven align                                      | `tableFormat.align: > table \| type() \| matchValue(...)` |

## Heatmap pattern (the canonical recipe)

User-confirmed pattern for severity-based row tinting:

```spl
| makeresults count=5
| streamstats count AS rn
| eval severity = case(rn==1,"critical", rn==2,"high", 1==1,"info")
| eval _color_rank = case(severity=="critical",1, severity=="high",2, 1==1,5)
| table service severity errors_per_min _color_rank
```

```json
{
  "type": "splunk.table",
  "dataSources": { "primary": "ds_heatmap" },
  "options": {
    "showInternalFields": false,
    "tableFormat": {
      "rowBackgroundColors": "> table | seriesByName('_color_rank') | rangeValue(rowBg)",
      "rowColors":           "> table | seriesByName('_color_rank') | rangeValue(rowFg)"
    }
  },
  "context": {
    "rowBg": [
      { "to": 1.5,             "value": "#4a1722" },
      { "from": 1.5, "to": 2.5,"value": "#4a2d17" },
      { "from": 2.5, "to": 3.5,"value": "#45391a" },
      { "from": 3.5, "to": 4.5,"value": "#173d2b" },
      { "from": 4.5,           "value": "#151B3A" }
    ],
    "rowFg": [
      { "to": 4.5,   "value": "#FFFFFF" },
      { "from": 4.5, "value": "#A8A8B3" }
    ]
  }
}
```

Three rules:
1. Use **half-step thresholds** (`1.5`, `2.5`) so integer ranks land cleanly inside one band.
2. **`showInternalFields: false`** is mandatory to hide the `_color_rank` field.
3. Pair `rowBackgroundColors` and `rowColors` so text contrasts against the tint.

## Sparkline pattern

```spl
| eval trend = mvappend("60","72","81","88","94")
```

```json
"columnFormat": {
  "trend": {
    "cellTypes":      ["SparklineCell"],
    "sparklineColors":["#33FF99"],
    "sparklineTypes": ["area"],
    "width": 200
  }
}
```

The trend column must be a multivalue array of numeric strings.

## Gotchas

- **`showInternalFields: true` by default** - your `_color_rank` rank field will leak into the rendered table unless you flip it.
- **`_time` is special** - it stays visible even with `showInternalFields: false`. To hide it, exclude in SPL with `| fields - _time`.
- **`tableFormat.align` is 2D**, **`columnFormat.<col>.align` is 1D** - they're not interchangeable.
- **`headerBackgroundColor` is a single hex**, not an array. It applies to the whole header row.
- **`backgroundColor` on the table** is different from the panel chrome - it tints only the cell area.
- **Pagination** (`paginateDataSourceKey`) requires a paginated data source - it's not a UI control, it's a contract with the SPL backend.

## Cross-references

- [`ds-viz-events`](../ds-viz-events/SKILL.md) - for raw `_raw` event payloads
- [`ds-viz-timeline`](../ds-viz-timeline/SKILL.md) - for time-ordered records
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - heatmap and severity colour conventions
