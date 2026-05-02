# accum — running total of a numeric field

Source: Splunk Search Reference 8.2.12, page 176.

## Syntax

    | accum <field> [AS <newfield>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Numeric field to accumulate |
| AS newfield | no | overwrites field | Output field name |

## Examples

```spl
index=main | timechart span=1d count | accum count AS cumulative
```

## See also

- `streamstats.md` — `sum()` for more flexible cumulative calculations
- `delta.md` — difference instead of sum
