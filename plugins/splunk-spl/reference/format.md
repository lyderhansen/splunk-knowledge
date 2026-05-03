# format — format subsearch results as a search string

Source: Splunk Search Reference 10.2.0

Takes the results of a subsearch and formats them into a single result placed in a field
called `search`. The output is a boolean SPL expression of the form:

    ((field1="val1") AND (field2="val2")) OR ((field1="val3") AND (field2="val4"))

This formatted string is then injected into the outer search as filter criteria.

**Implicit use:** `format` is called automatically at the end of every subsearch. You
rarely need to invoke it explicitly. It performs the same function as `return` but with
different output structure.

## Syntax

    | format [mvsep="<string>"] [maxresults=<int>] [emptystr="<string>"]
             ["<row-prefix>" "<col-prefix>" "<col-sep>" "<col-suffix>"
              "<row-sep>" "<row-suffix>"]

All six row/column string arguments must be specified together if any one is specified.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `mvsep` | No | `OR` | Separator to use between values of a multivalue field |
| `maxresults` | No | 0 (unlimited) | Maximum number of result rows to format |
| `emptystr` | No | `NOT( )` | Value output when the subsearch returns no results |
| `row-prefix` | No | `(` | String prepended to each row group |
| `col-prefix` | No | `(` | String prepended to each field=value pair |
| `col-sep` | No | `AND` | Separator between field=value pairs within a row |
| `col-suffix` | No | `)` | String appended to each field=value pair |
| `row-sep` | No | `OR` | Separator between row groups |
| `row-suffix` | No | `)` | String appended to each row group |

## Examples

### Implicit use in subsearch (most common)

    index=main [search index=threats | fields src_ip | format]

The `| format` at the end is optional here — it is added automatically. Shown explicitly
for clarity.

### Filter main search using a lookup-populated list

    index=web
    [| inputlookup blocked_users.csv | fields username | format]

### Custom separators for export to another system

    [search index=alerts | fields host, severity
     | format "(" "(" "OR" ")" "AND" ")"]

### Handle empty subsearch result explicitly

    [search index=exceptions | fields error_code
     | format maxresults=100 emptystr="error_code=NONE"]

## Gotchas

- **Subsearches auto-apply `format`** — adding an explicit `| format` at the end of a
  subsearch is usually redundant. The auto-applied default uses `AND` between columns and
  `OR` between rows.
- **Large result sets generate very long search strings** — hundreds or thousands of rows
  produce a formatted string that can hit Splunk's maximum search string length
  (typically 10,500 characters for the `search` field). Use `maxresults` to cap output, or
  prefer `join` / `lookup` for large sets.
- **`emptystr` default is `NOT( )`** — when the subsearch returns no results, `format`
  outputs `NOT( )` which, when injected into the outer search, matches nothing (returns
  zero events). This is often the correct behavior, but can be confusing if you expected
  a "pass-through" result.
- **`format` output is a string, not a structured expression** — the generated `search`
  field value is a raw SPL string. It is not validated until the outer search parses it.
  Malformed values in source fields (e.g., quotes) can break the generated expression.
- **All six row/column arguments must be provided together** — you cannot override only
  `col-sep` without providing all other positional string arguments.

## Tips

- Use `return` instead of `format` when you need more control over what fields are
  returned from the subsearch — `return` lets you specify field names and limits explicitly.
- To debug what `format` generates, run the subsearch standalone with `| format` and look
  at the `search` field value.

## See also

- `return.md` — alternative subsearch output with explicit field control
- `append.md` — add subsearch rows without field-matching injection
