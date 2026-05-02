# fillnull — replace null field values with a specified fill value

Source: Splunk Search Reference 8.2.12, page 311.

## Syntax

    | fillnull [value=<string>] [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `value=<string>` | no | `"0"` | The string to substitute for null values. |
| `<field-list>` | no | all fields | Space-delimited list of field names to fill. If omitted, all fields are filled. |

## Usage

`fillnull` is a **distributable streaming command**. It replaces null (missing) field values with
the specified fill string. It does not replace empty strings (`""`) — only true nulls.

The default fill value is `"0"` (the string zero). To fill with a different value, specify
`value=<string>`. The fill value is always treated as a string.

`fillnull` is commonly used after `stats`, `timechart`, or `chart` to ensure that all rows/columns
have values, preventing gaps in time series charts and avoiding NULL-propagation in subsequent
`eval` expressions.

## Examples

### Fill all null fields with zero

    | timechart span=1h count by sourcetype
    | fillnull value=0

### Fill specific fields only

    | stats sum(bytes) AS bytes, count by host
    | fillnull value=0 bytes count

### Fill with a placeholder string

    | stats dc(user) AS users by src_country
    | fillnull value="unknown" src_country

### Dashboard-specific pattern: prevent gap lines in time series

    index=access_* | timechart span=15m count by status
    | fillnull value=0
    | eval status_4xx = '400' + '401' + '403' + '404'    -- safe after fillnull

## Gotchas

- **Does not replace empty strings** — `fillnull` targets only `null()` values. An empty string
  `""` is not null. To also replace empty strings, follow with:
  `| eval field = if(field="", "replacement", field)`

- **Always fills with a string** — even `value=0` produces the string `"0"`, not the integer `0`.
  If you need numeric zero for math, follow with: `| eval field = tonumber(field)`.

- **Default value is `"0"`, not `null()`** — omitting `value=` fills with string zero, which may
  create unexpected labels in categorical fields. Always specify `value=` explicitly.

- **Field list is space-delimited, not comma-delimited** — `| fillnull value=0 bytes,count` does
  not work; use `| fillnull value=0 bytes count` (spaces only).

## See also

- `filldown.md` — propagate the last non-null value forward through events
- `eval.md` — `coalesce()`, `if(isnotnull(...))` for conditional null handling
- `replace.md` — replace specific non-null values
