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

Keyed by field name. Per-column overrides for cell-level concerns:

- `width` - pixel width
- `align` - `left` \| `center` \| `right`
- `cellTypes` - force a specific renderer for this column
- `sparklineColors`, `sparklineTypes` - **per the docs, `string[]` "list of colors / sparkline types for the sparkline stroke of each column"**
- `rowBackgroundColors`, `rowColors` - row-tinting limited to this column

```json
"columnFormat": {
  "host":  { "width": 140 },
  "trend_cpu": {
    "sparklineColors": ["#33FF99"],
    "sparklineTypes":  ["area"],
    "width": 200
  }
}
```

### The three sparkline-colouring patterns

Sparkline colour can be distributed three different ways. They are mutually exclusive — pick the one that matches the **semantic** you want. There is **no** built-in pattern that gives "one colour per sparkline column via `tableFormat`"; per-column colouring is the job of `columnFormat`.

| Pattern | Where | Distribution semantic | Empirical behaviour | Use when |
| --- | --- | --- | --- | --- |
| **8a. `tableFormat.sparklineColors` via DOS `pick()`** | `options.tableFormat.sparklineColors: "> table \| pick(myColours)"` with a 1D array `myColours` in `context` | **Per row, by row index.** Row 0 → colour 0, row 1 → colour 1, … (cycles back if array shorter than row count) | Confirmed: 3 colours over 4 rows → row 4 reuses colour 0. **All sparkline columns in the same row share the same colour.** | Colour should track row identity (per host, per severity, per region) |
| **8b. `columnFormat.<col>.sparklineColors`** | `options.columnFormat.<fieldName>.sparklineColors: ["#33FF99"]` (one entry per sparkline column) | **Per column, single colour for all rows.** Every row in `trend_cpu` paints with `#33FF99`. | Confirmed: 1D array, one entry per column, applied uniformly to all rows of that column. | Colour should track field identity (CPU=green, MEM=blue, REQ=orange, ERR=pink) |
| **8c. `tableFormat.sparklineColors` via DOS `rangeValue()`** | `options.tableFormat.sparklineColors: "> table \| seriesByName('current_cpu') \| rangeValue(bands)"` with threshold bands in `context` | **Per row, threshold-driven.** Same shape as 8a but the colour is computed from a numeric series (e.g. `current_cpu`) instead of row index. | Confirmed: each row's sparklines turn green/yellow/orange/red based on its CPU bucket. | Colour should encode severity (the heatmap pattern, applied to sparkline strokes) |

> **Why does `tableFormat.sparklineColors` live "per row" even though Splunk's official docs type it as `string[][]`?**  
> The official type is two-dimensional (outer array = row, inner array = one colour per sparkline-series within that row), but in practice every documented production example uses **DOS expressions** (`pick()`, `rangeValue()`, `seriesByName()`) that resolve to a 1D-per-row shape. The 1D context arrays in 8a / 8c are correct — they describe "a colour per row" and the renderer wraps each one into its inner-array slot internally. **Hand-authored 2D arrays do work, but offer no advantage over the DOS form and become very brittle when the row count is data-driven.**

#### Example — per-row by index (8a)

```json
{
  "options": {
    "tableFormat": {
      "sparklineColors": "> table | pick(trendSparklineColors)",
      "sparklineTypes":  "> table | pick(trendSparklineTypes)"
    }
  },
  "context": {
    "trendSparklineColors": ["#33FF99", "#7AA2FF", "#FFB627", "#FF2D95"],
    "trendSparklineTypes":  ["area",    "line",    "area",    "line"]
  }
}
```

Row 0's sparklines all paint green (`#33FF99`), row 1's all paint blue, etc. **Inside one row the four sparkline columns share the same colour.** If you only declare 3 colours, row 4 wraps to colour 0.

#### Example — per-column (8b)

```json
{
  "options": {
    "columnFormat": {
      "trend_cpu": { "sparklineColors": ["#33FF99"], "sparklineTypes": ["area"], "width": 220 },
      "trend_mem": { "sparklineColors": ["#7AA2FF"], "sparklineTypes": ["line"], "width": 220 },
      "trend_req": { "sparklineColors": ["#FFB627"], "sparklineTypes": ["area"], "width": 220 },
      "trend_err": { "sparklineColors": ["#FF2D95"], "sparklineTypes": ["line"], "width": 220 }
    }
  }
}
```

Every row's `trend_cpu` is green, every row's `trend_mem` is blue, etc. **Within one column all rows share the same colour.** This is the **only** way to get per-column colouring — `tableFormat` cannot do it.

