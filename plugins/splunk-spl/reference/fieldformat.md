# fieldformat — format field display without changing the underlying value

Source: Splunk Search Reference 8.2.12, page 301.

## Syntax

    | fieldformat <field>=<eval-expression>

Each `fieldformat` call applies one expression to one field. Chain multiple calls for multiple fields.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | yes | — | Name of an existing or new field. Non-wildcarded. |
| `<eval-expression>` | yes | — | Any valid eval expression. The result changes only how the value is displayed, not the stored value. |

## Usage

`fieldformat` is a **distributable streaming command**. It changes the rendered appearance of a field
without modifying the underlying value. Downstream `eval`, `stats`, and `where` commands still see
the original value. This makes it ideal for display formatting at the end of a pipeline.

`fieldformat` does **not** apply to data exported by `outputcsv` or `outputlookup` — those commands
use the original unformatted values.

Place `fieldformat` as late in the pipeline as possible, after all calculations are complete.

## Examples

### Format numbers with commas

    | metadata type=sourcetypes
    | table sourcetype totalCount
    | fieldformat totalCount=tostring(totalCount, "commas")

### Format epoch timestamp as readable date

    ... | fieldformat start_time = strftime(start_time, "%H:%M:%S")

### Add currency symbol

    ... | fieldformat totalSales = "$" . tostring(totalSales, "commas")

### Format multiple fields (chained calls)

    | metadata type=sourcetypes
    | rename totalCount AS Count firstTime AS "First Event" lastTime AS "Last Event"
    | table sourcetype Count "First Event" "Last Event"
    | fieldformat Count = tostring(Count, "commas")
    | fieldformat "First Event" = strftime('First Event', "%c")
    | fieldformat "Last Event"  = strftime('Last Event', "%c")

## Gotchas

- **Does not affect exports** — `outputcsv` / `outputlookup` always export the raw value, not the
  formatted display value. Use `eval` instead if you need the formatted string in exported data.

- **Field names with spaces must be quoted** — `fieldformat "Last Event" = strftime(...)` requires
  the field name in double quotes when it contains spaces.

- **Use `eval` for persistent string conversion** — if a later command needs the formatted string
  as a value (e.g., for `lookup` key matching), use `eval` not `fieldformat`.

## See also

- `eval.md` — compute or transform field values permanently
- `rename.md` — rename fields for display
- `table.md` — select and order columns
