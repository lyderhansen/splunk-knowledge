# untable — unpivot wide table to long format

Source: Splunk Search Reference 10.2.0

## Syntax

    | untable <x-field> <y-name-field> <y-data-field>

All three arguments are required and positional.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `x-field` | Yes | — | Row identifier field (kept as-is in every output row) |
| `y-name-field` | Yes | — | Name for the new field that will hold the original column names |
| `y-data-field` | Yes | — | Name for the new field that will hold the original cell values |

## Usage

`untable` is a **distributable streaming** command. It converts a wide (pivoted) table into
long format: each input column (except `x-field`) becomes one output row per original row.
This is the inverse of `xyseries`.

Use case: data returned by `chart`, `xyseries`, or `top` has columns per category. `untable`
normalises it back to a `stats`-style layout for further aggregation or visualization.

**Duplicate row values:** when `untable` output is fed back into `xyseries`, duplicate
x-field values are collapsed. Use `streamstats count AS row_num` to create a unique key
before the round-trip if all rows must be preserved.

## Examples

### Basic: unpivot a top command result

    sourcetype=access_combined status=200 action=purchase
    | top categoryId
    | untable categoryId calculation value

Input has columns `categoryId`, `count`, `percent`. Output has three columns:
`categoryId`, `calculation` (holds "count" or "percent"), `value` (holds the number).

### Round-trip: pivot then unpivot

    index=main | stats count by host, sourcetype
    | xyseries host sourcetype count
    | untable host sourcetype count

### Normalize chart output for further stats

    index=web | chart count by status, host
    | untable status metric_name metric_value
    | stats avg(metric_value) by metric_name

## Gotchas

- **All non-x-field columns become rows** — `untable` transforms every column except
  `x-field`, including any internal fields that may have leaked through. Trim with
  `| fields <x-field>, <col1>, <col2>` before `untable` to control output.
- **`y-name-field` and `y-data-field` are output field names you choose** — they do not
  need to match any existing field. Pick names that make sense for downstream use.
- **Duplicate values after round-trip** — if `untable` output is re-pivoted with `xyseries`
  and `x-field` values are not unique, rows are silently merged/dropped. Add a row number.
- **String values** — `untable` does not cast types; numeric columns become strings in
  `y-data-field`. Use `eval y_data=tonumber(y_data)` if arithmetic is needed downstream.

## Tips

- Use `untable` to normalise `top` or `chart` output before feeding it into a `stats`
  aggregation that expects long-format data.
- Pair with `where isnotnull(metric_value)` to drop empty cells that result from sparse
  pivoted tables.

## See also

- `xyseries.md` — inverse: long-to-wide pivot for charting
- `transpose.md` — swap rows and columns (different reshape)
- `chart.md` — often the source of wide tables that need `untable`
