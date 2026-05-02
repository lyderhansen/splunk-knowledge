# addcoltotals — append a column-sum summary row to the result table

Source: Splunk Search Reference 8.2.12, page 177.

## Syntax

    | addcoltotals [labelfield=<field>] [label=<string>] [<wc-field-list>]

Appends a single new row at the end of the result set. Each cell in the new row contains
the sum of all numeric values in that column. Non-numeric values are ignored.
This is equivalent to `addtotals col=t row=f`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `wc-field-list` | No | all numeric fields | Space-delimited list of fields to sum; wildcards allowed (e.g. `*size`) |
| `labelfield=<field>` | No | (none) | Existing field in which to write the label text for the summary row |
| `label=<string>` | No | `Total` | Text to write into `labelfield` in the summary row; has no effect without `labelfield` |

## Examples

### Sum all numeric fields, label the row

    index=web sourcetype=access_combined
    | chart count AS views by productId
    | addcoltotals labelfield=productId label=ALL

### Sum two specific fields in a table

    sourcetype=access_*
    | table userId bytes avgTime duration
    | addcoltotals bytes duration

### Sum fields matching a pattern

    index=_internal source="metrics.log" group=pipeline
    | stats avg(cpu_seconds) by processor
    | addcoltotals labelfield=processor

## Gotchas

- **`addcoltotals` adds a row, not a column** — despite the name, it appends a totals
  *row* (not a new column) that contains the column-wise sums. To add a totals *column*
  (row-wise sum), use `addtotals row=t col=f`.

- **The summary row is a real event** — downstream `sort`, `head`, or `eval` will include
  the totals row. Add `addcoltotals` as the final step before display to avoid it
  interfering with other pipeline logic.

- **`label` has no effect without `labelfield`** — specifying `label="Grand Total"` alone
  does nothing; you must also specify which field column receives that label text.

## See also

- `addtotals.md` — adds both row totals (columns) and column totals (rows) in one command
- `stats.md` — source aggregation typically preceding `addcoltotals`
- `chart.md` — pivot table that commonly feeds into `addcoltotals`
