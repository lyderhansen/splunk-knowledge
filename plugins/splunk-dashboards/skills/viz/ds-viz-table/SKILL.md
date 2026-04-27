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

Keyed by field name. Same shape as `tableFormat` but **1D arrays where each element = one row**, plus:

- `width` - pixel width

```json
"columnFormat": {
  "host":  { "width": 140 },
  "trend": {
    "sparklineColors": ["#33FF99", "#33FF99", "#33FF99", "#33FF99"],
    "sparklineTypes":  ["area",    "area",    "area",    "area"],
    "width": 200
  }
}
```

> **Each array element styles ONE row.** If your table has 4 rows you must pass 4 colours. This is per the official Splunk schema:
> - `tableFormat.sparklineColors` is `string[][]` (outer = rows, inner = series within a multivalue cell).
> - `columnFormat.<col>.sparklineColors` is `string[]` (each entry = one row of that column).
>
> Passing a single-element `["#33FF99"]` only colours **row 1** - rows 2..N silently fall back to the default series colour. This is the most common reason a sparkline column "looks wrong from row 2 down".

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
| 8 | Inline sparkline columns (per-host trend)              | `stats sparkline(...) by host` + `columnFormat.<field>.sparklineTypes` (no explicit `cellTypes`) |
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

## Sparkline pattern (canonical)

The trend column **must be a true multivalue field with enough datapoints to plot**. Two failures are indistinguishable visually but have different fixes:

1. *Wrong shape* - using `eval x="a,b,c" | makemv x`. Result: row 1 looks like a sparkline, rows 2..N show as text. See the anti-pattern below.
2. *Right shape, not enough data* - using `stats sparkline()` over a synthetic dataset that doesn't span the dashboard's time window. Result: row 1 has a coloured line, rows 2..N have a flat default-colour line. This looks like a "colour bug" but is actually a "data bug".

The reliable recipe:

```spl
| makeresults count=288
| streamstats count AS rn
| eval _time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")
| eval host = case((rn-1) % 4 == 0, "web-01", (rn-1) % 4 == 1, "web-02", (rn-1) % 4 == 2, "db-01", 1==1, "app-03")
| eval cpu  = case(host=="web-01",75,host=="web-02",55,host=="db-01",45,1==1,28) + (rn % 25) - 12
| eval mem  = case(host=="web-01",68,host=="web-02",50,host=="db-01",72,1==1,32) + (rn % 18) - 8
| eval req  = case(host=="web-01",1400,host=="web-02",640,host=="db-01",240,1==1,80) + (rn % 80)*4 - 160
| eval err  = case(host=="web-01",18,host=="web-02",4,host=="db-01",2,1==1,1) + (rn % 7) - 3
| stats latest(cpu)              AS current_cpu,
        sparkline(avg(cpu), 30m) AS trend_cpu,
        sparkline(avg(mem), 30m) AS trend_mem,
        sparkline(sum(req), 30m) AS trend_req,
        sparkline(sum(err), 30m) AS trend_err
   by host
```

Why these numbers?
- `count=288` × `5m` = 24 hours, matching `defaults.dataSources.global.queryParameters.earliest = "-24h@h"`. If your dashboard uses a different time window, scale `count` accordingly (e.g. `count=144` for `-12h`, `count=576` for `-48h`).
- `_time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")` actually spreads the synthetic events across that window. Without the `*5` you get all events crammed into the last 240 minutes.
- `sparkline(avg(metric), 30m)` produces ~48 buckets across 24 hours, more than enough for a smooth line.
- Verify with `| eval mv = mvcount(trend_cpu)` - you want **>=20 elements per row**, not 3.

```json
"columnFormat": {
  "host":        { "width": 130 },
  "current_cpu": { "width": 110 },
  "trend_cpu": {
    "sparklineTypes":  ["area", "area", "area", "area"],
    "sparklineColors": ["#33FF99", "#33FF99", "#33FF99", "#33FF99"],
    "width": 200
  },
  "trend_mem": {
    "sparklineTypes":  ["line", "line", "line", "line"],
    "sparklineColors": ["#7AA2FF", "#7AA2FF", "#7AA2FF", "#7AA2FF"],
    "width": 200
  },
  "trend_req": {
    "sparklineTypes":  ["area", "area", "area", "area"],
    "sparklineColors": ["#FFB627", "#FFB627", "#FFB627", "#FFB627"],
    "width": 220
  },
  "trend_err": {
    "sparklineTypes":  ["line", "line", "line", "line"],
    "sparklineColors": ["#FF2D95", "#FF2D95", "#FF2D95", "#FF2D95"],
    "width": 200
  }
}
```

> **One colour and one type per row.** With 4 hosts you need 4 entries. If your row count is dynamic, prefer `tableFormat.sparklineColors` with a DOS expression (e.g. `> table | seriesByName('host') | matchValue(hostColours)`) so each row gets a colour driven by data, not a hard-coded array.

