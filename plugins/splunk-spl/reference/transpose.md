# transpose — swap rows and columns

Source: Splunk Search Reference 10.2.0

## Syntax

    | transpose [<int>]
        [column_name=<string>]
        [header_field=<field>]
        [include_empty=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `int` | No | 5 | Number of rows to transpose. Use `0` for unlimited. |
| `column_name` | No | `column` | Name for the first output column (holds original field names) |
| `header_field` | No | `row 1`, `row 2`, … | Field whose values become the new column headers |
| `include_empty` | No | true | Include fields with empty values in output |

## Usage

`transpose` converts rows into columns and columns into rows. The first output column
(`column` by default) contains the original field names. Each subsequent output column
(named `row 1`, `row 2`, etc. by default) contains the field values from the corresponding
input row.

Use `header_field=<field>` to use an existing field's values as column headers instead of
the default `row 1`, `row 2` names.

## Examples

### Basic: flip a stats table

    index=web sourcetype=access_combined
    | stats count by host
    | transpose

Output has one row per original column, with host values as `row 1`, `row 2`, etc.

### Use a field value as column header

    sourcetype=access_combined status=200
    | chart count BY host
    | transpose header_field=host

### Transpose wider result set

    | stats count by sourcetype | transpose 20

### All rows, no limit

    | stats count by sourcetype | transpose 0

## Gotchas

- **Default limit is 5 rows** — if your table has more than 5 rows, the extra rows are
  silently dropped. Always specify `| transpose 0` or an explicit count for wide tables.
- **Internal fields are included by default** — `include_empty=true` means fields with
  blank values appear as rows. Use `include_empty=false` or prefix with `| fields -_*`
  to clean up the output.
- **`header_field` must exist in the input** — if the field is missing or misspelled, column
  headers fall back to `row 1`, `row 2`, etc. without warning.
- **Result ordering** — rows are output in the order they appear in the input. Sort before
  `transpose` if column order matters.

## Tips

- When building a "summary row" view for a dashboard panel, `transpose 0` followed by
  `rename column AS Metric` gives a clean vertical KPI table.
- Combine with `untable` for round-trip transforms: `xyseries → transpose → untable`
  can be useful for reshaping data for specific visualizations.

## See also

- `untable.md` — unpivot (wide-to-long); inverse of `xyseries`
- `xyseries.md` — pivot for charting (long-to-wide)
- `chart.md` — often produces chart-ready pivoted output directly
