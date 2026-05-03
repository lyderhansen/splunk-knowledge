# xyseries — pivot stats output for charting

Source: Splunk Search Reference 10.2.0

## Syntax

    | xyseries <x-field> <y-name-field> <y-data-field>
        [sep=<string>]
        [grouped=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `x-field` | Yes | — | Field used as the X axis (row key in output) |
| `y-name-field` | Yes | — | Field whose distinct values become output column headers |
| `y-data-field` | Yes | — | Field whose values fill the columns |
| `sep` | No | (none) | Separator string when multiple `y-name-field` values map to the same cell |
| `grouped` | No | false | If true, groups results (transforming mode); if false, distributable streaming |

## Usage

`xyseries` converts long-format (stats-style) data into a wide (chart-ready) format by
pivoting the distinct values of `y-name-field` into separate columns. It is the inverse of
`untable`.

When `grouped=false` (default), `xyseries` is a distributable streaming command and runs on
indexers. When `grouped=true`, it is a transforming command and runs on the search head.

**Duplicate x-field values are collapsed** — if the same `x-field` value appears more than
once in the input, only one row is retained (the last value wins). Use `streamstats` to add
a unique row key before pivoting if deduplication is unacceptable.

## Examples

### Pivot event counts by sourcetype over time

    index=main | stats count by _time, sourcetype
    | xyseries _time sourcetype count

Output: one row per `_time` value, one column per `sourcetype`, cells contain count.

### Build chart-ready data from stats

    index=web | stats sum(bytes) AS bytes by host, status
    | xyseries host status bytes

### Reformat top output for a stacked bar chart

    sourcetype=access_combined | top limit=5 action by host
    | xyseries host action count

### Round-trip back to long format

    ... | xyseries host sourcetype count
    | untable host sourcetype count

## Gotchas

- **Duplicate x-field values are silently dropped** — if `x-field` is not unique, only one
  row survives per value. Pre-aggregate with `stats` or add a row number key first.
- **Column count explosion** — if `y-name-field` has many distinct values, the result can
  have hundreds of columns and become very wide. Limit with `| where` or `top` on the
  y-name-field first.
- **`grouped=true` changes command type** — the default streaming mode may produce
  different results than `grouped=true` when input is already partially aggregated. Use
  `grouped=true` only when you know you need it.
- **Values must be scalar** — multivalue fields in `y-data-field` produce unpredictable
  output. Use `mvindex` or `mv` functions to reduce to a single value first.

## Tips

- `xyseries` is the fastest way to reshape `stats` output into something a `chart`
  visualization can consume when `chart` itself is not an option.
- For dashboard panels: follow with `rename` to give columns human-readable headers.

## See also

- `untable.md` — inverse: wide-to-long unpivot
- `chart.md` — often produces chart-ready pivoted output directly without a separate step
- `stats.md` — source of the long-format data that `xyseries` pivots
