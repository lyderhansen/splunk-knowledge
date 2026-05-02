# chart — pivot-table aggregation with an arbitrary field as the X-axis

Source: Splunk Search Reference 8.2.12, page 216.

## Syntax

    | chart [limit=<int>] [cont=<bool>]
            <stats-func>(<field>) [AS <alias>]...
            OVER <row-split-field>
            [BY <column-split-field>]

    -- Alternative form (BY only, no OVER):
    | chart <stats-func>(<field>) BY <row-split> [<column-split>]

`chart` is a transforming command. Unlike `timechart`, the X-axis is any field you choose
(not `_time`). An optional second field creates a column-split (pivot) table.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-func(field)` | Yes | — | One or more aggregation functions |
| `OVER row-split` | Yes* | — | Field whose values become the X-axis / row labels |
| `BY column-split` | No | — | Field whose distinct values become column headers (series); limited to top 10 by default |
| `AS alias` | No | function expression | Rename the output field |
| `limit=<int>` | No | top10 | Max column-split values; `limit=0` = all |
| `cont=<bool>` | No | true | Fill gaps in a numerical X-axis |
| `agg=<stats-agg-term>` | No | — | Override the aggregation function used for `limit` scoring |

*Required unless using `sparkline` aggregation.

## Examples

### Max delay by site

    index=network
    | chart max(delay) OVER site

### Sales by product and quarter (pivot table)

    source="sales.csv"
    | chart sum(sales) BY products quarter

### Ratio of avg to max using eval expression

    index=perf sourcetype=cpu
    | chart eval(avg(size)/max(delay)) AS ratio BY host user

### Dashboard-specific pattern: heatmap source data

Build a two-dimensional table suitable for a heatmap or punchcard visualization:

    index=web sourcetype=access_combined
    | chart count BY date_hour date_wday

## Gotchas

- **Cannot use the same field in the function and as the row-split** — `| chart sum(A) by A`
  is invalid. Alias the field first: `| eval A1=A | chart sum(A) by A1`.

- **Column-split defaults to top 10** — like `timechart`, non-shown values are merged into
  an "OTHER" column unless `limit=0` is set and `useother=f` is added.

- **`chart` vs `stats`** — `stats` produces one row per unique combination of BY fields;
  `chart` pivots one of those fields into columns. Use `chart` when you want a crosstab
  layout for a visualization.

## See also

- `timechart.md` — like chart but always uses `_time` as the X-axis
- `stats.md` — aggregation without pivoting
- `top.md` — simplified frequency count with percentage