#### Example — per-row, threshold-driven (8c, the heatmap-strokes pattern)

```json
{
  "options": {
    "tableFormat": {
      "sparklineColors": "> table | seriesByName('current_cpu') | rangeValue(cpuBands)",
      "sparklineTypes":  "> table | seriesByName('current_cpu') | rangeValue(cpuTypes)"
    }
  },
  "context": {
    "cpuBands": [
      { "to": 50,             "value": "#33FF99" },
      { "from": 50, "to": 70, "value": "#FFD060" },
      { "from": 70, "to": 90, "value": "#FFB627" },
      { "from": 90,           "value": "#FF6B6B" }
    ],
    "cpuTypes": [
      { "to": 70,   "value": "line" },
      { "from": 70, "value": "area" }
    ]
  }
}
```

Same expression shape as the row-tinting heatmap (panel 7) — `seriesByName(...)` reads a numeric column, `rangeValue(...)` resolves it to a colour from the bands. The result is per-row, but driven by the data instead of row order.

#### Want **per-row AND per-column** at the same time?

That's a 2D matrix and you need a hand-authored or DOS-computed `string[][]`:

```json
"sparklineColors": [
  ["#33FF99", "#7AA2FF", "#FFB627", "#FF2D95"],   // row 0: each sparkline its own colour
  ["#33FF99", "#7AA2FF", "#FFB627", "#FF2D95"],   // row 1: same pattern
  ["#FF6B6B", "#FF6B6B", "#FF6B6B", "#FF6B6B"]    // row 2: all red (e.g. severity escalation)
]
```

This is the most flexible shape but also the most brittle — the array must match the live row count. For row-count-driven dashboards, derive the matrix from a DOS expression like `> table | seriesByName('host') | matchValue(hostColours)` so the binding stays in sync with the data.

The test dashboard panel 8a, 8b, 8c demonstrate the three canonical patterns side-by-side so you can compare visually.

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
| 8a | Sparkline colour **per-row by index** via `tableFormat.sparklineColors` + DOS `pick()` | 1D context array, `> table \| pick(trendSparklineColors)` |
| 8b | Sparkline colour **per-column** via `columnFormat.<col>.sparklineColors` | One-element `["#hex"]` per sparkline column — **only** way to get per-column colouring |
| 8c | Sparkline colour **per-row by threshold** via `tableFormat.sparklineColors` + DOS `rangeValue()` | Heatmap-strokes pattern: `> table \| seriesByName('current_cpu') \| rangeValue(bands)` |
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

## Sparkline data shape (the SPL side)

Before you touch any styling, the sparkline columns must be **true multivalue fields with enough datapoints across the dashboard's time window**. Two failure modes look identical at a glance but have different fixes:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Row 1 paints as a sparkline; rows 2..N stay as comma-text or empty | Wrong shape — `eval x="1,2,3" \| makemv ...` only types row 1 as mv | Replace with `stats sparkline(...) by <key>` |
| Row 1 paints as a coloured sparkline; rows 2..N degrade to flat default-coloured lines | Right shape, not enough datapoints — synthetic data doesn't span `earliest..latest` | Widen the synthetic time range to match the dashboard window |

### Canonical SPL recipe

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
- `_time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")` actually spreads the synthetic events across that window. Without the `*5` multiplier you get all events crammed into the last 240 minutes and only the latest sparkline bucket has data.
- `sparkline(avg(metric), 30m)` produces ~48 buckets across 24 hours, more than enough for a smooth line.
- **Verify with `| eval mv = mvcount(trend_cpu)`** — you want **>=20 elements per row**, not 3. If you see 3 elements per row (the `##__SPARKLINE__##` marker plus one numeric plus a `0`), you have effectively one datapoint per host and Splunk will not honour your `sparklineColors`.

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

`makemv` operates row-by-row in a way that the table renderer's mv detector only picks up reliably on the first row of stats output. The first row paints as a sparkline; rows 2..N stay as plain comma-strings or empty. This is the most common reason a "sparkline column only renders on `web-01`" — it isn't a colour-mapping bug, it's that rows 2..N are not actually mv.

**Fix**: replace the `eval | makemv` pair with `stats sparkline(...) by <key>`. Drop any `columnFormat.<col>.cellTypes: ["SparklineCell"]` you may have added — the default DOS auto-detects.

### `sparklineTypes` enum

`area` and `line` only. There is **no `bar` sparkline**. If you need bar-shaped inline trends, render a tiny `splunk.column` viz inside a layout cell instead.

