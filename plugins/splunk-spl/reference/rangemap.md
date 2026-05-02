# rangemap — map numeric values to named ranges

Source: Splunk Search Reference 8.2.12, page 460.

## Syntax

    | rangemap field=<field> <range-name>=<min>-<max> [<range-name>=<min>-<max>]... [default=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Numeric field to classify |
| range-name=min-max | yes | — | Named ranges (e.g., `low=0-30 mid=31-70 high=71-100`) |
| default | no | "None" | Value when no range matches |

## Examples

```spl
index=main | stats avg(cpu_pct) AS cpu by host
| rangemap field=cpu low=0-30 medium=31-70 high=71-100 default=critical
```

## See also

- `eval.md` — `case()` for more complex classification
- `gauge.md` — gauge visualization ranges
