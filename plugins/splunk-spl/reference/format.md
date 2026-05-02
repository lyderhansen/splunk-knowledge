# format — format subsearch results as search string

Source: Splunk Search Reference 8.2.12, page 320.

## Syntax

    | format [mvsep=<string>] [maxresults=<int>] [<row-prefix> <col-prefix> <col-sep> <col-suffix> <row-sep> <row-suffix>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| mvsep | no | OR | Separator for multivalue fields |
| maxresults | no | 0 | Max results to format (0 = unlimited) |

Default formatting produces: `((field1="val1") AND (field2="val2")) OR ((field1="val3") AND (field2="val4"))`

## Examples

### Explicit format in subsearch

```spl
index=main [search index=threats | fields src | format]
```

### Custom separators

```spl
| format "(" "(" "AND" ")" "OR" ")"
```

## Gotchas

- **Implicit in subsearches:** Subsearches automatically apply `| format` before returning to the outer search. You rarely need to call it explicitly.
- **Large results produce long strings:** Thousands of values create very long search strings that may hit search length limits.

## See also

- `return.md` — more controlled subsearch output
