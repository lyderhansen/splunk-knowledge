# gauge — transform results for gauge visualization

Source: Splunk Search Reference 8.2.12, page 327.

## Syntax

    | gauge <field> <range1> <range2> [<range3>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Numeric field to display on gauge |
| rangeN | yes | — | Range boundaries (ascending order) |

## Examples

```spl
index=main | stats avg(cpu_pct) AS cpu | gauge cpu 0 30 70 90 100
```

## See also

- `rangemap.md` — map values to named ranges