The default global `tableFormat.cellTypes` DOS expression auto-resolves multivalue numeric columns to `SparklineCell`. Only set `columnFormat.<col>.cellTypes` explicitly if you need to force a different renderer (e.g. `TextCell` to show the underlying mv list).

### Anti-pattern: faking mv with `makemv`

A pattern that **does not work** and silently degrades to "only the first row renders":

```spl
| eval trend_cpu = "60,72,81,88,94"
| makemv tokenizer="(\d+)" trend_cpu     ❌ only the first row gets typed as mv
```

Or the variant using `delim`:

```spl
| eval trend_cpu = "60,72,81,88,94"
| makemv delim="," trend_cpu              ❌ same problem; only row 1 renders
```

`makemv` operates row-by-row in a way that the table renderer's mv detector only picks up reliably on the first row of stats output. The first row paints as a sparkline; rows 2..N stay as plain comma-strings or empty. This is the most common reason a "sparkline column only renders on `web-01`" - it isn't a colour-mapping bug, it's that rows 2..N are not actually mv.

**Fix**: replace the `eval | makemv` pair with `stats sparkline(...) by <key>`. Drop any `columnFormat.<col>.cellTypes: ["SparklineCell"]` you may have added - the default DOS auto-detects.

### `sparklineTypes` enum

`area` and `line` only. There is **no `bar` sparkline**. If you need bar-shaped inline trends, render a tiny `splunk.column` viz inside a layout cell instead.

## Gotchas

- **`showInternalFields: true` by default** - your `_color_rank` rank field will leak into the rendered table unless you flip it.
- **`_time` is special** - it stays visible even with `showInternalFields: false`. To hide it, exclude in SPL with `| fields - _time`.
- **`tableFormat.align` is 2D**, **`columnFormat.<col>.align` is 1D** - they're not interchangeable.
- **`headerBackgroundColor` is a single hex**, not an array. It applies to the whole header row.
- **Theme-default headers**: if you want the header to track theme (white-on-light, dark-on-dark), **don't set `headerBackgroundColor` / `headerColor` at all**. The defaults resolve through `themes.defaultHeaderBackgroundColor` per theme. Hardcoding `#0B0C0E` makes the header unreadable in light theme.
- **`backgroundColor` on the table** is different from the panel chrome - it tints only the cell area.
- **Pagination** (`paginateDataSourceKey`) requires a paginated data source - it's not a UI control, it's a contract with the SPL backend.
- **`dataSource.name` regex**: the Dashboard Studio editor enforces `^[A-Za-z0-9 \-_.]+$`. **Slashes, parentheses, and `/` will trip the picker** even though the JSON parses fine. Stick to letters, digits, spaces, dashes, underscores, periods. Example - `"sparkline - hosts with cpu/mem trends"` ❌ → `"sparkline - hosts with cpu mem trends"` ✅.
- **SparklineCell only auto-detects mv columns produced by `stats sparkline()` (or equivalents like `mvexpand`-then-stats).** A column built with `eval x = "1,2,3" | makemv ...` is not a true mv column for the table - row 1 renders, rows 2..N do not. See the anti-pattern above.
- **`columnFormat.<col>.sparklineColors` and `sparklineTypes` are per-row arrays, not per-series.** Schema is `string[]` where index `i` = row `i`. With 4 rows you pass 4 entries: `["#33FF99","#33FF99","#33FF99","#33FF99"]`. Passing one entry only styles row 1 and rows 2..N quietly fall back to the default series colour. For dynamic row counts, prefer `tableFormat.sparklineColors` with a DOS expression keyed off the grouping field.
- **"Only row 1 has a coloured sparkline" is almost always a data-density problem, not a styling problem.** The renderer needs enough non-zero datapoints across the dashboard time window before it commits to your `sparklineColors`. Test SPL: `| eval mv = mvcount(trend_cpu)` - if you see 3 elements per row (one of which is the `##__SPARKLINE__##` marker and one is `0`), you have effectively one datapoint per host and Splunk will not honour your colour override. The fix is to widen the synthetic time range to match the dashboard's `earliest..latest`. With `defaults.dataSources.global.queryParameters.earliest = "-24h@h"` you need ~288 events at 5-minute spacing (`| makeresults count=288 | eval _time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")`), then `sparkline(avg(metric), 30m)` produces ~51 real datapoints per row. Few-data symptoms are indistinguishable from "wrong colour array length" so check the data first with `mvcount`.

## Cross-references

- [`ds-viz-events`](../ds-viz-events/SKILL.md) - for raw `_raw` event payloads
- [`ds-viz-timeline`](../ds-viz-timeline/SKILL.md) - for time-ordered records
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - heatmap and severity colour conventions
