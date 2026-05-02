# addtotals — append a row and/or column of numeric totals to a result table

Source: Splunk Search Reference 8.2.12, page 181.

## Syntax

    | addtotals [row=<bool>] [col=<bool>]
                [fieldname=<string>] [label=<string>] [labelfield=<field>]
                [<field-list>]

Computes the sum of numeric fields across each row (appends a totals column) and/or
appends a summary row at the end of the results. Non-numeric values are treated as zero.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | No | all numeric fields | Fields to include in the totals; wildcards allowed (e.g. `value*`) |
| `row=<bool>` | No | true | Add a column containing the row total |
| `col=<bool>` | No | false | Append a summary row containing column totals |
| `fieldname=<string>` | No | `Total` | Name of the new totals column (row mode) |
| `label=<string>` | No | `Total` | Label placed in the `labelfield` of the summary row (col mode) |
| `labelfield=<field>` | No | (none) | Which existing field to write the label into in the summary row |

## Examples

### Add a row total across all numeric fields

    index=sales sourcetype=daily_revenue
    | chart sum(revenue) BY region quarter
    | addtotals

### Add a column total row with label

    index=sales sourcetype=daily_revenue
    | chart sum(revenue) BY region quarter
    | addtotals col=t row=f labelfield=region label="ALL REGIONS"

### Total only specific fields using a wildcard

    index=perf sourcetype=cpu_metrics
    | stats avg(cpu_*) by host
    | addtotals row=t fieldname=cpu_sum cpu_*

## Gotchas

- **`addtotals` totals what is visible in the table** — it operates on the current result
  set, not the original events. Call it after all aggregations and reshaping are complete.

- **`col=t` appends a physical row** — downstream commands like `sort` or `eval` will
  process the summary row as a regular event. If the summary row would break downstream
  logic, add it as the very last step before display.

- **Non-numeric fields are silently skipped** — string fields are excluded from the
  summation. Use `fieldname` or an explicit field list to keep the output clean.

## See also

- `addcoltotals.md` — column-only variant (appends only a column total row)
- `stats.md` — source aggregations that `addtotals` typically post-processes
- `chart.md` — typical upstream pivot table that `addtotals` enhances
