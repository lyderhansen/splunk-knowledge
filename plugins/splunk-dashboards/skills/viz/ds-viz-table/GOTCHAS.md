# splunk.table — gotchas

## 1. `showInternalFields: true` by default — `_color_rank` leaks

Always pair `_color_rank` (or any `_`-prefixed rank field) with
`showInternalFields: false`. Otherwise the rank column shows in the
rendered output.

## 2. `_time` stays visible even with `showInternalFields: false`

To hide it, exclude in SPL:

```spl
| fields - _time
```

## 3. `tableFormat.align` is 2D, `columnFormat.<col>.align` is 1D

They are NOT interchangeable. 2D is row × column. 1D is one value
applied to every row of a single column.

## 4. `headerBackgroundColor` is a single hex, not an array

It applies to the whole header row.

## 5. Theme-default headers — DON'T set them at all

If you want the header to track theme (white-on-light, dark-on-dark),
**don't set `headerBackgroundColor` / `headerColor`**. The defaults
resolve through `themes.defaultHeaderBackgroundColor` per theme.
Hardcoding `#0B0C0E` makes the header unreadable in light theme.

## 6. `backgroundColor` on the table ≠ panel chrome

It tints only the cell area. Panel chrome (header bar, surrounding
container) has its own theme defaults.

## 7. Pagination requires a paginated data source

`paginateDataSourceKey` is not a UI control; it's a contract with the
SPL backend. The data source must support pagination.

## 8. dataSource name regex: `^[A-Za-z0-9 \-_.]+$`

The Dashboard Studio editor enforces this. Slashes, parentheses, and
`/` will trip the picker even though JSON parses fine:

- ❌ `"sparkline - hosts with cpu/mem trends"`
- ✅ `"sparkline - hosts with cpu mem trends"`

## 9. SparklineCell auto-detects only TRUE multivalue columns

```spl
| eval x = "1,2,3" | makemv ...    # ❌ row 1 only
| stats sparkline(...) by host     # ✅ all rows
```

`makemv` only types the first row reliably. The first row paints as a
sparkline; rows 2..N stay as plain comma-strings or empty.

**Symptom:** "sparkline column only renders on `web-01`".
**Fix:** replace `eval | makemv` pair with `stats sparkline(...) by <key>`.

## 10. `tableFormat.sparklineColors` cannot deliver per-column colouring

Even though Splunk types it as `string[][]` and docs say "Array of
colors for sparkline line of **each row of the table**", in production
the only practical shape is a 1D context array fed through DOS `pick()`
or `rangeValue()` — and that distributes **per row, not per column**.

For per-column colour (CPU=green, MEM=blue, REQ=orange, ERR=pink), you
**must** use `columnFormat.<col>.sparklineColors`. Panel 8b is the
canonical reference.

## 11. `columnFormat.<col>.sparklineColors` is `string[]` "list of colors for **each column**"

NOT "one entry per row". Single-entry `["#33FF99"]` is the canonical
shape. The 1D array is for multi-series sparklines within a single mv
cell, not row-by-row.

## 12. "Only row 1 has a coloured sparkline" is almost always a data-density problem

The renderer needs enough non-zero datapoints across the dashboard
time window before it commits to your `sparklineColors`.

**Diagnosis:** add `| eval mv = mvcount(trend_cpu)` to the SPL.
- 3 elements per row = `##__SPARKLINE__##` marker + value + 0 → bad density.
- ≥20 elements per row = good.

**Fix:** widen synthetic time range to match dashboard's `earliest..latest`.
With `earliest = "-24h@h"` you need ~288 events at 5-minute spacing,
then `sparkline(avg(metric), 30m)` produces ~51 real datapoints per row.

See SPARKLINE-DATA.md for the canonical recipe.

## 13. Threshold half-step rule

For `_color_rank` integer data, use **half-step thresholds** so the
rank lands cleanly inside one band:

```json
[
  { "to": 1.5,             "value": "..." },
  { "from": 1.5, "to": 2.5,"value": "..." }
]
```

Aligning thresholds on the integer values themselves causes the
boundary case to land in the wrong bucket (top-down + `to` exclusive).

## 14. `sparklineTypes` enum: `line` and `area` only

There is **no `bar` sparkline**. If you need bar-shaped inline trends,
render a tiny `splunk.column` viz inside a layout cell instead.
