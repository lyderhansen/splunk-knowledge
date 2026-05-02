# transpose — swap rows and columns

Source: Splunk Search Reference 8.2.12, page 605.

## Syntax

    | transpose [<int>] [column_name=<string>] [header_field=<field>] [include_empty=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| int | no | 5 | Max columns to transpose |
| column_name | no | "column" | Name for the new column header field |
| header_field | no | — | Use this field's values as new column headers |

## Examples

```spl
| stats count by sourcetype | transpose
```

## Gotchas

- **Default transposes only 5 columns.** Increase with `| transpose 20` for wider tables.

## See also

- `untable.md` — unpivot (more controlled)
- `xyseries.md` — pivot for charting