## Gotchas

- **`showInternalFields: true` by default** - your `_color_rank` rank field will leak into the rendered table unless you flip it.
- **`_time` is special** - it stays visible even with `showInternalFields: false`. To hide it, exclude in SPL with `| fields - _time`.
- **`tableFormat.align` is 2D, `columnFormat.<col>.align` is 1D** - they're not interchangeable.
- **`headerBackgroundColor` is a single hex**, not an array. It applies to the whole header row.
- **Theme-default headers**: if you want the header to track theme (white-on-light, dark-on-dark), **don't set `headerBackgroundColor` / `headerColor` at all**. The defaults resolve through `themes.defaultHeaderBackgroundColor` per theme. Hardcoding `#0B0C0E` makes the header unreadable in light theme.
- **`backgroundColor` on the table** is different from the panel chrome - it tints only the cell area.
- **Pagination** (`paginateDataSourceKey`) requires a paginated data source - it's not a UI control, it's a contract with the SPL backend.
- **`dataSource.name` regex**: the Dashboard Studio editor enforces `^[A-Za-z0-9 \-_.]+$`. **Slashes, parentheses, and `/` will trip the picker** even though the JSON parses fine. Stick to letters, digits, spaces, dashes, underscores, periods. Example - `"sparkline - hosts with cpu/mem trends"` ❌ → `"sparkline - hosts with cpu mem trends"` ✅.
- **SparklineCell only auto-detects mv columns produced by `stats sparkline()` (or equivalents like `mvexpand`-then-stats).** A column built with `eval x = "1,2,3" | makemv ...` is not a true mv column for the table — row 1 renders, rows 2..N do not. See the anti-pattern above.
- **`tableFormat.sparklineColors` cannot deliver per-column colouring.** Even though Splunk types it as `string[][]` and the docs say "Array of colors for sparkline line of **each row of the table**", the only practical shape used in production is a 1D context array fed through DOS `pick()` or `rangeValue()` — and that distributes colour **per row, not per column**. All sparkline columns in the same row paint the same colour. If you need per-column colouring (CPU=green, MEM=blue, REQ=orange, ERR=pink), you **must** use `columnFormat.<col>.sparklineColors`. There is no single-declaration `tableFormat` form that walks across the row's sparklines independently. Panels 8a, 8b, 8c in the test dashboard exist specifically to make this distribution semantic visible.
- **`columnFormat.<col>.sparklineColors` is `string[]` "list of colors for the sparkline stroke of each column"** — one colour applies to every row of that one column. A single-entry array (`["#33FF99"]`) is the canonical shape. The 1D array is for multi-series sparklines within a single mv cell, not "one entry per row". Round-3 of QA on this skill incorrectly duplicated colours 4× because we misread the schema; panel 8b is the verified-correct reference shape.
- **`tableFormat.sparklineColors` with DOS `pick()` from a 1D context array distributes colours per row by index.** Row 0 gets colour 0, row 1 gets colour 1, etc. If the array is shorter than the row count it cycles back to colour 0 (recycle). This is panel 8a's pattern. Use this when colour should track row identity (per host, per region).
- **`tableFormat.sparklineColors` with DOS `rangeValue()` distributes colours per row by threshold.** Same shape as 8a but the colour is computed from a numeric series via `rangeValue(bands)`. This is panel 8c's pattern — the heatmap-strokes form. Use this when colour should encode severity rather than row order. Same DOS expression that drives `rowBackgroundColors` in panel 7, applied to sparkline strokes.
- **"Only row 1 has a coloured sparkline" is almost always a data-density problem, not a styling problem.** The renderer needs enough non-zero datapoints across the dashboard time window before it commits to your `sparklineColors`. Test SPL: `| eval mv = mvcount(trend_cpu)` — if you see 3 elements per row (one is the `##__SPARKLINE__##` marker, one is a number, one is `0`), you have effectively one datapoint per host and Splunk will not honour your colour override. Fix is to widen the synthetic time range to match the dashboard's `earliest..latest`. With `defaults.dataSources.global.queryParameters.earliest = "-24h@h"` you need ~288 events at 5-minute spacing, then `sparkline(avg(metric), 30m)` produces ~51 real datapoints per row. Check data density with `mvcount` before touching `sparklineColors`.

## Cross-references

- [`ds-viz-events`](../ds-viz-events/SKILL.md) - for raw `_raw` event payloads
- [`ds-viz-timeline`](../ds-viz-timeline/SKILL.md) - for time-ordered records
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - heatmap and severity colour conventions
